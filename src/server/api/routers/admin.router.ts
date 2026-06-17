import { createId } from "@paralleldrive/cuid2";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { z } from "zod";
import {
	ADMIN_PAGE_SIZE,
	ASTRA_ID_PREFIX,
	DEFAULT_SUBSCRIPTION_DAYS,
} from "@/lib/constants";
import { Errors, trpcSafe } from "@/lib/errors";
import {
	addDays,
	buildPaginationMeta,
	getPaginationParams,
	slugify,
} from "@/lib/utils";
import {
	achievement,
	course,
	courseVideo,
	enrollment,
	event,
	facultyProfile,
	guidanceSession,
	liveClass,
	news,
	subscription,
	transaction,
	user,
	workshop,
	workshopParticipant,
	workshopUpdate,
} from "@/server/db/schema";
import { NotificationService } from "@/server/services/notification.service";
import { adminProcedure, createTRPCRouter } from "../trpc";

// ─── Sub-routers ──────────────────────────────────────────────────────────────
// Composed into the main adminRouter at the bottom.

// ── Dashboard analytics ───────────────────────────────────────────────────────
const dashboardRouter = createTRPCRouter({
	getStats: adminProcedure.query(async ({ ctx }) => {
		return trpcSafe(async () => {
			const thirtyDaysAgo = new Date();
			thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

			const [
				[totalUsers],
				[subscriptionUsers],
				[activeCourses],
				[totalEnrollments],
				[revenueRow],
				[monthlyRevenueRow],
				[upcomingWorkshops],
				[totalWorkshopParticipants],
			] = await Promise.all([
				ctx.db.select({ count: sql<number>`count(*)::int` }).from(user),

				ctx.db
					.select({ count: sql<number>`count(*)::int` })
					.from(user)
					.where(eq(user.role, "subscription")),

				ctx.db
					.select({ count: sql<number>`count(*)::int` })
					.from(course)
					.where(eq(course.status, "published")),

				ctx.db
					.select({ count: sql<number>`count(*)::int` })
					.from(enrollment)
					.where(eq(enrollment.status, "active")),

				ctx.db
					.select({
						total: sql<string>`coalesce(sum(amount::numeric), 0)::text`,
					})
					.from(transaction),

				ctx.db
					.select({
						total: sql<string>`coalesce(sum(amount::numeric), 0)::text`,
					})
					.from(transaction)
					.where(gte(transaction.paidAt, thirtyDaysAgo)),

				ctx.db
					.select({ count: sql<number>`count(*)::int` })
					.from(workshop)
					.where(eq(workshop.status, "upcoming")),

				ctx.db
					.select({ count: sql<number>`count(*)::int` })
					.from(workshopParticipant)
					.where(eq(workshopParticipant.status, "confirmed")),
			]);

			return {
				totalUsers: totalUsers?.count ?? 0,
				subscriptionUsers: subscriptionUsers?.count ?? 0,
				activeCourses: activeCourses?.count ?? 0,
				activeEnrollments: totalEnrollments?.count ?? 0,
				totalRevenue: revenueRow?.total ?? "0",
				monthlyRevenue: monthlyRevenueRow?.total ?? "0",
				upcomingWorkshops: upcomingWorkshops?.count ?? 0,
				totalWorkshopParticipants: totalWorkshopParticipants?.count ?? 0,
			};
		});
	}),
});

