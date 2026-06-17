import "server-only";

import { desc, eq } from "drizzle-orm";
import { RAZORPAY_ORDER_TTL_MINUTES } from "@/lib/constants";
import { Errors } from "@/lib/errors";
import {
	getRazorpay,
	verifyPaymentSignature,
	verifyWebhookSignature,
} from "@/lib/razorpay";
import { addDays, addHours, inrToPaise } from "@/lib/utils";
import { db } from "@/server/db";
import {
	course,
	enrollment,
	type PaymentPurpose,
	razorpayOrder,
	transaction,
	workshop,
	workshopParticipant,
} from "@/server/db/schema";
import { NotificationService } from "./notification.service";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface CreateOrderInput {
	userId: string;
	purpose: PaymentPurpose;
	entityId: string; // courseId or workshopId
}

export interface CreateOrderResult {
	orderId: string; // Our internal DB id
	razorpayOrderId: string; // Passed to Razorpay checkout
	amount: number; // In paise
	currency: string;
	entityTitle: string;
}

export interface VerifyPaymentInput {
	razorpayOrderId: string;
	razorpayPaymentId: string;
	razorpaySignature: string;
}

// ─── Payment Service ──────────────────────────────────────────────────────────
export const PaymentService = {
	// ── Create Razorpay order ─────────────────────────────────────────────────
	async createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
		const { userId, purpose, entityId } = input;

		// Resolve the entity and get its price
		let amountInr: number;
		let entityTitle: string;

		if (purpose === "course") {
			const [entity] = await db
				.select({
					price: course.price,
					title: course.title,
					status: course.status,
				})
				.from(course)
				.where(eq(course.id, entityId))
				.limit(1);

			if (!entity) throw Errors.notFound("Course", entityId);
			if (entity.status !== "published")
				throw Errors.badRequest("This course is not available for purchase");

			amountInr = parseFloat(entity.price);
			entityTitle = entity.title;
		} else if (purpose === "workshop") {
			const [entity] = await db
				.select({
					fee: workshop.fee,
					title: workshop.title,
					type: workshop.type,
					status: workshop.status,
				})
				.from(workshop)
				.where(eq(workshop.id, entityId))
				.limit(1);

			if (!entity) throw Errors.notFound("Workshop", entityId);
			if (entity.status === "cancelled" || entity.status === "completed")
				throw Errors.badRequest(
					"This workshop is no longer accepting registrations",
				);
			if (entity.type === "free")
				throw Errors.badRequest("Free workshops do not require payment");

			amountInr = parseFloat(entity.fee);
			entityTitle = entity.title;
		} else {
			throw Errors.badRequest(`Unsupported payment purpose: ${purpose}`);
		}

		const amountInPaise = inrToPaise(amountInr);

		// Create order via Razorpay API
		const razorpay = getRazorpay();
		const rzpOrder = await razorpay.orders.create({
			amount: amountInPaise,
			currency: "INR",
			// Receipt is our internal reference — max 40 chars
			receipt:
				`${purpose.slice(0, 1)}_${entityId.slice(0, 20)}_${Date.now()}`.slice(
					0,
					40,
				),
		});

		// Persist to DB
		const expiresAt = addHours(RAZORPAY_ORDER_TTL_MINUTES / 60);

		const [dbOrder] = await db
			.insert(razorpayOrder)
			.values({
				userId,
				razorpayOrderId: rzpOrder.id,
				purpose,
				entityId,
				amount: amountInPaise,
				currency: "INR",
				status: "created",
				expiresAt,
			})
			.returning();

		if (!dbOrder) throw Errors.internal("Failed to persist Razorpay order");

		return {
			orderId: dbOrder.id,
			razorpayOrderId: rzpOrder.id,
			amount: amountInPaise,
			currency: "INR",
			entityTitle,
		};
	},

	// ── Verify payment (called from client after Razorpay checkout) ───────────
	async verifyPayment(
		input: VerifyPaymentInput,
	): Promise<{ success: boolean }> {
		const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = input;

		// 1. Verify HMAC signature
		const isValid = verifyPaymentSignature({
			orderId: razorpayOrderId,
			paymentId: razorpayPaymentId,
			signature: razorpaySignature,
		});

		if (!isValid) throw Errors.paymentVerificationFailed();

		// 2. Fetch our order record
		const [order] = await db
			.select()
			.from(razorpayOrder)
			.where(eq(razorpayOrder.razorpayOrderId, razorpayOrderId))
			.limit(1);

		if (!order) throw Errors.notFound("Order");
		if (order.status === "paid") return { success: true }; // idempotent

		// 3. Mark order as paid and fulfil
		await db
			.update(razorpayOrder)
			.set({
				status: "paid",
				razorpayPaymentId,
				razorpaySignature,
				updatedAt: new Date(),
			})
			.where(eq(razorpayOrder.id, order.id));

		await PaymentService._fulfil(
			order.id,
			order.userId,
			order.purpose,
			order.entityId,
			order.amount,
			razorpayPaymentId,
		);

		return { success: true };
	},

	// ── Razorpay webhook handler ──────────────────────────────────────────────
	async handleWebhook(rawBody: string, signature: string): Promise<void> {
		// Verify webhook signature
		const isValid = verifyWebhookSignature({ rawBody, signature });
		if (!isValid) throw Errors.paymentVerificationFailed();

		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const payload = JSON.parse(rawBody);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		const event = payload?.event as string | undefined;

		if (event === "payment.captured") {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			const rzpOrderId = payload?.payload?.payment?.entity?.order_id as string;
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			const rzpPaymentId = payload?.payload?.payment?.entity?.id as string;

			if (!rzpOrderId || !rzpPaymentId) return;

			const [order] = await db
				.select()
				.from(razorpayOrder)
				.where(eq(razorpayOrder.razorpayOrderId, rzpOrderId))
				.limit(1);

			if (!order || order.status === "paid") return;

			await db
				.update(razorpayOrder)
				.set({
					status: "paid",
					razorpayPaymentId: rzpPaymentId,
					webhookPayload: rawBody,
					updatedAt: new Date(),
				})
				.where(eq(razorpayOrder.id, order.id));

			await PaymentService._fulfil(
				order.id,
				order.userId,
				order.purpose,
				order.entityId,
				order.amount,
				rzpPaymentId,
			);
		}

		if (event === "payment.failed") {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			const rzpOrderId = payload?.payload?.payment?.entity?.order_id as string;
			if (!rzpOrderId) return;

			await db
				.update(razorpayOrder)
				.set({
					status: "failed",
					webhookPayload: rawBody,
					updatedAt: new Date(),
				})
				.where(eq(razorpayOrder.razorpayOrderId, rzpOrderId));
		}
	},

	// ── Internal: fulfil order after confirmed payment ────────────────────────
	async _fulfil(
		orderId: string,
		userId: string,
		purpose: PaymentPurpose,
		entityId: string,
		amountInPaise: number,
		razorpayPaymentId: string,
	): Promise<void> {
		const amountInr = (amountInPaise / 100).toFixed(2);

		if (purpose === "course") {
			// Fetch course config
			const [c] = await db
				.select({
					durationDays: course.durationDays,
					assessmentUnlockDays: course.assessmentUnlockDays,
					title: course.title,
				})
				.from(course)
				.where(eq(course.id, entityId))
				.limit(1);

			if (!c) return;

			const now = new Date();
			const expiresAt = addDays(c.durationDays, now);
			const assessmentUnlocksAt = addDays(c.assessmentUnlockDays, now);

			// Create enrollment
			const [newEnrollment] = await db
				.insert(enrollment)
				.values({ userId, courseId: entityId, expiresAt, assessmentUnlocksAt })
				.returning();

			if (!newEnrollment) return;

			// Create transaction record
			await db.insert(transaction).values({
				userId,
				orderId,
				enrollmentId: newEnrollment.id,
				purpose,
				amount: amountInr,
				currency: "INR",
				razorpayPaymentId,
			});

			// Notify user
			await NotificationService.send({
				userId,
				type: "course_purchase",
				title: "Enrollment confirmed! 🎉",
				body: `You're now enrolled in "${c.title}". Your access is active until ${expiresAt.toLocaleDateString("en-IN")}.`,
				entityType: "course",
				entityId,
				ctaUrl: `/dashboard/courses/${entityId}`,
				ctaLabel: "Go to course",
			});
		} else if (purpose === "workshop") {
			// Confirm participant
			const [participant] = await db
				.select()
				.from(workshopParticipant)
				.where(eq(workshopParticipant.userId, userId))
				.limit(1);

			if (!participant) return;

			await db
				.update(workshopParticipant)
				.set({
					status: "confirmed",
					confirmedAt: new Date(),
					updatedAt: new Date(),
				})
				.where(eq(workshopParticipant.id, participant.id));

			// Create transaction record
			await db.insert(transaction).values({
				userId,
				orderId,
				workshopParticipantId: participant.id,
				purpose,
				amount: amountInr,
				currency: "INR",
				razorpayPaymentId,
			});

			// Notify user
			await NotificationService.send({
				userId,
				type: "workshop_confirmed",
				title: "Workshop registration confirmed! 🎉",
				body: `Your spot is confirmed. Your participant ID is ${participant.participantEventId}.`,
				entityType: "workshop",
				entityId,
				ctaUrl: `/workshops/${entityId}`,
				ctaLabel: "View workshop",
			});
		}
	},

	// ── Payment history for a user ─────────────────────────────────────────────
	async getUserTransactions(userId: string) {
		return db
			.select()
			.from(transaction)
			.where(eq(transaction.userId, userId))
			.orderBy(desc(transaction.paidAt));
	},
};
