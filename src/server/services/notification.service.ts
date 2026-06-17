import "server-only";

import { and, desc, eq, lt, sql } from "drizzle-orm";
import { NOTIFICATIONS_PAGE_SIZE } from "@/lib/constants";
import { db } from "@/server/db";
import {
	type NotificationType,
	notification,
	workshopParticipant,
} from "@/server/db/schema";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface SendNotificationInput {
	userId: string;
	type: NotificationType;
	title: string;
	body: string;
	ctaUrl?: string;
	ctaLabel?: string;
	entityType?: string;
	entityId?: string;
}

export interface BroadcastInput {
	userIds: string[];
	type: NotificationType;
	title: string;
	body: string;
	ctaUrl?: string;
	ctaLabel?: string;
	entityType?: string;
	entityId?: string;
}

// ─── Notification Service ─────────────────────────────────────────────────────
export const NotificationService = {
	// ── Send a single notification ────────────────────────────────────────────
	async send(input: SendNotificationInput): Promise<void> {
		await db.insert(notification).values({
			userId: input.userId,
			type: input.type,
			title: input.title,
			body: input.body,
			ctaUrl: input.ctaUrl,
			ctaLabel: input.ctaLabel,
			entityType: input.entityType,
			entityId: input.entityId,
		});

		// TODO: Fire email via Resend / Nodemailer here if needed.
		// The in-app row is always created; email is opt-in per notification type.
	},

	// ── Broadcast to multiple users ───────────────────────────────────────────
	async broadcast(input: BroadcastInput): Promise<void> {
		if (input.userIds.length === 0) return;

		// Build rows for all users and insert in one query
		const rows = input.userIds.map((userId) => ({
			userId,
			type: input.type,
			title: input.title,
			body: input.body,
			ctaUrl: input.ctaUrl,
			ctaLabel: input.ctaLabel,
			entityType: input.entityType,
			entityId: input.entityId,
		}));

		// Insert in chunks of 500 to stay within PG statement limits
		const chunkSize = 500;
		for (let i = 0; i < rows.length; i += chunkSize) {
			await db.insert(notification).values(rows.slice(i, i + chunkSize));
		}
	},

	// ── Notify all confirmed workshop participants ─────────────────────────────
	async notifyWorkshopParticipants(
		workshopId: string,
		input: Omit<BroadcastInput, "userIds">,
	): Promise<void> {
		const participants = await db
			.select({ userId: workshopParticipant.userId })
			.from(workshopParticipant)
			.where(
				and(
					eq(workshopParticipant.workshopId, workshopId),
					eq(workshopParticipant.status, "confirmed"),
				),
			);

		const userIds = participants.map((p) => p.userId);
		await NotificationService.broadcast({ userIds, ...input });
	},

	// ── Get paginated notifications for a user ────────────────────────────────
	async getForUser(
		userId: string,
		options: { page?: number; unreadOnly?: boolean } = {},
	) {
		const { page = 1, unreadOnly = false } = options;
		const offset = (page - 1) * NOTIFICATIONS_PAGE_SIZE;

		const conditions = [eq(notification.userId, userId)];
		if (unreadOnly) conditions.push(eq(notification.isRead, false));

		const [rows, [countRow]] = await Promise.all([
			db
				.select()
				.from(notification)
				.where(and(...conditions))
				.orderBy(desc(notification.createdAt))
				.limit(NOTIFICATIONS_PAGE_SIZE)
				.offset(offset),
			db
				.select({ count: sql<number>`count(*)::int` })
				.from(notification)
				.where(and(...conditions)),
		]);

		return {
			items: rows,
			total: countRow?.count ?? 0,
			unreadCount: await NotificationService.getUnreadCount(userId),
		};
	},

	// ── Count unread notifications for a user ─────────────────────────────────
	async getUnreadCount(userId: string): Promise<number> {
		const [row] = await db
			.select({ count: sql<number>`count(*)::int` })
			.from(notification)
			.where(
				and(eq(notification.userId, userId), eq(notification.isRead, false)),
			);

		return row?.count ?? 0;
	},

	// ── Mark a single notification as read ────────────────────────────────────
	async markRead(notificationId: string, userId: string): Promise<void> {
		await db
			.update(notification)
			.set({ isRead: true, readAt: new Date() })
			.where(
				and(
					eq(notification.id, notificationId),
					eq(notification.userId, userId),
				),
			);
	},

	// ── Mark all notifications as read for a user ─────────────────────────────
	async markAllRead(userId: string): Promise<void> {
		await db
			.update(notification)
			.set({ isRead: true, readAt: new Date() })
			.where(
				and(eq(notification.userId, userId), eq(notification.isRead, false)),
			);
	},

	// ── Delete old read notifications (for cleanup cron) ──────────────────────
	async pruneOldRead(olderThanDays = 30): Promise<number> {
		const cutoff = new Date();
		cutoff.setDate(cutoff.getDate() - olderThanDays);

		const deleted = await db
			.delete(notification)
			.where(
				and(eq(notification.isRead, true), lt(notification.createdAt, cutoff)),
			)
			.returning({ id: notification.id });

		return deleted.length;
	},
};
