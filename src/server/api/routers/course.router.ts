import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { Errors, trpcSafe } from "@/lib/errors";
import { buildPaginationMeta, getPaginationParams } from "@/lib/utils";
import { course, courseVideo, enrollment, liveClass } from "@/server/db/schema";
import { AccessService } from "@/server/services/access.service";
import { PaymentService } from "@/server/services/payment.service";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const courseRouter = createTRPCRouter({
	// ── Public: list published courses ────────────────────────────────────────
	list: publicProcedure
		.input(
			z
				.object({
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

				const [rows, countResult] = await Promise.all([
					ctx.db
						.select({
							id: course.id,
							title: course.title,
							slug: course.slug,
							shortDescription: course.shortDescription,
							thumbnailUrl: course.thumbnailUrl,
							price: course.price,
							durationDays: course.durationDays,
							createdAt: course.createdAt,
						})
						.from(course)
						.where(eq(course.status, "published"))
						.orderBy(desc(course.createdAt))
						.limit(limit)
						.offset(offset),

					ctx.db
						.select({ count: sql<number>`count(*)::int` })
						.from(course)
						.where(eq(course.status, "published")),
				]);

				return {
					items: rows,
					pagination: buildPaginationMeta(
						countResult[0]?.count ?? 0,
						page,
						pageSize,
					),
				};
			});
		}),

	// ── Public: course detail ─────────────────────────────────────────────────
	getBySlug: publicProcedure
		.input(z.object({ slug: z.string() }))
		.query(async ({ ctx, input }) => {
			return trpcSafe(async () => {
				const [row] = await ctx.db
					.select()
					.from(course)
					.where(
						and(eq(course.slug, input.slug), eq(course.status, "published")),
					)
					.limit(1);

				if (!row) throw Errors.notFound("Course");

				// Preview videos (free sample) — always public
				const previewVideos = await ctx.db
					.select({
						id: courseVideo.id,
						title: courseVideo.title,
						duration: courseVideo.duration,
						sortOrder: courseVideo.sortOrder,
					})
					.from(courseVideo)
					.where(
						and(
							eq(courseVideo.courseId, row.id),
							eq(courseVideo.isPreview, true),
						),
					)
					.orderBy(courseVideo.sortOrder);

				return { ...row, previewVideos };
			});
		}),

	// ── Protected: check enrollment status for current user ───────────────────
	getEnrollmentStatus: protectedProcedure
		.input(z.object({ courseId: z.string() }))
		.query(async ({ ctx, input }) => {
			return trpcSafe(async () => {
				const access = await AccessService.getEnrollmentStatus(
					ctx.session.user.id,
					input.courseId,
				);
				return access; // null if not enrolled
			});
		}),

	// ── Protected: get full course content (enrolled users only) ─────────────
	getContent: protectedProcedure
		.input(z.object({ courseId: z.string() }))
		.query(async ({ ctx, input }) => {
			return trpcSafe(async () => {
				const access = await AccessService.assertCourseAccess(
					ctx.session.user.id,
					input.courseId,
				);

				const [videos, liveClasses] = await Promise.all([
					ctx.db
						.select()
						.from(courseVideo)
						.where(eq(courseVideo.courseId, input.courseId))
						.orderBy(courseVideo.sortOrder),

					ctx.db
						.select()
						.from(liveClass)
						.where(eq(liveClass.courseId, input.courseId))
						.orderBy(liveClass.scheduledAt),
				]);

				// Live class join URLs are only exposed if enrollment is still active
				const safeLiveClasses = liveClasses.map((lc) => ({
					...lc,
					joinUrl: access.canWatchLive ? lc.joinUrl : null,
				}));

				return {
					access: {
						canWatchLive: access.canWatchLive,
						canWatchRecordings: access.canWatchRecordings,
						canAccessAssessment: access.canAccessAssessment,
						daysRemaining: access.daysRemaining,
						assessmentUnlocksAt: access.assessmentUnlocksAt,
						expiresAt: access.enrollment.expiresAt,
					},
					videos,
					liveClasses: safeLiveClasses,
				};
			});
		}),

	// ── Protected: initiate course purchase ───────────────────────────────────
	initiatePurchase: protectedProcedure
		.input(z.object({ courseId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			return trpcSafe(async () => {
				// Prevent duplicate enrollment
				const existing = await AccessService.getEnrollmentStatus(
					ctx.session.user.id,
					input.courseId,
				);
				if (existing && existing.enrollment.status === "active") {
					throw Errors.alreadyRegistered("course");
				}

				return PaymentService.createOrder({
					userId: ctx.session.user.id,
					purpose: "course",
					entityId: input.courseId,
				});
			});
		}),

	// ── Protected: verify payment after Razorpay checkout ────────────────────
	verifyPurchase: protectedProcedure
		.input(
			z.object({
				razorpayOrderId: z.string(),
				razorpayPaymentId: z.string(),
				razorpaySignature: z.string(),
			}),
		)
		.mutation(async ({ ctx: _ctx, input }) => {
			return trpcSafe(async () => {
				return PaymentService.verifyPayment(input);
			});
		}),

	// ── Protected: my enrolled courses ────────────────────────────────────────
	myEnrollments: protectedProcedure.query(async ({ ctx }) => {
		return trpcSafe(async () => {
			const rows = await ctx.db
				.select({
					enrollmentId: enrollment.id,
					status: enrollment.status,
					enrolledAt: enrollment.enrolledAt,
					expiresAt: enrollment.expiresAt,
					assessmentUnlocksAt: enrollment.assessmentUnlocksAt,
					course: {
						id: course.id,
						title: course.title,
						slug: course.slug,
						thumbnailUrl: course.thumbnailUrl,
					},
				})
				.from(enrollment)
				.innerJoin(course, eq(enrollment.courseId, course.id))
				.where(eq(enrollment.userId, ctx.session.user.id))
				.orderBy(desc(enrollment.enrolledAt));

			return rows;
		});
	}),
});
