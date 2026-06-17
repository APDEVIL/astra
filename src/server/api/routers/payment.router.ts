import { z } from "zod";
import { trpcSafe } from "@/lib/errors";
import { PaymentService } from "@/server/services/payment.service";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const paymentRouter = createTRPCRouter({
	// ── Create a Razorpay order ─────────────────────────────────────────────
	// Generic endpoint — use course.initiatePurchase / event.registerWorkshop
	// for entity-specific flows. This is a direct override for admin use.
	createOrder: protectedProcedure
		.input(
			z.object({
				purpose: z.enum(["course", "workshop"]),
				entityId: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return trpcSafe(async () => {
				return PaymentService.createOrder({
					userId: ctx.session.user.id,
					purpose: input.purpose,
					entityId: input.entityId,
				});
			});
		}),

	// ── Verify payment signature after Razorpay checkout success ───────────
	verifyPayment: protectedProcedure
		.input(
			z.object({
				razorpayOrderId: z.string(),
				razorpayPaymentId: z.string(),
				razorpaySignature: z.string(),
			}),
		)
		.mutation(async ({ ctx: _ctx, input }) => {
			return trpcSafe(async () => {
				return PaymentService.verifyPayment(input);
			});
		}),

	// ── Get current user's full transaction history ─────────────────────────
	myTransactions: protectedProcedure.query(async ({ ctx }) => {
		return trpcSafe(async () => {
			return PaymentService.getUserTransactions(ctx.session.user.id);
		});
	}),
});
