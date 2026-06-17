import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
	boolean,
	integer,
	pgEnum,
	pgTable,
	text,
	timestamp,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

// ─── Enums ────────────────────────────────────────────────────────────────────
export const subscriptionStatusEnum = pgEnum("subscription_status", [
	"active",
	"expired",
	"cancelled",
	"suspended",
]);

// ─── Subscription ─────────────────────────────────────────────────────────────
// Tracks premium subscription for a user.
// When active, user.role is set to "subscription".
// On expiry/cancellation, role is reverted to "user".
export const subscription = pgTable("subscription", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => createId()),
	userId: text("user_id")
		.notNull()
		.unique()
		.references(() => user.id, { onDelete: "cascade" }),
	status: subscriptionStatusEnum("status").notNull().default("active"),
	// The Astra ID assigned to subscription users for alternate login
	astraId: text("astra_id").notNull().unique(),
	// Subscription validity window
	startDate: timestamp("start_date").notNull().defaultNow(),
	endDate: timestamp("end_date").notNull(),
	// Admin who activated this subscription
	activatedBy: text("activated_by")
		.notNull()
		.references(() => user.id),
	// Reason for cancellation / suspension (optional)
	notes: text("notes"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Guidance Session ─────────────────────────────────────────────────────────
// Premium live sessions — daily market insights for subscription users.
// Admins schedule these; subscription users can join / view recordings.
export const guidanceSession = pgTable("guidance_session", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => createId()),
	title: text("title").notNull(),
	description: text("description"),
	// Faculty / host running the session
	hostName: text("host_name").notNull(),
	hostUserId: text("host_user_id").references(() => user.id, {
		onDelete: "set null",
	}),
	// Live join link (Zoom / Meet)
	joinUrl: text("join_url").notNull(),
	scheduledAt: timestamp("scheduled_at").notNull(),
	durationMinutes: integer("duration_minutes").notNull().default(60),
	isCompleted: boolean("is_completed").notNull().default(false),
	// Recording URL published after the session
	recordingUrl: text("recording_url"),
	// Daily insight / market note posted alongside the session
	dailyInsight: text("daily_insight"),
	createdBy: text("created_by")
		.notNull()
		.references(() => user.id),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Relations ────────────────────────────────────────────────────────────────
export const subscriptionRelations = relations(subscription, ({ one }) => ({
	user: one(user, {
		fields: [subscription.userId],
		references: [user.id],
	}),
	activatedByUser: one(user, {
		fields: [subscription.activatedBy],
		references: [user.id],
	}),
}));

export const guidanceSessionRelations = relations(
	guidanceSession,
	({ one }) => ({
		host: one(user, {
			fields: [guidanceSession.hostUserId],
			references: [user.id],
		}),
		createdByUser: one(user, {
			fields: [guidanceSession.createdBy],
			references: [user.id],
		}),
	}),
);

// ─── Types ────────────────────────────────────────────────────────────────────
export type Subscription = typeof subscription.$inferSelect;
export type NewSubscription = typeof subscription.$inferInsert;
export type GuidanceSession = typeof guidanceSession.$inferSelect;
export type NewGuidanceSession = typeof guidanceSession.$inferInsert;
export type SubscriptionStatus =
	(typeof subscriptionStatusEnum.enumValues)[number];
