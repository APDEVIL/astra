import "server-only";

import { and, eq } from "drizzle-orm";
import { ROLES, type Role } from "@/lib/constants";
import { Errors } from "@/lib/errors";
import { db } from "@/server/db";
import {
	type Enrollment,
	enrollment,
	quest,
	type Subscription,
	subscription,
	workshopParticipant,
} from "@/server/db/schema";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface CourseAccessResult {
	enrollment: Enrollment;
	canWatchLive: boolean;
	canWatchRecordings: boolean;
	canAccessAssessment: boolean;
	daysRemaining: number;
	assessmentUnlocksAt: Date;
}

export interface WorkshopAccessResult {
	participant: typeof workshopParticipant.$inferSelect;
	isConfirmed: boolean;
	participantEventId: string;
}

// ─── Access Service ───────────────────────────────────────────────────────────
export const AccessService = {
	// ── Role guards ────────────────────────────────────────────────────────────

	hasRole(userRole: string, requiredRole: Role): boolean {
		const hierarchy: Role[] = [ROLES.USER, ROLES.SUBSCRIPTION, ROLES.ADMIN];
		return (
			hierarchy.indexOf(userRole as Role) >= hierarchy.indexOf(requiredRole)
		);
	},

	assertAdmin(userRole: string): void {
		if (userRole !== ROLES.ADMIN) throw Errors.forbidden();
	},

	assertSubscription(userRole: string): void {
		if (userRole !== ROLES.SUBSCRIPTION && userRole !== ROLES.ADMIN) {
			throw Errors.subscriptionRequired();
		}
	},

	// ── Course access ──────────────────────────────────────────────────────────

	async getCourseAccess(
		userId: string,
		courseId: string,
	): Promise<CourseAccessResult> {
		const [row] = await db
			.select()
			.from(enrollment)
			.where(
				and(eq(enrollment.userId, userId), eq(enrollment.courseId, courseId)),
			)
			.limit(1);

		if (!row) throw Errors.enrollmentNotFound();

		// The enrollment status column uses sql`'active'` as its DB default
		// (not .default("active")) so Drizzle infers the full enum union:
		// "active" | "expired" | "revoked". All three comparisons are valid.
		if (row.status === "revoked") {
			throw Errors.forbidden("Your access to this course has been revoked");
		}

		const now = new Date();
		const expiresAt = new Date(row.expiresAt);
		const assessmentUnlocksAt = new Date(row.assessmentUnlocksAt);
		const isActive = (row.status as string) === "active" && now < expiresAt;
		const msRemaining = Math.max(0, expiresAt.getTime() - now.getTime());

		return {
			enrollment: row,
			canWatchLive: isActive,
			canWatchRecordings:
				(row.status as string) !== "revoked" && now < expiresAt,
			canAccessAssessment: isActive && now >= assessmentUnlocksAt,
			daysRemaining: Math.ceil(msRemaining / (1000 * 60 * 60 * 24)),
			assessmentUnlocksAt,
		};
	},

	async assertCourseAccess(
		userId: string,
		courseId: string,
	): Promise<CourseAccessResult> {
		const access = await AccessService.getCourseAccess(userId, courseId);
		if (!access.canWatchRecordings) throw Errors.enrollmentExpired();
		return access;
	},

	async assertAssessmentAccess(
		userId: string,
		courseId: string,
	): Promise<CourseAccessResult> {
		const access = await AccessService.getCourseAccess(userId, courseId);
		if (!access.canWatchRecordings) throw Errors.enrollmentExpired();
		if (!access.canAccessAssessment) {
			throw Errors.assessmentLocked(access.assessmentUnlocksAt);
		}
		return access;
	},

	async getEnrollmentStatus(
		userId: string,
		courseId: string,
	): Promise<CourseAccessResult | null> {
		try {
			return await AccessService.getCourseAccess(userId, courseId);
		} catch {
			return null;
		}
	},

	// ── Workshop access ────────────────────────────────────────────────────────

	async getWorkshopAccess(
		userId: string,
		workshopId: string,
	): Promise<WorkshopAccessResult> {
		const [row] = await db
			.select()
			.from(workshopParticipant)
			.where(
				and(
					eq(workshopParticipant.userId, userId),
					eq(workshopParticipant.workshopId, workshopId),
				),
			)
			.limit(1);

		if (!row) throw Errors.notFound("Workshop registration");

		return {
			participant: row,
			isConfirmed: row.status === "confirmed",
			participantEventId: row.participantEventId,
		};
	},

	async assertWorkshopAccess(
		userId: string,
		workshopId: string,
	): Promise<WorkshopAccessResult> {
		const access = await AccessService.getWorkshopAccess(userId, workshopId);
		if (!access.isConfirmed) {
			throw Errors.forbidden(
				"Your workshop registration is pending payment confirmation",
			);
		}
		return access;
	},

	// ── Subscription access ────────────────────────────────────────────────────

	async getActiveSubscription(userId: string): Promise<Subscription | null> {
		const [row] = await db
			.select()
			.from(subscription)
			.where(
				and(eq(subscription.userId, userId), eq(subscription.status, "active")),
			)
			.limit(1);

		if (!row) return null;
		if (new Date(row.endDate) < new Date()) return null;
		return row;
	},

	async assertActiveSubscription(userId: string): Promise<Subscription> {
		const sub = await AccessService.getActiveSubscription(userId);
		if (!sub) throw Errors.subscriptionRequired();
		return sub;
	},

	// ── Quest / Paper trading ─────────────────────────────────────────────────

	async getQuestForEnrollment(enrollmentId: string) {
		const [row] = await db
			.select()
			.from(quest)
			.where(eq(quest.enrollmentId, enrollmentId))
			.limit(1);
		return row ?? null;
	},

	async getAssessmentContext(userId: string, courseId: string) {
		const access = await AccessService.assertAssessmentAccess(userId, courseId);
		const existingQuest = await AccessService.getQuestForEnrollment(
			access.enrollment.id,
		);
		return { access, quest: existingQuest };
	},
};
