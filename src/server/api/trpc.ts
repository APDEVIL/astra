import { initTRPC, TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import superjson from "superjson";
import { ZodError } from "zod";
import { ROLES } from "@/lib/constants";
import { auth } from "@/server/better-auth";
import { db } from "@/server/db";
import { user } from "@/server/db/schema";

// ─── 1. Context ───────────────────────────────────────────────────────────────
// Better Auth's session user type only includes the base fields the library
// manages itself (id, email, name, image, emailVerified). Our `role` column is
// an additionalField stored in Postgres — we fetch it from the DB here so every
// procedure has it available on ctx.session.user without extra queries.
export const createTRPCContext = async (opts: { headers: Headers }) => {
	const session = await auth.api.getSession({ headers: opts.headers });

	if (!session?.user) {
		return { db, session: null, ...opts };
	}

	// Fetch role from DB — the only trustworthy source, never from the cookie.
	const [dbUser] = await db
		.select({ role: user.role, astraId: user.astraId })
		.from(user)
		.where(eq(user.id, session.user.id))
		.limit(1);

	const enrichedSession = {
		...session,
		user: {
			...session.user,
			role: dbUser?.role ?? ROLES.USER,
			astraId: dbUser?.astraId ?? null,
		},
	};

	return {
		db,
		session: enrichedSession,
		...opts,
	};
};

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

// ─── 2. Init ──────────────────────────────────────────────────────────────────
const t = initTRPC.context<TRPCContext>().create({
	transformer: superjson,
	errorFormatter({ shape, error }) {
		return {
			...shape,
			data: {
				...shape.data,
				zodError:
					error.cause instanceof ZodError ? error.cause.flatten() : null,
			},
		};
	},
});

export const createCallerFactory = t.createCallerFactory;
export const createTRPCRouter = t.router;
export const mergeRouters = t.mergeRouters;

// ─── 3. Timing middleware ─────────────────────────────────────────────────────
const timingMiddleware = t.middleware(async ({ next, path }) => {
	const start = Date.now();

	if (t._config.isDev) {
		await new Promise((resolve) =>
			setTimeout(resolve, Math.floor(Math.random() * 200) + 50),
		);
	}

	const result = await next();
	console.log(`[tRPC] ${path} — ${Date.now() - start}ms`);
	return result;
});

// ─── 4. Auth middlewares ──────────────────────────────────────────────────────
const enforceAuth = t.middleware(({ ctx, next }) => {
	if (!ctx.session?.user) {
		throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
	}
	return next({
		ctx: { ...ctx, session: { ...ctx.session, user: ctx.session.user } },
	});
});

const enforceAdmin = t.middleware(({ ctx, next }) => {
	if (!ctx.session?.user) {
		throw new TRPCError({ code: "UNAUTHORIZED" });
	}
	// role is now always present — fetched from DB in createTRPCContext
	if (ctx.session.user.role !== ROLES.ADMIN) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Admin access required",
		});
	}
	return next({
		ctx: { ...ctx, session: { ...ctx.session, user: ctx.session.user } },
	});
});

const enforceSubscription = t.middleware(({ ctx, next }) => {
	if (!ctx.session?.user) {
		throw new TRPCError({ code: "UNAUTHORIZED" });
	}
	const role = ctx.session.user.role;
	if (role !== ROLES.SUBSCRIPTION && role !== ROLES.ADMIN) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "An active Astra subscription is required",
		});
	}
	return next({
		ctx: { ...ctx, session: { ...ctx.session, user: ctx.session.user } },
	});
});

// ─── 5. Exported procedures ───────────────────────────────────────────────────

/** Public — no auth required. */
export const publicProcedure = t.procedure.use(timingMiddleware);

/** Protected — any authenticated user. */
export const protectedProcedure = t.procedure
	.use(timingMiddleware)
	.use(enforceAuth);

/** Admin only — throws FORBIDDEN for non-admins. */
export const adminProcedure = t.procedure
	.use(timingMiddleware)
	.use(enforceAdmin);

/** Subscription (premium) only — throws FORBIDDEN for regular users. */
export const subscriptionProcedure = t.procedure
	.use(timingMiddleware)
	.use(enforceSubscription);
