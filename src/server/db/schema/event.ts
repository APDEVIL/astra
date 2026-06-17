import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
	boolean,
	integer,
	numeric,
	pgEnum,
	pgTable,
	text,
	timestamp,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

// ─── Enums ────────────────────────────────────────────────────────────────────
export const eventStatusEnum = pgEnum("event_status", [
	"upcoming",
	"ongoing",
	"completed",
	"cancelled",
]);

export const workshopTypeEnum = pgEnum("workshop_type", ["free", "paid"]);

export const participantStatusEnum = pgEnum("participant_status", [
	"registered",
	"payment_pending",
	"confirmed",
	"cancelled",
]);

// ─── Event ────────────────────────────────────────────────────────────────────
// Informational events (news-style). No registration, no payment.
export const event = pgTable("event", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => createId()),
	title: text("title").notNull(),
	slug: text("slug").notNull().unique(),
	description: text("description").notNull(),
	shortDescription: text("short_description"),
	bannerUrl: text("banner_url"),
	status: eventStatusEnum("status").notNull().default("upcoming"),
	startsAt: timestamp("starts_at").notNull(),
	endsAt: timestamp("ends_at"),
	location: text("location"), // Physical address or "Online"
	externalUrl: text("external_url"), // Optional registration / info link
	createdBy: text("created_by")
		.notNull()
		.references(() => user.id),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Workshop ─────────────────────────────────────────────────────────────────
// Interactive sessions with registration, payments, and a participant limit.
export const workshop = pgTable("workshop", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => createId()),
	title: text("title").notNull(),
	slug: text("slug").notNull().unique(),
	description: text("description").notNull(),
	shortDescription: text("short_description"),
	bannerUrl: text("banner_url"),
	type: workshopTypeEnum("type").notNull().default("free"),
	// Price in INR — 0 for free workshops
	fee: numeric("fee", { precision: 10, scale: 2 }).notNull().default("0"),
	// Host / instructor details
	hostName: text("host_name").notNull(),
	hostBio: text("host_bio"),
	hostAvatarUrl: text("host_avatar_url"),
	// Nullable FK — host may or may not have a platform account
	hostUserId: text("host_user_id").references(() => user.id, {
		onDelete: "set null",
	}),
	scheduledAt: timestamp("scheduled_at").notNull(),
	durationMinutes: integer("duration_minutes").notNull().default(60),
	// Live / join link (shown only after confirmation)
	joinUrl: text("join_url"),
	maxParticipants: integer("max_participants"),
	status: eventStatusEnum("status").notNull().default("upcoming"),
	createdBy: text("created_by")
		.notNull()
		.references(() => user.id),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Workshop Participant ──────────────────────────────────────────────────────
// Created on registration. Confirmed after payment (or immediately for free).
export const workshopParticipant = pgTable("workshop_participant", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => createId()),
	workshopId: text("workshop_id")
		.notNull()
		.references(() => workshop.id, { onDelete: "cascade" }),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	status: participantStatusEnum("status").notNull().default("registered"),
	// Unique ID shown to participant as their entry pass
	participantEventId: text("participant_event_id")
		.notNull()
		.unique()
		.$defaultFn(() => `ASTRA-${createId().toUpperCase().slice(0, 8)}`),
	registeredAt: timestamp("registered_at").notNull().defaultNow(),
	confirmedAt: timestamp("confirmed_at"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Workshop Update ───────────────────────────────────────────────────────────
// Announcements / resources posted by admin after workshop creation.
// Participants receive notifications when updates are posted.
export const workshopUpdate = pgTable("workshop_update", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => createId()),
	workshopId: text("workshop_id")
		.notNull()
		.references(() => workshop.id, { onDelete: "cascade" }),
	title: text("title").notNull(),
	body: text("body").notNull(),
	// Optional file/link attachment
	attachmentUrl: text("attachment_url"),
	attachmentLabel: text("attachment_label"),
	// Whether to send a push notification to all confirmed participants
	notifyParticipants: boolean("notify_participants").notNull().default(true),
	postedBy: text("posted_by")
		.notNull()
		.references(() => user.id),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Relations ────────────────────────────────────────────────────────────────
export const eventRelations = relations(event, ({ one }) => ({
	createdByUser: one(user, {
		fields: [event.createdBy],
		references: [user.id],
	}),
}));

export const workshopRelations = relations(workshop, ({ one, many }) => ({
	participants: many(workshopParticipant),
	updates: many(workshopUpdate),
	host: one(user, {
		fields: [workshop.hostUserId],
		references: [user.id],
	}),
	createdByUser: one(user, {
		fields: [workshop.createdBy],
		references: [user.id],
	}),
}));

export const workshopParticipantRelations = relations(
	workshopParticipant,
	({ one }) => ({
		workshop: one(workshop, {
			fields: [workshopParticipant.workshopId],
			references: [workshop.id],
		}),
		user: one(user, {
			fields: [workshopParticipant.userId],
			references: [user.id],
		}),
	}),
);

export const workshopUpdateRelations = relations(workshopUpdate, ({ one }) => ({
	workshop: one(workshop, {
		fields: [workshopUpdate.workshopId],
		references: [workshop.id],
	}),
	postedByUser: one(user, {
		fields: [workshopUpdate.postedBy],
		references: [user.id],
	}),
}));

// ─── Types ────────────────────────────────────────────────────────────────────
export type Event = typeof event.$inferSelect;
export type NewEvent = typeof event.$inferInsert;
export type Workshop = typeof workshop.$inferSelect;
export type NewWorkshop = typeof workshop.$inferInsert;
export type WorkshopParticipant = typeof workshopParticipant.$inferSelect;
export type NewWorkshopParticipant = typeof workshopParticipant.$inferInsert;
export type WorkshopUpdate = typeof workshopUpdate.$inferSelect;
export type NewWorkshopUpdate = typeof workshopUpdate.$inferInsert;
export type EventStatus = (typeof eventStatusEnum.enumValues)[number];
export type WorkshopType = (typeof workshopTypeEnum.enumValues)[number];
export type ParticipantStatus =
	(typeof participantStatusEnum.enumValues)[number];
