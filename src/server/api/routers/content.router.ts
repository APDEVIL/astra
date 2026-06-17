import { and, asc, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { Errors, trpcSafe } from "@/lib/errors";
import { achievement, facultyProfile, news } from "@/server/db/schema";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const contentRouter = createTRPCRouter({
	// ── Achievements (landing page + dashboard) ─────────────────────────────
	getAchievements: publicProcedure.query(async ({ ctx }) => {
		return trpcSafe(async () => {
			return ctx.db
				.select()
				.from(achievement)
				.where(eq(achievement.status, "published"))
				.orderBy(asc(achievement.sortOrder), desc(achievement.createdAt));
		});
	}),

	// ── News ────────────────────────────────────────────────────────────────
	listNews: publicProcedure
		.input(
			z
				.object({
					page: z.number().int().min(1).default(1),
					pageSize: z.number().int().min(1).max(20).default(9),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			return trpcSafe(async () => {
				const page = input?.page ?? 1;
				const pageSize = input?.pageSize ?? 9;
				const offset = (page - 1) * pageSize;

				return ctx.db
					.select({
						id: news.id,
						title: news.title,
						slug: news.slug,
						excerpt: news.excerpt,
						coverImageUrl: news.coverImageUrl,
						isPinned: news.isPinned,
						publishedAt: news.publishedAt,
					})
					.from(news)
					.where(eq(news.status, "published"))
					.orderBy(desc(news.isPinned), desc(news.publishedAt))
					.limit(pageSize)
					.offset(offset);
			});
		}),

	getNewsBySlug: publicProcedure
		.input(z.object({ slug: z.string() }))
		.query(async ({ ctx, input }) => {
			return trpcSafe(async () => {
				const [row] = await ctx.db
					.select()
					.from(news)
					.where(and(eq(news.slug, input.slug), eq(news.status, "published")))
					.limit(1);

				if (!row) throw Errors.notFound("News article");
				return row;
			});
		}),

	// ── Faculty profiles (About page) ───────────────────────────────────────
	getFaculty: publicProcedure.query(async ({ ctx }) => {
		return trpcSafe(async () => {
			return ctx.db
				.select()
				.from(facultyProfile)
				.where(eq(facultyProfile.isVisible, true))
				.orderBy(
					// Owner always first, then by sortOrder
					desc(facultyProfile.isOwner),
					asc(facultyProfile.sortOrder),
				);
		});
	}),
});
