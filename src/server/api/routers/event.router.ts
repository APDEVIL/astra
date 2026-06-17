import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { Errors, trpcSafe } from "@/lib/errors";
import { buildPaginationMeta, getPaginationParams } from "@/lib/utils";
import {
	event,
	workshop,
	workshopParticipant,
	workshopUpdate,
} from "@/server/db/schema";
import { AccessService } from "@/server/services/access.service";
import { NotificationService } from "@/server/services/notification.service";
import { PaymentService } from "@/server/services/payment.service";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const eventRouter = createTRPCRouter({
	// ─── Events ───────────────────────────────────────────────────────────────

	listEvents: publicProcedure
		.input(
			z
				.object({
					status: z.enum(["upcoming", "ongoing", "completed"]).optional(),
					page: z.number().int().min(1).default(1),
					pageSize: z.number().int().min(1).max(50).default(DEFAULT_PAGE_SIZE),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			return trpcSafe(async () => {
				const { limit, offset, page, pageSize } = getPaginationParams(
					input ?? {},
				);
				const where = input?.status
					? eq(event.status, input.status)
					: undefined;

				const [rows, countResult] = await Promise.all([
					ctx.db
						.select()
						.from(event)
						.where(where)
						.orderBy(desc(event.startsAt))
						.limit(limit)
						.offset(offset),
					ctx.db
						.select({ count: sql<number>`count(*)::int` })
						.from(event)
						.where(where),
				]);

				const total = countResult[0]?.count ?? 0;

				return {
					items: rows,
					pagination: buildPaginationMeta(total, page, pageSize),
				};
			});
		}),

	getEvent: publicProcedure
		.input(z.object({ slug: z.string() }))
		.query(async ({ ctx, input }) => {
			return trpcSafe(async () => {
				const [row] = await ctx.db
					.select()
					.from(event)
					.where(eq(event.slug, input.slug))
					.limit(1);

				if (!row) throw Errors.notFound("Event");
				return row;
			});
		}),

	// ─── Workshops ────────────────────────────────────────────────────────────

	listWorkshops: publicProcedure
		.input(
			z
				.object({
					type: z.enum(["free", "paid"]).optional(),
					status: z.enum(["upcoming", "ongoing", "completed"]).optional(),
					page: z.number().int().min(1).default(1),
					pageSize: z.number().int().min(1).max(50).default(DEFAULT_PAGE_SIZE),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			return trpcSafe(async () => {
				const { limit, offset, page, pageSize } = getPaginationParams(
					input ?? {},
				);

				const conditions = [];
				if (input?.type) conditions.push(eq(workshop.type, input.type));
				if (input?.status) conditions.push(eq(workshop.status, input.status));
				const where = conditions.length > 0 ? and(...conditions) : undefined;

				const [rows, countResult] = await Promise.all([
					ctx.db
						.select({
							id: workshop.id,
							title: workshop.title,
							slug: workshop.slug,
							shortDescription: workshop.shortDescription,
							bannerUrl: workshop.bannerUrl,
							type: workshop.type,
							fee: workshop.fee,
							hostName: workshop.hostName,
							hostAvatarUrl: workshop.hostAvatarUrl,
							scheduledAt: workshop.scheduledAt,
							durationMinutes: workshop.durationMinutes,
							maxParticipants: workshop.maxParticipants,
							status: workshop.status,
						})
						.from(workshop)
						.where(where)
						.orderBy(desc(workshop.scheduledAt))
						.limit(limit)
						.offset(offset),
					ctx.db
						.select({ count: sql<number>`count(*)::int` })
						.from(workshop)
						.where(where),
				]);

				const total = countResult[0]?.count ?? 0;

				return {
					items: rows,
					pagination: buildPaginationMeta(total, page, pageSize),
				};
			});
		}),

	getWorkshop: publicProcedure
		.input(z.object({ slug: z.string() }))
		.query(async ({ ctx, input }) => {
			return trpcSafe(async () => {
				const [row] = await ctx.db
					.select()
					.from(workshop)
					.where(eq(workshop.slug, input.slug))
					.limit(1);

				if (!row) throw Errors.notFound("Workshop");

				// Confirmed participant count for capacity display
				const countResult = await ctx.db
					.select({ count: sql<number>`count(*)::int` })
					.from(workshopParticipant)
					.where(
						and(
							eq(workshopParticipant.workshopId, row.id),
							eq(workshopParticipant.status, "confirmed"),
						),
					);

				const confirmedParticipants = countResult[0]?.count ?? 0;

				return {
					...row,
					joinUrl: null, // only revealed after confirmation
					confirmedParticipants,
					isFull:
						row.maxParticipants !== null &&
						confirmedParticipants >= row.maxParticipants,
				};
			});
		}),

	registerWorkshop: protectedProcedure
		.input(z.object({ workshopId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			return trpcSafe(async () => {
				const userId = ctx.session.user.id;

				const [ws] = await ctx.db
					.select()
					.from(workshop)
					.where(eq(workshop.id, input.workshopId))
					.limit(1);

				if (!ws) throw Errors.notFound("Workshop");
				if (ws.status === "completed" || ws.status === "cancelled") {
					throw Errors.badRequest(
						"This workshop is no longer accepting registrations",
					);
				}

				// Check not already registered
				const [existing] = await ctx.db
					.select({ id: workshopParticipant.id })
					.from(workshopParticipant)
					.where(
						and(
							eq(workshopParticipant.workshopId, input.workshopId),
							eq(workshopParticipant.userId, userId),
						),
					)
					.limit(1);

				if (existing) throw Errors.alreadyRegistered("workshop");

				// Check participant cap
				if (ws.maxParticipants !== null) {
					const capResult = await ctx.db
						.select({ count: sql<number>`count(*)::int` })
						.from(workshopParticipant)
						.where(
							and(
								eq(workshopParticipant.workshopId, input.workshopId),
								eq(workshopParticipant.status, "confirmed"),
							),
						);

					const confirmedCount = capResult[0]?.count ?? 0;
					if (confirmedCount >= ws.maxParticipants) throw Errors.workshopFull();
				}

				if (ws.type === "free") {
					const [participant] = await ctx.db
						.insert(workshopParticipant)
						.values({
							workshopId: input.workshopId,
							userId,
							status: "confirmed",
							confirmedAt: new Date(),
						})
						.returning();

					await NotificationService.send({
						userId,
						type: "workshop_confirmed",
						title: "You're in! Workshop registration confirmed 🎉",
						body: `Your spot for "${ws.title}" is confirmed. Your ID: ${participant!.participantEventId}`,
						entityType: "workshop",
						entityId: input.workshopId,
						ctaUrl: `/workshops/${ws.slug}`,
						ctaLabel: "View workshop",
					});

					return { status: "confirmed" as const, participant };
				} else {
					const [participant] = await ctx.db
						.insert(workshopParticipant)
						.values({
							workshopId: input.workshopId,
							userId,
							status: "payment_pending",
						})
						.returning();

					const order = await PaymentService.createOrder({
						userId,
						purpose: "workshop",
						entityId: input.workshopId,
					});

					return { status: "payment_required" as const, participant, order };
				}
			});
		}),

	getMyRegistration: protectedProcedure
		.input(z.object({ workshopId: z.string() }))
		.query(async ({ ctx, input }) => {
			return trpcSafe(async () => {
				const [row] = await ctx.db
					.select()
					.from(workshopParticipant)
					.where(
						and(
							eq(workshopParticipant.workshopId, input.workshopId),
							eq(workshopParticipant.userId, ctx.session.user.id),
						),
					)
					.limit(1);

				return row ?? null;
			});
		}),

	getWorkshopUpdates: protectedProcedure
		.input(z.object({ workshopId: z.string() }))
		.query(async ({ ctx, input }) => {
			return trpcSafe(async () => {
				const access = await AccessService.assertWorkshopAccess(
					ctx.session.user.id,
					input.workshopId,
				);

				const [ws] = await ctx.db
					.select({
						joinUrl: workshop.joinUrl,
						title: workshop.title,
						scheduledAt: workshop.scheduledAt,
					})
					.from(workshop)
					.where(eq(workshop.id, input.workshopId))
					.limit(1);

				const updates = await ctx.db
					.select({
						id: workshopUpdate.id,
						title: workshopUpdate.title,
						body: workshopUpdate.body,
						attachmentUrl: workshopUpdate.attachmentUrl,
						attachmentLabel: workshopUpdate.attachmentLabel,
						createdAt: workshopUpdate.createdAt,
					})
					.from(workshopUpdate)
					.where(eq(workshopUpdate.workshopId, input.workshopId))
					.orderBy(desc(workshopUpdate.createdAt));

				return {
					workshop: ws,
					participantEventId: access.participantEventId,
					updates,
				};
			});
		}),

	myRegistrations: protectedProcedure.query(async ({ ctx }) => {
		return trpcSafe(async () => {
			return ctx.db
				.select({
					participantId: workshopParticipant.id,
					status: workshopParticipant.status,
					participantEventId: workshopParticipant.participantEventId,
					registeredAt: workshopParticipant.registeredAt,
					confirmedAt: workshopParticipant.confirmedAt,
					workshop: {
						id: workshop.id,
						title: workshop.title,
						slug: workshop.slug,
						type: workshop.type,
						scheduledAt: workshop.scheduledAt,
						status: workshop.status,
					},
				})
				.from(workshopParticipant)
				.innerJoin(workshop, eq(workshopParticipant.workshopId, workshop.id))
				.where(eq(workshopParticipant.userId, ctx.session.user.id))
				.orderBy(desc(workshopParticipant.registeredAt));
		});
	}),
});