// ── User management ───────────────────────────────────────────────────────────
const usersRouter = createTRPCRouter({
	list: adminProcedure
		.input(
			z
				.object({
					page: z.number().int().min(1).default(1),
					pageSize: z.number().int().min(1).max(100).default(ADMIN_PAGE_SIZE),
					role: z.enum(["user", "subscription", "admin"]).optional(),
					search: z.string().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			return trpcSafe(async () => {
				const { limit, offset, page, pageSize } = getPaginationParams(
					input ?? {},
					ADMIN_PAGE_SIZE,
				);

				// Build conditions
				const conditions = [];
				if (input?.role) conditions.push(eq(user.role, input.role));
				if (input?.search) {
					const search = `%${input.search.toLowerCase()}%`;
					conditions.push(
						sql`(lower(${user.name}) like ${search} or lower(${user.email}) like ${search})`,
					);
				}

				const where = conditions.length > 0 ? and(...conditions) : undefined;

				const [rows, countResult] = await Promise.all([
					ctx.db
						.select({
							id: user.id,
							name: user.name,
							email: user.email,
							role: user.role,
							astraId: user.astraId,
							phone: user.phone,
							emailVerified: user.emailVerified,
							createdAt: user.createdAt,
						})
						.from(user)
						.where(where)
						.orderBy(desc(user.createdAt))
						.limit(limit)
						.offset(offset),
					ctx.db
						.select({ count: sql<number>`count(*)::int` })
						.from(user)
						.where(where),
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

	getDetail: adminProcedure
		.input(z.object({ userId: z.string() }))
		.query(async ({ ctx, input }) => {
			return trpcSafe(async () => {
				const [profile] = await ctx.db
					.select()
					.from(user)
					.where(eq(user.id, input.userId))
					.limit(1);

				if (!profile) throw Errors.notFound("User");

				const [enrollments, transactions, sub] = await Promise.all([
					ctx.db
						.select({
							id: enrollment.id,
							status: enrollment.status,
							enrolledAt: enrollment.enrolledAt,
							expiresAt: enrollment.expiresAt,
							course: {
								id: course.id,
								title: course.title,
							},
						})
						.from(enrollment)
						.innerJoin(course, eq(enrollment.courseId, course.id))
						.where(eq(enrollment.userId, input.userId))
						.orderBy(desc(enrollment.enrolledAt)),

					ctx.db
						.select()
						.from(transaction)
						.where(eq(transaction.userId, input.userId))
						.orderBy(desc(transaction.paidAt)),

					ctx.db
						.select()
						.from(subscription)
						.where(eq(subscription.userId, input.userId))
						.limit(1),
				]);

				return {
					...profile,
					enrollments,
					transactions,
					subscription: sub[0] ?? null,
				};
			});
		}),

	// Manual enrollment grant/revoke
	setEnrollmentStatus: adminProcedure
		.input(
			z.object({
				enrollmentId: z.string(),
				status: z.enum(["active", "expired", "revoked"]),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return trpcSafe(async () => {
				const [updated] = await ctx.db
					.update(enrollment)
					.set({ status: input.status, updatedAt: new Date() })
					.where(eq(enrollment.id, input.enrollmentId))
					.returning({ id: enrollment.id });

				if (!updated) throw Errors.notFound("Enrollment");
				return { success: true };
			});
		}),

	// Manually enroll a user in a course (no payment)
	grantEnrollment: adminProcedure
		.input(
			z.object({
				userId: z.string(),
				courseId: z.string(),
				durationDays: z.number().int().positive().default(30),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return trpcSafe(async () => {
				// Fetch course config for unlock timing
				const [c] = await ctx.db
					.select({ assessmentUnlockDays: course.assessmentUnlockDays })
					.from(course)
					.where(eq(course.id, input.courseId))
					.limit(1);

				if (!c) throw Errors.notFound("Course");

				const now = new Date();
				const [newEnrollment] = await ctx.db
					.insert(enrollment)
					.values({
						userId: input.userId,
						courseId: input.courseId,
						expiresAt: addDays(input.durationDays, now),
						assessmentUnlocksAt: addDays(c.assessmentUnlockDays, now),
						grantedByAdmin: true,
					})
					.returning();

				return newEnrollment;
			});
		}),
});

// ── Course management ─────────────────────────────────────────────────────────
const coursesRouter = createTRPCRouter({
	list: adminProcedure
		.input(
			z
				.object({
					page: z.number().int().min(1).default(1),
					status: z.enum(["draft", "published", "archived"]).optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			return trpcSafe(async () => {
				const { limit, offset, page, pageSize } = getPaginationParams(
					input ?? {},
					ADMIN_PAGE_SIZE,
				);
				const where = input?.status
					? eq(course.status, input.status)
					: undefined;

				const [rows, countResult] = await Promise.all([
					ctx.db
						.select()
						.from(course)
						.where(where)
						.orderBy(desc(course.createdAt))
						.limit(limit)
						.offset(offset),
					ctx.db
						.select({ count: sql<number>`count(*)::int` })
						.from(course)
						.where(where),
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

	create: adminProcedure
		.input(
			z.object({
				title: z.string().min(3).max(120),
				description: z.string().min(10),
				shortDescription: z.string().max(200).optional(),
				thumbnailUrl: z.string().url().optional(),
				price: z.number().min(0),
				durationDays: z.number().int().positive().default(30),
				assessmentUnlockDays: z.number().int().min(1).default(2),
				status: z.enum(["draft", "published"]).default("draft"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return trpcSafe(async () => {
				const slug = slugify(input.title);

				const [existing] = await ctx.db
					.select({ id: course.id })
					.from(course)
					.where(eq(course.slug, slug))
					.limit(1);

				const finalSlug = existing ? `${slug}-${createId().slice(0, 6)}` : slug;

				const [created] = await ctx.db
					.insert(course)
					.values({
						...input,
						slug: finalSlug,
						price: String(input.price),
						createdBy: ctx.session.user.id,
					})
					.returning();

				return created;
			});
		}),

	update: adminProcedure
		.input(
			z.object({
				courseId: z.string(),
				title: z.string().min(3).max(120).optional(),
				description: z.string().min(10).optional(),
				shortDescription: z.string().max(200).optional(),
				thumbnailUrl: z.string().url().nullable().optional(),
				price: z.number().min(0).optional(),
				durationDays: z.number().int().positive().optional(),
				assessmentUnlockDays: z.number().int().min(1).optional(),
				status: z.enum(["draft", "published", "archived"]).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return trpcSafe(async () => {
				const { courseId, price, ...rest } = input;
				const updateData: Record<string, unknown> = {
					...rest,
					updatedAt: new Date(),
				};
				if (price !== undefined) updateData.price = String(price);

				const [updated] = await ctx.db
					.update(course)
					.set(updateData)
					.where(eq(course.id, courseId))
					.returning();

				if (!updated) throw Errors.notFound("Course");
				return updated;
			});
		}),

	delete: adminProcedure
		.input(z.object({ courseId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			return trpcSafe(async () => {
				// Soft-delete by archiving
				const [updated] = await ctx.db
					.update(course)
					.set({ status: "archived", updatedAt: new Date() })
					.where(eq(course.id, input.courseId))
					.returning({ id: course.id });

				if (!updated) throw Errors.notFound("Course");
				return { success: true };
			});
		}),

	// Course videos
	addVideo: adminProcedure
		.input(
			z.object({
				courseId: z.string(),
				title: z.string().min(1).max(120),
				description: z.string().optional(),
				videoUrl: z.string().url(),
				videoKey: z.string().optional(),
				duration: z.number().int().positive().optional(),
				sortOrder: z.number().int().min(0).default(0),
				isPreview: z.boolean().default(false),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return trpcSafe(async () => {
				const [video] = await ctx.db
					.insert(courseVideo)
					.values(input)
					.returning();
				return video;
			});
		}),

	updateVideo: adminProcedure
		.input(
			z.object({
				videoId: z.string(),
				title: z.string().min(1).max(120).optional(),
				description: z.string().optional(),
				sortOrder: z.number().int().min(0).optional(),
				isPreview: z.boolean().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return trpcSafe(async () => {
				const { videoId, ...rest } = input;
				const [updated] = await ctx.db
					.update(courseVideo)
					.set({ ...rest, updatedAt: new Date() })
					.where(eq(courseVideo.id, videoId))
					.returning();
				if (!updated) throw Errors.notFound("Video");
				return updated;
			});
		}),

	deleteVideo: adminProcedure
		.input(z.object({ videoId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			return trpcSafe(async () => {
				await ctx.db
					.delete(courseVideo)
					.where(eq(courseVideo.id, input.videoId));
				return { success: true };
			});
		}),

	// Live classes
	addLiveClass: adminProcedure
		.input(
			z.object({
				courseId: z.string(),
				title: z.string().min(1).max(120),
				description: z.string().optional(),
				joinUrl: z.string().url(),
				scheduledAt: z.date(),
				durationMinutes: z.number().int().positive().default(60),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return trpcSafe(async () => {
				const [lc] = await ctx.db.insert(liveClass).values(input).returning();
				return lc;
			});
		}),

	completeLiveClass: adminProcedure
		.input(
			z.object({
				liveClassId: z.string(),
				recordingUrl: z.string().url().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return trpcSafe(async () => {
				const [updated] = await ctx.db
					.update(liveClass)
					.set({
						isCompleted: true,
						recordingUrl: input.recordingUrl,
						updatedAt: new Date(),
					})
					.where(eq(liveClass.id, input.liveClassId))
					.returning();
				if (!updated) throw Errors.notFound("Live class");
				return updated;
			});
		}),

	// Enrolled users list for a course
	getEnrollments: adminProcedure
		.input(z.object({ courseId: z.string() }))
		.query(async ({ ctx, input }) => {
			return trpcSafe(async () => {
				return ctx.db
					.select({
						id: enrollment.id,
						status: enrollment.status,
						enrolledAt: enrollment.enrolledAt,
						expiresAt: enrollment.expiresAt,
						grantedByAdmin: enrollment.grantedByAdmin,
						user: {
							id: user.id,
							name: user.name,
							email: user.email,
						},
					})
					.from(enrollment)
					.innerJoin(user, eq(enrollment.userId, user.id))
					.where(eq(enrollment.courseId, input.courseId))
					.orderBy(desc(enrollment.enrolledAt));
			});
		}),
});

// ── Event management ──────────────────────────────────────────────────────────
const eventsRouter = createTRPCRouter({
	create: adminProcedure
		.input(
			z.object({
				title: z.string().min(3).max(150),
				description: z.string().min(10),
				shortDescription: z.string().max(200).optional(),
				bannerUrl: z.string().url().optional(),
				status: z
					.enum(["upcoming", "ongoing", "completed"])
					.default("upcoming"),
				startsAt: z.date(),
				endsAt: z.date().optional(),
				location: z.string().max(200).optional(),
				externalUrl: z.string().url().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return trpcSafe(async () => {
				const slug = slugify(input.title);
				const [existing] = await ctx.db
					.select({ id: event.id })
					.from(event)
					.where(eq(event.slug, slug))
					.limit(1);

				const [created] = await ctx.db
					.insert(event)
					.values({
						...input,
						slug: existing ? `${slug}-${createId().slice(0, 6)}` : slug,
						createdBy: ctx.session.user.id,
					})
					.returning();

				return created;
			});
		}),

	update: adminProcedure
		.input(
			z.object({
				eventId: z.string(),
				title: z.string().min(3).max(150).optional(),
				description: z.string().optional(),
				shortDescription: z.string().max(200).optional(),
				bannerUrl: z.string().url().nullable().optional(),
				status: z
					.enum(["upcoming", "ongoing", "completed", "cancelled"])
					.optional(),
				startsAt: z.date().optional(),
				endsAt: z.date().nullable().optional(),
				location: z.string().max(200).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return trpcSafe(async () => {
				const { eventId, ...rest } = input;
				const [updated] = await ctx.db
					.update(event)
					.set({ ...rest, updatedAt: new Date() })
					.where(eq(event.id, eventId))
					.returning();
				if (!updated) throw Errors.notFound("Event");
				return updated;
			});
		}),

	delete: adminProcedure
		.input(z.object({ eventId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			return trpcSafe(async () => {
				await ctx.db.delete(event).where(eq(event.id, input.eventId));
				return { success: true };
			});
		}),
});

// ── Workshop management ───────────────────────────────────────────────────────
const workshopsRouter = createTRPCRouter({
	create: adminProcedure
		.input(
			z.object({
				title: z.string().min(3).max(150),
				description: z.string().min(10),
				shortDescription: z.string().max(200).optional(),
				bannerUrl: z.string().url().optional(),
				type: z.enum(["free", "paid"]),
				fee: z.number().min(0).default(0),
				hostName: z.string().min(2).max(80),
				hostBio: z.string().optional(),
				hostAvatarUrl: z.string().url().optional(),
				hostUserId: z.string().optional(),
				scheduledAt: z.date(),
				durationMinutes: z.number().int().positive().default(60),
				joinUrl: z.string().url().optional(),
				maxParticipants: z.number().int().positive().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return trpcSafe(async () => {
				if (input.type === "paid" && input.fee <= 0) {
					throw Errors.badRequest(
						"Paid workshops must have a fee greater than 0",
					);
				}

				const slug = slugify(input.title);
				const [existing] = await ctx.db
					.select({ id: workshop.id })
					.from(workshop)
					.where(eq(workshop.slug, slug))
					.limit(1);

				const [created] = await ctx.db
					.insert(workshop)
					.values({
						...input,
						slug: existing ? `${slug}-${createId().slice(0, 6)}` : slug,
						fee: String(input.fee),
						createdBy: ctx.session.user.id,
					})
					.returning();

				return created;
			});
		}),

	update: adminProcedure
		.input(
			z.object({
				workshopId: z.string(),
				title: z.string().min(3).max(150).optional(),
				description: z.string().optional(),
				shortDescription: z.string().max(200).optional(),
				bannerUrl: z.string().url().nullable().optional(),
				fee: z.number().min(0).optional(),
				hostName: z.string().optional(),
				hostBio: z.string().optional(),
				hostAvatarUrl: z.string().url().nullable().optional(),
				scheduledAt: z.date().optional(),
				durationMinutes: z.number().int().positive().optional(),
				joinUrl: z.string().url().nullable().optional(),
				maxParticipants: z.number().int().positive().nullable().optional(),
				status: z
					.enum(["upcoming", "ongoing", "completed", "cancelled"])
					.optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return trpcSafe(async () => {
				const { workshopId, fee, ...rest } = input;
				const updateData: Record<string, unknown> = {
					...rest,
					updatedAt: new Date(),
				};
				if (fee !== undefined) updateData.fee = String(fee);

				const [updated] = await ctx.db
					.update(workshop)
					.set(updateData)
					.where(eq(workshop.id, workshopId))
					.returning();

				if (!updated) throw Errors.notFound("Workshop");
				return updated;
			});
		}),

	delete: adminProcedure
		.input(z.object({ workshopId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			return trpcSafe(async () => {
				await ctx.db
					.update(workshop)
					.set({ status: "cancelled", updatedAt: new Date() })
					.where(eq(workshop.id, input.workshopId));
				return { success: true };
			});
		}),

	// View all registrations / participants
	getParticipants: adminProcedure
		.input(z.object({ workshopId: z.string() }))
		.query(async ({ ctx, input }) => {
			return trpcSafe(async () => {
				return ctx.db
					.select({
						id: workshopParticipant.id,
						status: workshopParticipant.status,
						participantEventId: workshopParticipant.participantEventId,
						registeredAt: workshopParticipant.registeredAt,
						confirmedAt: workshopParticipant.confirmedAt,
						user: {
							id: user.id,
							name: user.name,
							email: user.email,
							phone: user.phone,
						},
					})
					.from(workshopParticipant)
					.innerJoin(user, eq(workshopParticipant.userId, user.id))
					.where(eq(workshopParticipant.workshopId, input.workshopId))
					.orderBy(desc(workshopParticipant.registeredAt));
			});
		}),

	// Post an update and optionally notify all confirmed participants
	postUpdate: adminProcedure
		.input(
			z.object({
				workshopId: z.string(),
				title: z.string().min(1).max(120),
				body: z.string().min(1),
				attachmentUrl: z.string().url().optional(),
				attachmentLabel: z.string().max(80).optional(),
				notifyParticipants: z.boolean().default(true),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return trpcSafe(async () => {
				const [update] = await ctx.db
					.insert(workshopUpdate)
					.values({
						workshopId: input.workshopId,
						title: input.title,
						body: input.body,
						attachmentUrl: input.attachmentUrl,
						attachmentLabel: input.attachmentLabel,
						notifyParticipants: input.notifyParticipants,
						postedBy: ctx.session.user.id,
					})
					.returning();

				if (input.notifyParticipants) {
					await NotificationService.notifyWorkshopParticipants(
						input.workshopId,
						{
							type: "workshop_update",
							title: `New update: ${input.title}`,
							body: input.body.slice(0, 160),
							entityType: "workshop",
							entityId: input.workshopId,
						},
					);
				}

				return update;
			});
		}),
});

// ── News management ───────────────────────────────────────────────────────────
const newsRouter = createTRPCRouter({
	list: adminProcedure.query(async ({ ctx }) => {
		return trpcSafe(async () => {
			return ctx.db.select().from(news).orderBy(desc(news.createdAt));
		});
	}),

	create: adminProcedure
		.input(
			z.object({
				title: z.string().min(3).max(150),
				body: z.string().min(10),
				excerpt: z.string().max(300).optional(),
				coverImageUrl: z.string().url().optional(),
				isPinned: z.boolean().default(false),
				status: z.enum(["draft", "published"]).default("draft"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return trpcSafe(async () => {
				const slug = slugify(input.title);
				const [existing] = await ctx.db
					.select({ id: news.id })
					.from(news)
					.where(eq(news.slug, slug))
					.limit(1);

				const [created] = await ctx.db
					.insert(news)
					.values({
						...input,
						slug: existing ? `${slug}-${createId().slice(0, 6)}` : slug,
						publishedAt: input.status === "published" ? new Date() : null,
						createdBy: ctx.session.user.id,
					})
					.returning();

				return created;
			});
		}),

	update: adminProcedure
		.input(
			z.object({
				newsId: z.string(),
				title: z.string().min(3).max(150).optional(),
				body: z.string().optional(),
				excerpt: z.string().max(300).optional(),
				coverImageUrl: z.string().url().nullable().optional(),
				isPinned: z.boolean().optional(),
				status: z.enum(["draft", "published", "archived"]).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return trpcSafe(async () => {
				const { newsId, status, ...rest } = input;
				const updateData: Record<string, unknown> = {
					...rest,
					updatedAt: new Date(),
				};
				if (status) {
					updateData.status = status;
					if (status === "published") updateData.publishedAt = new Date();
				}

				const [updated] = await ctx.db
					.update(news)
					.set(updateData)
					.where(eq(news.id, newsId))
					.returning();

				if (!updated) throw Errors.notFound("News article");
				return updated;
			});
		}),

	delete: adminProcedure
		.input(z.object({ newsId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			return trpcSafe(async () => {
				await ctx.db.delete(news).where(eq(news.id, input.newsId));
				return { success: true };
			});
		}),
});

// ── Achievements + Faculty management ─────────────────────────────────────────
const contentRouter = createTRPCRouter({
	// Achievements
	createAchievement: adminProcedure
		.input(
			z.object({
				title: z.string().min(2).max(120),
				description: z.string().min(5),
				metric: z.string().max(30).optional(),
				metricLabel: z.string().max(50).optional(),
				iconUrl: z.string().url().optional(),
				imageUrl: z.string().url().optional(),
				sortOrder: z.number().int().min(0).default(0),
				status: z.enum(["draft", "published"]).default("published"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return trpcSafe(async () => {
				const [created] = await ctx.db
					.insert(achievement)
					.values({ ...input, createdBy: ctx.session.user.id })
					.returning();
				return created;
			});
		}),

	updateAchievement: adminProcedure
		.input(
			z.object({
				achievementId: z.string(),
				title: z.string().min(2).max(120).optional(),
				description: z.string().optional(),
				metric: z.string().max(30).optional(),
				metricLabel: z.string().max(50).optional(),
				sortOrder: z.number().int().min(0).optional(),
				status: z.enum(["draft", "published", "archived"]).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return trpcSafe(async () => {
				const { achievementId, ...rest } = input;
				const [updated] = await ctx.db
					.update(achievement)
					.set({ ...rest, updatedAt: new Date() })
					.where(eq(achievement.id, achievementId))
					.returning();
				if (!updated) throw Errors.notFound("Achievement");
				return updated;
			});
		}),

	deleteAchievement: adminProcedure
		.input(z.object({ achievementId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			return trpcSafe(async () => {
				await ctx.db
					.delete(achievement)
					.where(eq(achievement.id, input.achievementId));
				return { success: true };
			});
		}),

	// Faculty profiles
	upsertFaculty: adminProcedure
		.input(
			z.object({
				id: z.string().optional(), // present = update, absent = create
				name: z.string().min(2).max(80),
				title: z.string().min(2).max(100),
				bio: z.string().min(10),
				avatarUrl: z.string().url().optional(),
				linkedinUrl: z.string().url().optional(),
				twitterUrl: z.string().url().optional(),
				isOwner: z.boolean().default(false),
				isVisible: z.boolean().default(true),
				sortOrder: z.number().int().min(0).default(0),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return trpcSafe(async () => {
				const { id: profileId, ...data } = input;

				if (profileId) {
					const [updated] = await ctx.db
						.update(facultyProfile)
						.set({ ...data, updatedAt: new Date() })
						.where(eq(facultyProfile.id, profileId))
						.returning();
					if (!updated) throw Errors.notFound("Faculty profile");
					return updated;
				}

				const [created] = await ctx.db
					.insert(facultyProfile)
					.values({ ...data, createdBy: ctx.session.user.id })
					.returning();
				return created;
			});
		}),

	deleteFaculty: adminProcedure
		.input(z.object({ profileId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			return trpcSafe(async () => {
				await ctx.db
					.delete(facultyProfile)
					.where(eq(facultyProfile.id, input.profileId));
				return { success: true };
			});
		}),
});

// ── Subscription management ───────────────────────────────────────────────────
const subscriptionsRouter = createTRPCRouter({
	list: adminProcedure
		.input(
			z
				.object({
					status: z
						.enum(["active", "expired", "cancelled", "suspended"])
						.optional(),
					page: z.number().int().min(1).default(1),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			return trpcSafe(async () => {
				const { limit, offset, page, pageSize } = getPaginationParams(
					input ?? {},
					ADMIN_PAGE_SIZE,
				);
				const where = input?.status
					? eq(subscription.status, input.status)
					: undefined;

				const [rows, countResult] = await Promise.all([
					ctx.db
						.select({
							id: subscription.id,
							astraId: subscription.astraId,
							status: subscription.status,
							startDate: subscription.startDate,
							endDate: subscription.endDate,
							notes: subscription.notes,
							user: {
								id: user.id,
								name: user.name,
								email: user.email,
							},
						})
						.from(subscription)
						.innerJoin(user, eq(subscription.userId, user.id))
						.where(where)
						.orderBy(desc(subscription.createdAt))
						.limit(limit)
						.offset(offset),
					ctx.db
						.select({ count: sql<number>`count(*)::int` })
						.from(subscription)
						.where(where),
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

	// Activate subscription for a user and assign Astra ID
	activate: adminProcedure
		.input(
			z.object({
				userId: z.string(),
				durationDays: z
					.number()
					.int()
					.positive()
					.default(DEFAULT_SUBSCRIPTION_DAYS),
				notes: z.string().max(500).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return trpcSafe(async () => {
				// Check user exists
				const [targetUser] = await ctx.db
					.select({ id: user.id, role: user.role })
					.from(user)
					.where(eq(user.id, input.userId))
					.limit(1);

				if (!targetUser) throw Errors.notFound("User");

				// Deactivate any existing subscription first
				await ctx.db
					.update(subscription)
					.set({ status: "cancelled", updatedAt: new Date() })
					.where(eq(subscription.userId, input.userId));

				// Generate unique Astra ID: ASTRA-XXXXXXXX
				const astraId = `${ASTRA_ID_PREFIX}-${createId().toUpperCase().slice(0, 8)}`;
				const endDate = addDays(input.durationDays);

				// Create subscription record
				const [newSub] = await ctx.db
					.insert(subscription)
					.values({
						userId: input.userId,
						status: "active",
						astraId,
						endDate,
						activatedBy: ctx.session.user.id,
						notes: input.notes,
					})
					.returning();

				// Elevate user role + assign astraId on user table
				await ctx.db
					.update(user)
					.set({ role: "subscription", astraId, updatedAt: new Date() })
					.where(eq(user.id, input.userId));

				// Notify user
				await NotificationService.send({
					userId: input.userId,
					type: "general",
					title: "Welcome to Astra Premium! 💎",
					body: `Your subscription is now active until ${endDate.toLocaleDateString("en-IN")}. Your Astra ID is ${astraId}.`,
					ctaUrl: "/dashboard/premium",
					ctaLabel: "Access premium",
				});

				return newSub;
			});
		}),

	// Revoke / cancel subscription
	revoke: adminProcedure
		.input(
			z.object({
				subscriptionId: z.string(),
				reason: z.string().max(300).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return trpcSafe(async () => {
				const [sub] = await ctx.db
					.select()
					.from(subscription)
					.where(eq(subscription.id, input.subscriptionId))
					.limit(1);

				if (!sub) throw Errors.notFound("Subscription");

				await ctx.db
					.update(subscription)
					.set({
						status: "cancelled",
						notes: input.reason ?? sub.notes,
						updatedAt: new Date(),
					})
					.where(eq(subscription.id, input.subscriptionId));

				// Revert user role to regular user
				await ctx.db
					.update(user)
					.set({ role: "user", astraId: null, updatedAt: new Date() })
					.where(eq(user.id, sub.userId));

				return { success: true };
			});
		}),

	// Guidance sessions CRUD (admin side)
	createGuidanceSession: adminProcedure
		.input(
			z.object({
				title: z.string().min(3).max(120),
				description: z.string().optional(),
				hostName: z.string().min(2).max(80),
				hostUserId: z.string().optional(),
				joinUrl: z.string().url(),
				scheduledAt: z.date(),
				durationMinutes: z.number().int().positive().default(60),
				dailyInsight: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return trpcSafe(async () => {
				const [session] = await ctx.db
					.insert(guidanceSession)
					.values({ ...input, createdBy: ctx.session.user.id })
					.returning();
				return session;
			});
		}),

	completeGuidanceSession: adminProcedure
		.input(
			z.object({
				sessionId: z.string(),
				recordingUrl: z.string().url().optional(),
				dailyInsight: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return trpcSafe(async () => {
				const { sessionId, ...rest } = input;
				const [updated] = await ctx.db
					.update(guidanceSession)
					.set({ ...rest, isCompleted: true, updatedAt: new Date() })
					.where(eq(guidanceSession.id, sessionId))
					.returning();

				if (!updated) throw Errors.notFound("Guidance session");

				// Notify all subscription users
				const subscriptionUsers = await ctx.db
					.select({ id: user.id })
					.from(user)
					.where(eq(user.role, "subscription"));

				await NotificationService.broadcast({
					userIds: subscriptionUsers.map((u) => u.id),
					type: "general",
					title: `Session recording available: ${updated.title}`,
					body: "The recording from today's guidance session is now available.",
					ctaUrl: `/dashboard/premium/sessions/${sessionId}`,
					ctaLabel: "Watch recording",
				});

				return updated;
			});
		}),

	// Admin broadcast notification to all users
	broadcastNotification: adminProcedure
		.input(
			z.object({
				title: z.string().min(1).max(120),
				body: z.string().min(1).max(500),
				target: z.enum(["all", "subscription", "regular"]).default("all"),
				ctaUrl: z.string().url().optional(),
				ctaLabel: z.string().max(50).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return trpcSafe(async () => {
				let targetUsers: { id: string }[];

				if (input.target === "all") {
					targetUsers = await ctx.db.select({ id: user.id }).from(user);
				} else if (input.target === "subscription") {
					targetUsers = await ctx.db
						.select({ id: user.id })
						.from(user)
						.where(eq(user.role, "subscription"));
				} else {
					targetUsers = await ctx.db
						.select({ id: user.id })
						.from(user)
						.where(eq(user.role, "user"));
				}

				await NotificationService.broadcast({
					userIds: targetUsers.map((u) => u.id),
					type: "general",
					title: input.title,
					body: input.body,
					ctaUrl: input.ctaUrl,
					ctaLabel: input.ctaLabel,
				});

				return { sent: targetUsers.length };
			});
		}),
});

// ─── Compose admin router ─────────────────────────────────────────────────────
export const adminRouter = createTRPCRouter({
	dashboard: dashboardRouter,
	users: usersRouter,
	courses: coursesRouter,
	events: eventsRouter,
	workshops: workshopsRouter,
	news: newsRouter,
	content: contentRouter,
	subscriptions: subscriptionsRouter,
});
