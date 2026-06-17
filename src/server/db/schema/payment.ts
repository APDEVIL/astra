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
import { workshop, workshopParticipant } from "./event";

// ─── Enums ────────────────────────────────────────────────────────────────────
export const paymentStatusEnum = pgEnum("payment_status", [
	"created", // Razorpay order created, user hasn't paid yet
	"attempted", // User opened checkout
	"paid", // Webhook confirmed payment
	"failed", // Payment failed / expired
	"refunded",
]);

export const paymentPurposeEnum = pgEnum("payment_purpose", [
	"course",
	"workshop",
	"subscription",
]);

// ─── Razorpay Order ───────────────────────────────────────────────────────────
// One row created per checkout attempt via Razorpay's Orders API.
// Linked to the downstream entity (course or workshop) via purpose + entityId.
export const razorpayOrder = pgTable("razorpay_order", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => createId()),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	// Razorpay's own order ID — e.g. "order_ABC123"
	razorpayOrderId: text("razorpay_order_id").notNull().unique(),
	purpose: paymentPurposeEnum("purpose").notNull(),
	// ID of the course / workshop / subscription being purchased
	entityId: text("entity_id").notNull(),
	// Amount in paise (INR × 100)
	amount: integer("amount").notNull(),
	currency: text("currency").notNull().default("INR"),
	status: paymentStatusEnum("status").notNull().default("created"),
	// Razorpay payment ID — populated by webhook on success
	razorpayPaymentId: text("razorpay_payment_id"),
	// Razorpay signature — stored for audit; verified server-side before trusting
	razorpaySignature: text("razorpay_signature"),
	// Raw webhook payload stored for debugging / re-processing
	webhookPayload: text("webhook_payload"),
	expiresAt: timestamp("expires_at"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Transaction ──────────────────────────────────────────────────────────────
// Immutable record created when a payment succeeds.
// This is the source of truth for revenue analytics.
export const transaction = pgTable("transaction", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => createId()),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	orderId: text("order_id")
		.notNull()
		.unique()
		.references(() => razorpayOrder.id),
	// Nullable FKs — only one will be set depending on purpose
	enrollmentId: text("enrollment_id").references(() => enrollment.id, {
		onDelete: "set null",
	}),
	workshopParticipantId: text("workshop_participant_id").references(
		() => workshopParticipant.id,
		{ onDelete: "set null" },
	),
	purpose: paymentPurposeEnum("purpose").notNull(),
	// Amount in INR (human-readable) for display / analytics
	amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
	currency: text("currency").notNull().default("INR"),
	razorpayPaymentId: text("razorpay_payment_id").notNull(),
	paidAt: timestamp("paid_at").notNull().defaultNow(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Relations ────────────────────────────────────────────────────────────────
export const razorpayOrderRelations = relations(razorpayOrder, ({ one }) => ({
	user: one(user, {
		fields: [razorpayOrder.userId],
		references: [user.id],
	}),
	transaction: one(transaction, {
		fields: [razorpayOrder.id],
		references: [transaction.orderId],
	}),
}));

export const transactionRelations = relations(transaction, ({ one }) => ({
	user: one(user, {
		fields: [transaction.userId],
		references: [user.id],
	}),
	order: one(razorpayOrder, {
		fields: [transaction.orderId],
		references: [razorpayOrder.id],
	}),
	enrollment: one(enrollment, {
		fields: [transaction.enrollmentId],
		references: [enrollment.id],
	}),
	workshopParticipant: one(workshopParticipant, {
		fields: [transaction.workshopParticipantId],
		references: [workshopParticipant.id],
	}),
}));

// ─── Types ────────────────────────────────────────────────────────────────────
export type RazorpayOrder = typeof razorpayOrder.$inferSelect;
export type NewRazorpayOrder = typeof razorpayOrder.$inferInsert;
export type Transaction = typeof transaction.$inferSelect;
export type NewTransaction = typeof transaction.$inferInsert;
export type PaymentStatus = (typeof paymentStatusEnum.enumValues)[number];
export type PaymentPurpose = (typeof paymentPurposeEnum.enumValues)[number];
