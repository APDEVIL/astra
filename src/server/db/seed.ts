// src/server/db/seed.ts

import { createId } from "@paralleldrive/cuid2";
import { db } from "@/server/db";
import { course, courseVideo, liveClass } from "@/server/db/schema";
import { user } from "@/server/db/schema/auth";

// ─── System seed user (created if not exists) ─────────────────────────────────
const SEED_USER_ID = "seed-system-user-astra";

async function ensureSeedUser() {
	await db
		.insert(user)
		.values({
			id: SEED_USER_ID,
			name: "Astra System",
			email: "system@astra.internal",
			emailVerified: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		})
		.onConflictDoNothing();
}

// ─── Courses ──────────────────────────────────────────────────────────────────
const courses = [
	{
		id: createId(),
		title: "Stock Market Fundamentals",
		slug: "stock-market-fundamentals",
		description:
			"A complete beginner-to-intermediate guide to understanding how stock markets work. Covers indices, order types, market participants, and reading financial statements.",
		shortDescription: "Master the basics of stock markets from scratch.",
		thumbnailUrl: "https://placehold.co/800x450?text=Stock+Market+Fundamentals",
		price: "0",
		durationDays: 30,
		assessmentUnlockDays: 2,
		status: "published" as const,
		createdBy: SEED_USER_ID,
	},
	{
		id: createId(),
		title: "Technical Analysis Masterclass",
		slug: "technical-analysis-masterclass",
		description:
			"Deep dive into chart patterns, candlestick analysis, support/resistance levels, RSI, MACD, Bollinger Bands, and multi-timeframe analysis. Includes real trade setups.",
		shortDescription:
			"Read charts like a pro — patterns, indicators, and setups.",
		thumbnailUrl: "https://placehold.co/800x450?text=Technical+Analysis",
		price: "1999.00",
		durationDays: 60,
		assessmentUnlockDays: 3,
		status: "published" as const,
		createdBy: SEED_USER_ID,
	},
	{
		id: createId(),
		title: "Options Trading — From Zero to Profitable",
		slug: "options-trading-zero-to-profitable",
		description:
			"Understand options Greeks, IV, premium decay, and popular strategies like straddles, iron condors, and covered calls. Includes paper trading exercises.",
		shortDescription: "Learn options strategies that actually work.",
		thumbnailUrl: "https://placehold.co/800x450?text=Options+Trading",
		price: "3499.00",
		durationDays: 45,
		assessmentUnlockDays: 5,
		status: "published" as const,
		createdBy: SEED_USER_ID,
	},
	{
		id: createId(),
		title: "Futures & Derivatives",
		slug: "futures-and-derivatives",
		description:
			"Comprehensive coverage of futures contracts, hedging strategies, margin requirements, rollover mechanics, and commodity vs equity futures trading.",
		shortDescription: "Trade futures confidently with proven strategies.",
		thumbnailUrl: "https://placehold.co/800x450?text=Futures+%26+Derivatives",
		price: "2999.00",
		durationDays: 45,
		assessmentUnlockDays: 4,
		status: "published" as const,
		createdBy: SEED_USER_ID,
	},
	{
		id: createId(),
		title: "Intraday Trading Strategies",
		slug: "intraday-trading-strategies",
		description:
			"Learn proven intraday setups including VWAP trading, opening range breakout, gap-and-go, and scalping. Covers risk management and journaling practices.",
		shortDescription: "Day trading strategies with real risk management.",
		thumbnailUrl: "https://placehold.co/800x450?text=Intraday+Trading",
		price: "1499.00",
		durationDays: 30,
		assessmentUnlockDays: 2,
		status: "published" as const,
		createdBy: SEED_USER_ID,
	},
	{
		id: createId(),
		title: "Mutual Funds & Long-Term Investing",
		slug: "mutual-funds-long-term-investing",
		description:
			"A practical guide to SIP investing, fund selection, expense ratios, direct vs regular plans, and building a diversified portfolio for long-term wealth creation.",
		shortDescription: "Build long-term wealth with mutual funds and SIPs.",
		thumbnailUrl: "https://placehold.co/800x450?text=Mutual+Funds",
		price: "0",
		durationDays: 21,
		assessmentUnlockDays: 2,
		status: "published" as const,
		createdBy: SEED_USER_ID,
	},
];

