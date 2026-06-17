import { createHmac, timingSafeEqual } from "crypto";
import Razorpay from "razorpay";

import { env } from "@/env";

// ─── Singleton client ─────────────────────────────────────────────────────────
// Instantiated once and reused across the process lifetime.
// Never expose this to the client — it carries the secret key.
let _razorpay: Razorpay | null = null;

export function getRazorpay(): Razorpay {
	if (!_razorpay) {
		_razorpay = new Razorpay({
			key_id: env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
			key_secret: env.RAZORPAY_KEY_SECRET,
		});
	}
	return _razorpay;
}

// ─── HMAC verification ────────────────────────────────────────────────────────
/**
 * Verify a Razorpay payment signature after checkout success.
 *
 * The signature is HMAC-SHA256 of `orderId|paymentId` using the key secret.
 * Uses timing-safe comparison to prevent timing attacks.
 *
 * @see https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/build-integration/#step-3-handle-successful-payments
 */
export function verifyPaymentSignature(params: {
	orderId: string;
	paymentId: string;
	signature: string;
}): boolean {
	const { orderId, paymentId, signature } = params;
	const body = `${orderId}|${paymentId}`;

	const expectedSignature = createHmac("sha256", env.RAZORPAY_KEY_SECRET)
		.update(body)
		.digest("hex");

	const expected = Buffer.from(expectedSignature, "hex");
	const received = Buffer.from(signature, "hex");

	// Lengths must match before timingSafeEqual
	if (expected.length !== received.length) return false;

	return timingSafeEqual(expected, received);
}

/**
 * Verify a Razorpay webhook signature.
 *
 * The signature is HMAC-SHA256 of the raw request body using the webhook secret.
 *
 * @see https://razorpay.com/docs/webhooks/validate-test/#validate-webhooks
 */
export function verifyWebhookSignature(params: {
	rawBody: string;
	signature: string;
}): boolean {
	const { rawBody, signature } = params;

	const expectedSignature = createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
		.update(rawBody)
		.digest("hex");

	const expected = Buffer.from(expectedSignature, "hex");
	const received = Buffer.from(signature, "hex");

	if (expected.length !== received.length) return false;

	return timingSafeEqual(expected, received);
}

// ─── Types (re-export for convenience) ────────────────────────────────────────
export type { Razorpay };
