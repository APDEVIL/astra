import { and, desc, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";
import { Errors, trpcSafe } from "@/lib/errors";
import { guidanceSession, subscription } from "@/server/db/schema";
import { AccessService } from "@/server/services/access.service";
import {
	createTRPCRouter,
	protectedProcedure,
	subscriptionProcedure,
} from "../trpc";

export const subscriptionRouter = createTRPCRouter({
	// ── Get current user's subscription status (any auth'd user) ───────────
	// Used to drive the premium sidebar visibility flag on the client.
	getStatus: protectedProcedure.query(async ({ ctx }) => {
		return trpcSafe(async () => {
			const sub = await AccessService.getActiveSubscription(
				ctx.session.user.id,
			);
			return {
				isActive: sub !== null,
				subscription: sub
					? {
							id: sub.id,
							astraId: sub.astraId,
							startDate: sub.startDate,
							endDate: sub.endDate,
							status: sub.status,
						}
					: null,
			};
		});
	}),

	// ── List upcoming + past guidance sessions ──────────────────────────────
	// Subscription-gated. Returns join URL for upcoming, recording for past.
	listSessions: subscriptionProcedure
		.input(
			z
				.object({
					filter: z.enum(["upcoming", "past", "all"]).default("all"),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			return trpcSafe(async () => {
				const now = new Date();
				const filter = input?.filter ?? "all";

				const conditions = [];
				if (filter === "upcoming")
					conditions.push(gte(guidanceSession.scheduledAt, now));
				if (filter === "past")
					conditions.push(lte(guidanceSession.scheduledAt, now));

				const rows = await ctx.db
					.select()
					.from(guidanceSession)
					.where(conditions.length > 0 ? and(...conditions) : undefined)
					.orderBy(desc(guidanceSession.scheduledAt));

				return rows.map((s) => ({
					...s,
					// Hide join URL for past sessions; show recording URL instead
					joinUrl: s.isCompleted ? null : s.joinUrl,
				}));
			});
		}),

	// ── Get a single guidance session ───────────────────────────────────────
	getSession: subscriptionProcedure
		.input(z.object({ sessionId: z.string() }))
		.query(async ({ ctx, input }) => {
			return trpcSafe(async () => {
				const [row] = await ctx.db
					.select()
					.from(guidanceSession)
					.where(eq(guidanceSession.id, input.sessionId))
					.limit(1);

				if (!row) throw Errors.notFound("Guidance session");

				return {
					...row,
					joinUrl: row.isCompleted ? null : row.joinUrl,
				};
			});
		}),

	// ── Daily insights feed ─────────────────────────────────────────────────
	// Returns sessions that have a dailyInsight field populated.
	// Shown in the premium sidebar's "Daily Insights" tab.
	getDailyInsights: subscriptionProcedure
		.input(
			z
				.object({
					limit: z.number().int().min(1).max(30).default(10),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			return trpcSafe(async () => {
				const rows = await ctx.db
					.select({
						id: guidanceSession.id,
						title: guidanceSession.title,
						dailyInsight: guidanceSession.dailyInsight,
						scheduledAt: guidanceSession.scheduledAt,
						hostName: guidanceSession.hostName,
					})
					.from(guidanceSession)
					.where(
						// Only sessions that have an insight written
						and(eq(guidanceSession.isCompleted, true)),
					)
					.orderBy(desc(guidanceSession.scheduledAt))
					.limit(input?.limit ?? 10);

				// Filter at query layer — Drizzle doesn't have a simple isNotNull shorthand
				// in all versions, so we post-filter here
				return rows.filter((r) => r.dailyInsight !== null);
			});
		}),
});
