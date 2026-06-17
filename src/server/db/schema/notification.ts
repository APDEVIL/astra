import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import { boolean, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "./auth";

// ─── Enums ────────────────────────────────────────────────────────────────────
export const notificationTypeEnum = pgEnum("notification_type", [
	"course_purchase", // Course enrollment confirmed
	"course_expiry_soon", // 3-day warning before course expires
	"assessment_unlocked", // Paper trading is now available
	"event_update", // General event info
	"workshop_confirmed", // Workshop registration confirmed
	"workshop_reminder", // 1hr / 24hr before workshop
	"workshop_update", // Admin posted a new workshop update
	"subscription_expiry", // Subscription expiring soon
	"general", // Catch-all for admin broadcasts
]);

// ─── Notification ─────────────────────────────────────────────────────────────
// In-app notifications. One row per user per event.
// Email dispatch is handled separately in notification.service.ts.
export const notification = pgTable("notification", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => createId()),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	type: notificationTypeEnum("type").notNull(),
	title: text("title").notNull(),
	body: text("body").notNull(),
	// Optional deep-link within the app
	ctaUrl: text("cta_url"),
	ctaLabel: text("cta_label"),
	// The entity this notification is about (course ID, workshop ID, etc.)
	entityType: text("entity_type"), // "course" | "workshop" | "subscription" | null
	entityId: text("entity_id"),
	isRead: boolean("is_read").notNull().default(false),
	readAt: timestamp("read_at"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Relations ────────────────────────────────────────────────────────────────
export const notificationRelations = relations(notification, ({ one }) => ({
	user: one(user, {
		fields: [notification.userId],
		references: [user.id],
	}),
}));

// ─── Types ────────────────────────────────────────────────────────────────────
export type Notification = typeof notification.$inferSelect;
export type NewNotification = typeof notification.$inferInsert;
export type NotificationType = (typeof notificationTypeEnum.enumValues)[number];
