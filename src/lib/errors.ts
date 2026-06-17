import { TRPCError } from "@trpc/server";

// ─── Supported tRPC error codes (typed manually to avoid unstable import) ─────
type TRPCErrorCode =
	| "PARSE_ERROR"
	| "BAD_REQUEST"
	| "INTERNAL_SERVER_ERROR"
	| "NOT_IMPLEMENTED"
	| "UNAUTHORIZED"
	| "FORBIDDEN"
	| "NOT_FOUND"
	| "METHOD_NOT_SUPPORTED"
	| "TIMEOUT"
	| "CONFLICT"
	| "PRECONDITION_FAILED"
	| "PAYLOAD_TOO_LARGE"
	| "UNPROCESSABLE_CONTENT"
	| "TOO_MANY_REQUESTS"
	| "CLIENT_CLOSED_REQUEST";

// ─── Base app error ───────────────────────────────────────────────────────────
export class AppError extends Error {
	public readonly code: TRPCErrorCode;
	public readonly cause?: unknown;

	constructor(
		message: string,
		code: TRPCErrorCode = "INTERNAL_SERVER_ERROR",
		cause?: unknown,
	) {
		super(message);
		this.name = "AppError";
		this.code = code;
		this.cause = cause;
	}

	toTRPC(): TRPCError {
		return new TRPCError({
			code: this.code,
			message: this.message,
			cause: this.cause,
		});
	}
}

// ─── Convenience constructors ─────────────────────────────────────────────────
export const Errors = {
	notFound: (entity: string, id?: string) =>
		new AppError(
			id ? `${entity} with id "${id}" not found` : `${entity} not found`,
			"NOT_FOUND",
		),
	unauthorized: (message = "You must be logged in") =>
		new AppError(message, "UNAUTHORIZED"),
	forbidden: (message = "You do not have permission to do this") =>
		new AppError(message, "FORBIDDEN"),
	badRequest: (message: string) => new AppError(message, "BAD_REQUEST"),
	conflict: (message: string) => new AppError(message, "CONFLICT"),
	internal: (message: string, cause?: unknown) =>
		new AppError(message, "INTERNAL_SERVER_ERROR", cause),
	enrollmentExpired: () =>
		new AppError("Your enrollment for this course has expired", "FORBIDDEN"),
	enrollmentNotFound: () =>
		new AppError("You are not enrolled in this course", "FORBIDDEN"),
	assessmentLocked: (unlocksAt: Date) =>
		new AppError(
			`Paper trading unlocks on ${unlocksAt.toLocaleDateString("en-IN")}`,
			"FORBIDDEN",
		),
	workshopFull: () =>
		new AppError(
			"This workshop has reached its maximum participant limit",
			"CONFLICT",
		),
	alreadyRegistered: (entity: string) =>
		new AppError(`You are already registered for this ${entity}`, "CONFLICT"),
	paymentVerificationFailed: () =>
		new AppError(
			"Payment verification failed — signature mismatch",
			"BAD_REQUEST",
		),
	subscriptionRequired: () =>
		new AppError(
			"This feature requires an active Astra subscription",
			"FORBIDDEN",
		),
} as const;

export async function trpcSafe<T>(fn: () => Promise<T>): Promise<T> {
	try {
		return await fn();
	} catch (err) {
		if (err instanceof AppError) throw err.toTRPC();
		if (err instanceof TRPCError) throw err;
		const message =
			err instanceof Error ? err.message : "An unexpected error occurred";
		throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message, cause: err });
	}
}
