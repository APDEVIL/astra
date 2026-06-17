import { adminRouter } from "@/server/api/routers/admin.router";
import { assessmentRouter } from "@/server/api/routers/assessment.router";
import { authRouter } from "@/server/api/routers/auth.router";
import { contentRouter } from "@/server/api/routers/content.router";
import { courseRouter } from "@/server/api/routers/course.router";
import { eventRouter } from "@/server/api/routers/event.router";
import { notificationRouter } from "@/server/api/routers/notification.router";
import { paymentRouter } from "@/server/api/routers/payment.router";
import { subscriptionRouter } from "@/server/api/routers/subscription.router";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
	admin: adminRouter,
	assessment: assessmentRouter,
	auth: authRouter,
	content: contentRouter,
	course: courseRouter,
	event: eventRouter,
	notification: notificationRouter,
	payment: paymentRouter,
	subscription: subscriptionRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
