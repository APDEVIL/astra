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
export const contentStatusEnum = pgEnum("content_status", [
	"draft",
	"published",
	"archived",
]);

// ─── Achievement ──────────────────────────────────────────────────────────────
// Company milestones and success stories shown on the landing page and dashboard.
export const achievement = pgTable("achievement", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => createId()),
	title: text("title").notNull(),
	description: text("description").notNull(),
	// Stat / highlight value — e.g. "500+", "₹10Cr", "3 Years"
	metric: text("metric"),
	metricLabel: text("metric_label"),
	iconUrl: text("icon_url"),
	imageUrl: text("image_url"),
	status: contentStatusEnum("status").notNull().default("published"),
	// Controls card order on the landing page
	sortOrder: integer("sort_order").notNull().default(0),
	createdBy: text("created_by")
		.notNull()
		.references(() => user.id),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── News ─────────────────────────────────────────────────────────────────────
// Platform announcements, market news, and blog-style content.
// Managed by admin; visible to all users.
export const news = pgTable("news", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => createId()),
	title: text("title").notNull(),
	slug: text("slug").notNull().unique(),
	excerpt: text("excerpt"),
	body: text("body").notNull(),
	coverImageUrl: text("cover_image_url"),
	status: contentStatusEnum("status").notNull().default("draft"),
	// Whether to pin this item at the top of the news feed
	isPinned: boolean("is_pinned").notNull().default(false),
	publishedAt: timestamp("published_at"),
	createdBy: text("created_by")
		.notNull()
		.references(() => user.id),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Announcement (About Page) ────────────────────────────────────────────────
// Static content for the About page — owner/faculty profiles and company details.
export const facultyProfile = pgTable("faculty_profile", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => createId()),
	name: text("name").notNull(),
	title: text("title").notNull(), // e.g. "Founder & CEO", "Senior Analyst"
	bio: text("bio").notNull(),
	avatarUrl: text("avatar_url"),
	linkedinUrl: text("linkedin_url"),
	twitterUrl: text("twitter_url"),
	isOwner: boolean("is_owner").notNull().default(false),
	isVisible: boolean("is_visible").notNull().default(true),
	sortOrder: integer("sort_order").notNull().default(0),
	createdBy: text("created_by")
		.notNull()
		.references(() => user.id),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Relations ────────────────────────────────────────────────────────────────
export const achievementRelations = relations(achievement, ({ one }) => ({
	createdByUser: one(user, {
		fields: [achievement.createdBy],
		references: [user.id],
	}),
}));

export const newsRelations = relations(news, ({ one }) => ({
	createdByUser: one(user, {
		fields: [news.createdBy],
		references: [user.id],
	}),
}));

export const facultyProfileRelations = relations(facultyProfile, ({ one }) => ({
	createdByUser: one(user, {
		fields: [facultyProfile.createdBy],
		references: [user.id],
	}),
}));

// ─── Types ────────────────────────────────────────────────────────────────────
export type Achievement = typeof achievement.$inferSelect;
export type NewAchievement = typeof achievement.$inferInsert;
export type News = typeof news.$inferSelect;
export type NewNews = typeof news.$inferInsert;
export type FacultyProfile = typeof facultyProfile.$inferSelect;
export type NewFacultyProfile = typeof facultyProfile.$inferInsert;
export type ContentStatus = (typeof contentStatusEnum.enumValues)[number];
