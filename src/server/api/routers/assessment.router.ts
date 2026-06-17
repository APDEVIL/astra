import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { DEFAULT_PAPER_CAPITAL } from "@/lib/constants";
import { Errors, trpcSafe } from "@/lib/errors";
import { paperTrade, quest } from "@/server/db/schema";
import { AccessService } from "@/server/services/access.service";
import { NotificationService } from "@/server/services/notification.service";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const assessmentRouter = createTRPCRouter({
	// ── Get quest status for a course ─────────────────────────────────────────
	// Returns access flags + quest record if it exists.
	// Frontend uses this to decide whether to show "Locked / Unlocks in X days"
	// or render the Quest dashboard.
	getStatus: protectedProcedure
		.input(z.object({ courseId: z.string() }))
		.query(async ({ ctx, input }) => {
			return trpcSafe(async () => {
				const access = await AccessService.getCourseAccess(
					ctx.session.user.id,
					input.courseId,
				);

				const existingQuest = access.canAccessAssessment
					? await AccessService.getQuestForEnrollment(access.enrollment.id)
					: null;

				return {
					canAccessAssessment: access.canAccessAssessment,
					assessmentUnlocksAt: access.assessmentUnlocksAt,
					daysRemaining: access.daysRemaining,
					quest: existingQuest,
				};
			});
		}),

	// ── Initialize quest (called once when user first opens Quest module) ─────
	initQuest: protectedProcedure
		.input(z.object({ courseId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			return trpcSafe(async () => {
				const { access, quest: existingQuest } =
					await AccessService.getAssessmentContext(
						ctx.session.user.id,
						input.courseId,
					);

				// Idempotent — return existing quest if already initialized
				if (existingQuest) return existingQuest;

				const [newQuest] = await ctx.db
					.insert(quest)
					.values({
						enrollmentId: access.enrollment.id,
						userId: ctx.session.user.id,
						courseId: input.courseId,
						initialCapital: String(DEFAULT_PAPER_CAPITAL),
						currentCapital: String(DEFAULT_PAPER_CAPITAL),
					})
					.returning();

				if (!newQuest) throw Errors.internal("Failed to initialize Quest");

				// Notify user
				await NotificationService.send({
					userId: ctx.session.user.id,
					type: "assessment_unlocked",
					title: "Paper trading is now unlocked! 📈",
					body: "Your Quest module is ready. Start paper trading to track your performance.",
					entityType: "course",
					entityId: input.courseId,
					ctaUrl: `/dashboard/courses/${input.courseId}/quest`,
					ctaLabel: "Open Quest",
				});

				return newQuest;
			});
		}),

	// ── Get full quest dashboard (metrics + trade history) ────────────────────
	getMetrics: protectedProcedure
		.input(z.object({ courseId: z.string() }))
		.query(async ({ ctx, input }) => {
			return trpcSafe(async () => {
				const { access, quest: q } = await AccessService.getAssessmentContext(
					ctx.session.user.id,
					input.courseId,
				);

				if (!q) {
					return {
						quest: null,
						trades: [],
						canAccessAssessment: access.canAccessAssessment,
						assessmentUnlocksAt: access.assessmentUnlocksAt,
					};
				}

				const trades = await ctx.db
					.select()
					.from(paperTrade)
					.where(eq(paperTrade.questId, q.id))
					.orderBy(paperTrade.enteredAt);

				return {
					quest: q,
					trades,
					canAccessAssessment: true,
					assessmentUnlocksAt: access.assessmentUnlocksAt,
				};
			});
		}),

	// ── Submit a new paper trade ──────────────────────────────────────────────
	submitTrade: protectedProcedure
		.input(
			z.object({
				courseId: z.string(),
				symbol: z.string().min(1).max(20).toUpperCase(),
				type: z.enum(["buy", "sell"]),
				quantity: z.number().int().positive(),
				entryPrice: z.number().positive(),
				notes: z.string().max(500).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return trpcSafe(async () => {
				const { quest: q } = await AccessService.getAssessmentContext(
					ctx.session.user.id,
					input.courseId,
				);

				if (!q) throw Errors.badRequest("Initialize your Quest first");

				const tradeValue = input.quantity * input.entryPrice;
				const currentCapital = parseFloat(q.currentCapital);

				if (input.type === "buy" && tradeValue > currentCapital) {
					throw Errors.badRequest(
						`Insufficient paper capital. Available: ₹${currentCapital.toFixed(2)}`,
					);
				}

				const [trade] = await ctx.db
					.insert(paperTrade)
					.values({
						questId: q.id,
						userId: ctx.session.user.id,
						symbol: input.symbol,
						type: input.type,
						quantity: input.quantity,
						entryPrice: String(input.entryPrice),
						notes: input.notes,
					})
					.returning();

				if (!trade) throw Errors.internal("Failed to submit trade");

				// Deduct capital for buys
				if (input.type === "buy") {
					await ctx.db
						.update(quest)
						.set({
							currentCapital: String(currentCapital - tradeValue),
							totalTrades: q.totalTrades + 1,
							updatedAt: new Date(),
						})
						.where(eq(quest.id, q.id));
				}

				return trade;
			});
		}),

	// ── Close / exit a trade ──────────────────────────────────────────────────
	closeTrade: protectedProcedure
		.input(
			z.object({
				courseId: z.string(),
				tradeId: z.string(),
				exitPrice: z.number().positive(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return trpcSafe(async () => {
				const { quest: q } = await AccessService.getAssessmentContext(
					ctx.session.user.id,
					input.courseId,
				);

				if (!q) throw Errors.badRequest("Quest not initialized");

				const [trade] = await ctx.db
					.select()
					.from(paperTrade)
					.where(
						and(
							eq(paperTrade.id, input.tradeId),
							eq(paperTrade.questId, q.id),
							eq(paperTrade.userId, ctx.session.user.id),
						),
					)
					.limit(1);

				if (!trade) throw Errors.notFound("Trade");
				if (trade.status !== "open")
					throw Errors.badRequest("This trade is already closed");

				// Calculate P&L
				const entryPrice = parseFloat(trade.entryPrice);
				const exitPrice = input.exitPrice;
				const qty = trade.quantity;

				const pnl =
					trade.type === "buy"
						? (exitPrice - entryPrice) * qty
						: (entryPrice - exitPrice) * qty;

				const isWin = pnl > 0;
				const currentCapital = parseFloat(q.currentCapital);
				const tradeValue = qty * exitPrice;

				// Update trade
				const [closed] = await ctx.db
					.update(paperTrade)
					.set({
						status: "closed",
						exitPrice: String(exitPrice),
						realisedPnl: String(pnl),
						exitedAt: new Date(),
						updatedAt: new Date(),
					})
					.where(eq(paperTrade.id, trade.id))
					.returning();

				// Update quest metrics
				const newCapital = currentCapital + tradeValue;
				const newPnl = parseFloat(q.totalPnl) + pnl;
				const newWins = isWin ? q.winningTrades + 1 : q.winningTrades;
				const newLosses = isWin ? q.losingTrades : q.losingTrades + 1;
				const totalClosed = newWins + newLosses;
				const winRate = totalClosed > 0 ? (newWins / totalClosed) * 100 : 0;

				// Compute grade
				const grade =
					winRate >= 70
						? "excellent"
						: winRate >= 55
							? "good"
							: winRate >= 40
								? "average"
								: "poor";

				await ctx.db
					.update(quest)
					.set({
						currentCapital: String(newCapital),
						totalPnl: String(newPnl),
						winningTrades: newWins,
						losingTrades: newLosses,
						winRate: String(winRate.toFixed(2)),
						grade,
						updatedAt: new Date(),
					})
					.where(eq(quest.id, q.id));

				return closed;
			});
		}),
});
