import "server-only";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { ROLES } from "@/lib/constants";
import { auth } from "@/server/better-auth";
import { db } from "@/server/db";
import { user } from "@/server/db/schema";

const f = createUploadthing();

// ─── Auth middleware factory ──────────────────────────────────────────────────
// Better Auth's session type only includes the base user fields defined by the
// library itself. Our `role` column is an additionalField stored on the user
// table — we must fetch it from the DB explicitly after verifying the session.
//
// This is intentional: it prevents client-side tampering with the role, because
// the value always comes from the DB, never from the session cookie payload.
function withAuth(opts: { adminOnly?: boolean } = {}) {
	return async () => {
		const session = await auth.api.getSession({ headers: await headers() });

		if (!session?.user) {
			throw new UploadThingError("You must be logged in to upload files");
		}

		// Fetch role from DB — the only trustworthy source
		const [dbUser] = await db
			.select({ id: user.id, role: user.role })
			.from(user)
			.where(eq(user.id, session.user.id))
			.limit(1);

		if (!dbUser) {
			throw new UploadThingError("User account not found");
		}

		if (opts.adminOnly && dbUser.role !== ROLES.ADMIN) {
			throw new UploadThingError(
				"Only administrators can upload to this endpoint",
			);
		}

		// Returned metadata is available inside onUploadComplete
		return {
			userId: dbUser.id,
			userRole: dbUser.role,
		};
	};
}

// ─── File Router ──────────────────────────────────────────────────────────────
// Each key = one upload endpoint at POST /api/uploadthing
export const ourFileRouter = {
	// ── Course thumbnail (admin only) ──────────────────────────────────────────
	courseThumbnail: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
		.middleware(withAuth({ adminOnly: true }))
		.onUploadComplete(async ({ metadata, file }) => {
			console.log(
				`[UploadThing] courseThumbnail — user:${metadata.userId} url:${file.url}`,
			);
			return { url: file.url, key: file.key };
		}),

	// ── Course video (admin only) ──────────────────────────────────────────────
	courseVideo: f({ video: { maxFileSize: "512MB", maxFileCount: 1 } })
		.middleware(withAuth({ adminOnly: true }))
		.onUploadComplete(async ({ metadata, file }) => {
			console.log(
				`[UploadThing] courseVideo — user:${metadata.userId} url:${file.url}`,
			);
			return { url: file.url, key: file.key };
		}),

	// ── Event / Workshop banner (admin only) ───────────────────────────────────
	eventBanner: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
		.middleware(withAuth({ adminOnly: true }))
		.onUploadComplete(async ({ metadata, file }) => {
			console.log(
				`[UploadThing] eventBanner — user:${metadata.userId} url:${file.url}`,
			);
			return { url: file.url, key: file.key };
		}),

	// ── Faculty / host avatar (admin only) ─────────────────────────────────────
	facultyAvatar: f({ image: { maxFileSize: "2MB", maxFileCount: 1 } })
		.middleware(withAuth({ adminOnly: true }))
		.onUploadComplete(async ({ metadata, file }) => {
			console.log(
				`[UploadThing] facultyAvatar — user:${metadata.userId} url:${file.url}`,
			);
			return { url: file.url, key: file.key };
		}),

	// ── Achievement icon / image (admin only) ──────────────────────────────────
	achievementImage: f({ image: { maxFileSize: "2MB", maxFileCount: 1 } })
		.middleware(withAuth({ adminOnly: true }))
		.onUploadComplete(async ({ metadata, file }) => {
			console.log(
				`[UploadThing] achievementImage — user:${metadata.userId} url:${file.url}`,
			);
			return { url: file.url, key: file.key };
		}),

	// ── News cover image (admin only) ─────────────────────────────────────────
	newsCover: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
		.middleware(withAuth({ adminOnly: true }))
		.onUploadComplete(async ({ metadata, file }) => {
			console.log(
				`[UploadThing] newsCover — user:${metadata.userId} url:${file.url}`,
			);
			return { url: file.url, key: file.key };
		}),

	// ── Workshop update attachment (admin only) ────────────────────────────────
	// PDF or image resources shared with confirmed participants
	workshopAttachment: f({
		pdf: { maxFileSize: "16MB", maxFileCount: 1 },
		image: { maxFileSize: "4MB", maxFileCount: 1 },
	})
		.middleware(withAuth({ adminOnly: true }))
		.onUploadComplete(async ({ metadata, file }) => {
			console.log(
				`[UploadThing] workshopAttachment — user:${metadata.userId} url:${file.url}`,
			);
			return { url: file.url, key: file.key };
		}),

	// ── User profile avatar (any authenticated user) ───────────────────────────
	userAvatar: f({ image: { maxFileSize: "2MB", maxFileCount: 1 } })
		.middleware(withAuth())
		.onUploadComplete(async ({ metadata, file }) => {
			console.log(
				`[UploadThing] userAvatar — user:${metadata.userId} url:${file.url}`,
			);
			return { url: file.url, key: file.key };
		}),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