// ─── Videos per course ────────────────────────────────────────────────────────
function makeVideos(courseId: string, titles: string[]) {
	return titles.map((title, i) => ({
		id: createId(),
		courseId,
		title,
		description: `${title} — detailed walkthrough with examples.`,
		videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
		videoKey: `seed/video-${courseId}-${i + 1}`,
		duration: 600 + i * 120,
		sortOrder: i + 1,
		isPreview: i === 0,
	}));
}

const videosByCourse: Record<string, string[]> = {
	"stock-market-fundamentals": [
		"Introduction to Stock Markets",
		"How Exchanges & Brokers Work",
		"Reading a Stock Chart for the First Time",
		"Order Types — Market, Limit, SL",
		"Fundamental vs Technical Analysis Overview",
	],
	"technical-analysis-masterclass": [
		"Candlestick Patterns — Doji, Engulfing, Hammer",
		"Support, Resistance & Trendlines",
		"RSI & MACD Deep Dive",
		"Bollinger Bands & Volatility",
		"Building a Multi-Timeframe Setup",
	],
	"options-trading-zero-to-profitable": [
		"What Are Options? Calls & Puts Explained",
		"Options Greeks — Delta, Theta, Vega",
		"IV & Premium Decay Mechanics",
		"Straddle & Strangle Strategies",
		"Iron Condor & Covered Call Setups",
	],
	"futures-and-derivatives": [
		"Futures Contracts — Structure & Specs",
		"Margin, Mark-to-Market & Rollovers",
		"Hedging with Futures",
		"Commodity Futures vs Equity Futures",
		"Arbitrage Opportunities in Derivatives",
	],
	"intraday-trading-strategies": [
		"VWAP Trading Setup",
		"Opening Range Breakout (ORB)",
		"Gap-and-Go Strategy",
		"Scalping with Level 2 Data",
		"Trade Journaling & Risk Rules",
	],
	"mutual-funds-long-term-investing": [
		"SIP vs Lump Sum — Which Works Better?",
		"How to Pick the Right Fund",
		"Direct vs Regular Plans & Expense Ratios",
		"Portfolio Diversification Strategy",
		"Reviewing & Rebalancing Your Portfolio",
	],
};

// ─── Live classes per course ──────────────────────────────────────────────────
function makeLiveClasses(courseId: string, slug: string) {
	const base = new Date();
	return [
		{
			id: createId(),
			courseId,
			title: "Live Q&A — Week 1 Doubts",
			description:
				"Open session to clear doubts from the first week of the course.",
			joinUrl: `https://meet.google.com/seed-${slug}-1`,
			scheduledAt: new Date(base.getTime() + 7 * 24 * 60 * 60 * 1000),
			durationMinutes: 60,
			isCompleted: false,
			recordingUrl: null,
		},
		{
			id: createId(),
			courseId,
			title: "Live Paper Trading Session",
			description:
				"Real-time trade analysis and paper trading walkthrough with the instructor.",
			joinUrl: `https://meet.google.com/seed-${slug}-2`,
			scheduledAt: new Date(base.getTime() + 14 * 24 * 60 * 60 * 1000),
			durationMinutes: 90,
			isCompleted: false,
			recordingUrl: null,
		},
	];
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function seed() {
	console.log("🌱 Seeding database...\n");

	console.log("👤 Ensuring system seed user...");
	await ensureSeedUser();
	console.log("   ✅ System user ready\n");

	console.log("📚 Inserting courses...");
	await db.insert(course).values(courses).onConflictDoNothing();
	console.log(`   ✅ ${courses.length} courses inserted\n`);

	console.log("🎬 Inserting course videos...");
	for (const c of courses) {
		const titles = videosByCourse[c.slug] ?? [];
		const videos = makeVideos(c.id, titles);
		await db.insert(courseVideo).values(videos).onConflictDoNothing();
		console.log(`   ✅ ${videos.length} videos → "${c.title}"`);
	}

	console.log("\n📡 Inserting live classes...");
	for (const c of courses) {
		const lives = makeLiveClasses(c.id, c.slug);
		await db.insert(liveClass).values(lives).onConflictDoNothing();
		console.log(`   ✅ 2 live classes → "${c.title}"`);
	}

	console.log("\n✅ Seed complete!");
	process.exit(0);
}

seed().catch((err) => {
	console.error("❌ Seed failed:", err);
	process.exit(1);
});
