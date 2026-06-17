import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
	integer,
	numeric,
	pgEnum,
	pgTable,
	text,
	timestamp,
} from "drizzle-orm/pg-core";

import { user } from "./auth";
import { course, enrollment } from "./course";

// ─── Enums ────────────────────────────────────────────────────────────────────
export const tradeTypeEnum = pgEnum("trade_type", ["buy", "sell"]);

export const tradeStatusEnum = pgEnum("trade_status", [
	"open",
	"closed",
	"cancelled",
]);

export const performanceGradeEnum = pgEnum("performance_grade", [
	"excellent",
	"good",
	"average",
	"poor",
]);

// ─── Quest (Assessment Module) ────────────────────────────────────────────────
// One quest per enrollment. Unlocks after assessmentUnlocksAt.
// Tracks the overall performance summary for a user in a course.
export const quest = pgTable("quest", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => createId()),
	enrollmentId: text("enrollment_id")
		.notNull()
		.unique()
		.references(() => enrollment.id, { onDelete: "cascade" }),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	courseId: text("course_id")
		.notNull()
		.references(() => course.id, { onDelete: "cascade" }),
	// Paper funding (virtual capital) in INR
	initialCapital: numeric("initial_capital", {
		precision: 14,
		scale: 2,
	})
		.notNull()
		.default("100000"),
	currentCapital: numeric("current_capital", {
		precision: 14,
		scale: 2,
	})
		.notNull()
		.default("100000"),
	totalPnl: numeric("total_pnl", { precision: 14, scale: 2 })
		.notNull()
		.default("0"),
	totalTrades: integer("total_trades").notNull().default(0),
	winningTrades: integer("winning_trades").notNull().default(0),
	losingTrades: integer("losing_trades").notNull().default(0),
	// Win rate percentage (0–100)
	winRate: numeric("win_rate", { precision: 5, scale: 2 }).default("0"),
	grade: performanceGradeEnum("grade"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Paper Trade ──────────────────────────────────────────────────────────────
// Individual trade entries submitted by the user in the Quest module.
export const paperTrade = pgTable("paper_trade", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => createId()),
	questId: text("quest_id")
		.notNull()
		.references(() => quest.id, { onDelete: "cascade" }),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	// Instrument / stock symbol
	symbol: text("symbol").notNull(),
	type: tradeTypeEnum("type").notNull(),
	status: tradeStatusEnum("status").notNull().default("open"),
	quantity: integer("quantity").notNull(),
	entryPrice: numeric("entry_price", { precision: 12, scale: 2 }).notNull(),
	exitPrice: numeric("exit_price", { precision: 12, scale: 2 }),
	// Realised P&L (null while trade is open)
	realisedPnl: numeric("realised_pnl", { precision: 12, scale: 2 }),
	// Notes / rationale submitted by user
	notes: text("notes"),
	enteredAt: timestamp("entered_at").notNull().defaultNow(),
	exitedAt: timestamp("exited_at"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Relations ────────────────────────────────────────────────────────────────
export const questRelations = relations(quest, ({ one, many }) => ({
	enrollment: one(enrollment, {
		fields: [quest.enrollmentId],
		references: [enrollment.id],
	}),
	user: one(user, {
		fields: [quest.userId],
		references: [user.id],
	}),
	course: one(course, {
		fields: [quest.courseId],
		references: [course.id],
	}),
	trades: many(paperTrade),
}));

export const paperTradeRelations = relations(paperTrade, ({ one }) => ({
	quest: one(quest, {
		fields: [paperTrade.questId],
		references: [quest.id],
	}),
	user: one(user, {
		fields: [paperTrade.userId],
		references: [user.id],
	}),
}));

// ─── Types ────────────────────────────────────────────────────────────────────
export type Quest = typeof quest.$inferSelect;
export type NewQuest = typeof quest.$inferInsert;
export type PaperTrade = typeof paperTrade.$inferSelect;
export type NewPaperTrade = typeof paperTrade.$inferInsert;
export type TradeType = (typeof tradeTypeEnum.enumValues)[number];
export type TradeStatus = (typeof tradeStatusEnum.enumValues)[number];
export type PerformanceGrade = (typeof performanceGradeEnum.enumValues)[number];
