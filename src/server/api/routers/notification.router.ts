import { z } from "zod";
import { trpcSafe } from "@/lib/errors";
import { NotificationService } from "@/server/services/notification.service";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const notificationRouter = createTRPCRouter({
	// ── Paginated notification feed ─────────────────────────────────────────
	list: protectedProcedure
		.input(
			z
				.object({
					page: z.number().int().min(1).default(1),
					unreadOnly: z.boolean().default(false),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			return trpcSafe(async () => {
				return NotificationService.getForUser(ctx.session.user.id, {
					page: input?.page ?? 1,
					unreadOnly: input?.unreadOnly ?? false,
				});
			});
		}),

	// ── Unread count badge ──────────────────────────────────────────────────
	// Lightweight query — called on every page load to keep the bell badge fresh.
	unreadCount: protectedProcedure.query(async ({ ctx }) => {
		return trpcSafe(async () => {
			const count = await NotificationService.getUnreadCount(
				ctx.session.user.id,
			);
			return { count };
		});
	}),

	// ── Mark a single notification as read ──────────────────────────────────
	markRead: protectedProcedure
		.input(z.object({ notificationId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			return trpcSafe(async () => {
				await NotificationService.markRead(
					input.notificationId,
					ctx.session.user.id,
				);
				return { success: true };
			});
		}),

	// ── Mark all notifications as read ──────────────────────────────────────
	markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
		return trpcSafe(async () => {
			await NotificationService.markAllRead(ctx.session.user.id);
			return { success: true };
		});
	}),
});
