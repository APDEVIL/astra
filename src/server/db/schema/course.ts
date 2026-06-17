import { createId } from "@paralleldrive/cuid2";
import { relations, sql } from "drizzle-orm";
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
export const courseStatusEnum = pgEnum("course_status", [
	"draft",
	"published",
	"archived",
]);

export const enrollmentStatusEnum = pgEnum("enrollment_status", [
	"active",
	"expired",
	"revoked",
]);

// ─── Course ───────────────────────────────────────────────────────────────────
export const course = pgTable("course", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => createId()),
	title: text("title").notNull(),
	slug: text("slug").notNull().unique(),
	description: text("description").notNull(),
	shortDescription: text("short_description"),
	thumbnailUrl: text("thumbnail_url"),
	price: numeric("price", { precision: 10, scale: 2 }).notNull().default("0"),
	durationDays: integer("duration_days").notNull().default(30),
	assessmentUnlockDays: integer("assessment_unlock_days").notNull().default(2),
	status: courseStatusEnum("status").notNull().default("draft"),
	createdBy: text("created_by")
		.notNull()
		.references(() => user.id),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Course Video ─────────────────────────────────────────────────────────────
export const courseVideo = pgTable("course_video", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => createId()),
	courseId: text("course_id")
		.notNull()
		.references(() => course.id, { onDelete: "cascade" }),
	title: text("title").notNull(),
	description: text("description"),
	videoUrl: text("video_url").notNull(),
	videoKey: text("video_key"),
	duration: integer("duration"),
	sortOrder: integer("sort_order").notNull().default(0),
	isPreview: boolean("is_preview").notNull().default(false),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Live Class ───────────────────────────────────────────────────────────────
export const liveClass = pgTable("live_class", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => createId()),
	courseId: text("course_id")
		.notNull()
		.references(() => course.id, { onDelete: "cascade" }),
	title: text("title").notNull(),
	description: text("description"),
	joinUrl: text("join_url").notNull(),
	scheduledAt: timestamp("scheduled_at").notNull(),
	durationMinutes: integer("duration_minutes").notNull().default(60),
	isCompleted: boolean("is_completed").notNull().default(false),
	recordingUrl: text("recording_url"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Enrollment ───────────────────────────────────────────────────────────────
// The status column uses sql`'active'` as its default instead of .default("active").
// This keeps the DB default while preventing Drizzle from narrowing the
// $inferSelect type to just "active" — which would make "revoked" comparisons
// look unreachable to TypeScript's control-flow analysis.
export const enrollment = pgTable("enrollment", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => createId()),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	courseId: text("course_id")
		.notNull()
		.references(() => course.id, { onDelete: "cascade" }),
	status: enrollmentStatusEnum("status").notNull().default(sql`'active'`),
	enrolledAt: timestamp("enrolled_at").notNull().defaultNow(),
	expiresAt: timestamp("expires_at").notNull(),
	assessmentUnlocksAt: timestamp("assessment_unlocks_at").notNull(),
	grantedByAdmin: boolean("granted_by_admin").notNull().default(false),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Relations ────────────────────────────────────────────────────────────────
export const courseRelations = relations(course, ({ many, one }) => ({
	videos: many(courseVideo),
	liveClasses: many(liveClass),
	enrollments: many(enrollment),
	createdByUser: one(user, {
		fields: [course.createdBy],
		references: [user.id],
	}),
}));

export const courseVideoRelations = relations(courseVideo, ({ one }) => ({
	course: one(course, {
		fields: [courseVideo.courseId],
		references: [course.id],
	}),
}));

export const liveClassRelations = relations(liveClass, ({ one }) => ({
	course: one(course, {
		fields: [liveClass.courseId],
		references: [course.id],
	}),
}));

export const enrollmentRelations = relations(enrollment, ({ one }) => ({
	user: one(user, {
		fields: [enrollment.userId],
		references: [user.id],
	}),
	course: one(course, {
		fields: [enrollment.courseId],
		references: [course.id],
	}),
}));

// ─── Types ────────────────────────────────────────────────────────────────────
export type Course = typeof course.$inferSelect;
export type NewCourse = typeof course.$inferInsert;
export type CourseVideo = typeof courseVideo.$inferSelect;
export type NewCourseVideo = typeof courseVideo.$inferInsert;
export type LiveClass = typeof liveClass.$inferSelect;
export type NewLiveClass = typeof liveClass.$inferInsert;
export type Enrollment = typeof enrollment.$inferSelect;
export type NewEnrollment = typeof enrollment.$inferInsert;
export type CourseStatus = (typeof courseStatusEnum.enumValues)[number];
export type EnrollmentStatus = (typeof enrollmentStatusEnum.enumValues)[number];
