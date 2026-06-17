import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { trpcSafe } from "@/lib/errors";
import { user } from "@/server/db/schema";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const authRouter = createTRPCRouter({
	// ── Get current session ─────────────────────────────────────────────────
	getSession: publicProcedure.query(({ ctx }) => {
		return ctx.session ?? null;
	}),

	// ── Get current user's full profile ────────────────────────────────────
	me: protectedProcedure.query(async ({ ctx }) => {
		return trpcSafe(async () => {
			const [profile] = await ctx.db
				.select({
					id: user.id,
					name: user.name,
					email: user.email,
					image: user.image,
					phone: user.phone,
					role: user.role,
					astraId: user.astraId,
					emailVerified: user.emailVerified,
					createdAt: user.createdAt,
				})
				.from(user)
				.where(eq(user.id, ctx.session.user.id))
				.limit(1);

			if (!profile) throw new TRPCError({ code: "NOT_FOUND" });
			return profile;
		});
	}),

	// ── Update profile ──────────────────────────────────────────────────────
	updateProfile: protectedProcedure
		.input(
			z.object({
				name: z.string().min(2).max(80).optional(),
				phone: z
					.string()
					.regex(/^\+?[0-9]{7,15}$/, "Invalid phone number")
					.optional(),
				image: z.string().url("Invalid image URL").optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return trpcSafe(async () => {
				const updateData: Record<string, unknown> = { updatedAt: new Date() };
				if (input.name !== undefined) updateData.name = input.name;
				if (input.phone !== undefined) updateData.phone = input.phone;
				if (input.image !== undefined) updateData.image = input.image;

				const [updated] = await ctx.db
					.update(user)
					.set(updateData)
					.where(eq(user.id, ctx.session.user.id))
					.returning({
						id: user.id,
						name: user.name,
						email: user.email,
						image: user.image,
						phone: user.phone,
					});

				if (!updated) throw new TRPCError({ code: "NOT_FOUND" });
				return updated;
			});
		}),
});
