// ─── Navigation ───────────────────────────────────────────────────────────────

export const NAV_LINKS = [
	{ label: "Home", href: "/", disabled: false },
	{ label: "About", href: "/about", disabled: false },
	{ label: "Achievements", href: "/achievements", disabled: false },
	{ label: "Courses", href: "/courses", disabled: true }, // Phase 2
	{ label: "Events", href: "/events", disabled: true }, // Phase 2
] as const;

export const AUTH_LINKS = {
	login: "/login",
	register: "/register",
	dashboard: "/dashboard",
} as const;

// ─── Roles ────────────────────────────────────────────────────────────────────

/**
 * User access tiers, ordered low → high. AccessService.hasRole() relies on
 * this ordering (via indexOf) to do hierarchy checks, so don't reorder these
 * keys without checking that logic.
 */
export const ROLES = {
	USER: "user",
	SUBSCRIPTION: "subscription",
	ADMIN: "admin",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// ─── Sectors (Landing Page — 3 domain cards) ──────────────────────────────────

export const SECTORS = [
	{
		id: "finance",
		label: "Finance",
		tagline: "Master the Markets",
		description:
			"Learn equity trading, technical analysis, F&O strategies, and portfolio management from active practitioners.",
		icon: "trending-up",
		accent: "#1DB97B", // green accent
		bgKey: "finance",
	},
	{
		id: "real-estate",
		label: "Real Estate",
		tagline: "Invest in Bricks & Returns",
		description:
			"Understand property valuation, REIT investing, land acquisition cycles, and real-estate wealth building.",
		icon: "building",
		accent: "#F59E0B", // amber accent
		bgKey: "realestate",
	},
	{
		id: "import-export",
		label: "Import & Export",
		tagline: "Trade Without Borders",
		description:
			"Navigate global trade, customs regulations, Forex risk, and supply chain strategy for cross-border business.",
		icon: "ship",
		accent: "#6366F1", // indigo accent
		bgKey: "importexport",
	},
] as const;

export type SectorId = (typeof SECTORS)[number]["id"];

// ─── Stats / Trust Numbers ────────────────────────────────────────────────────

export const PLATFORM_STATS = [
	{ label: "Students Trained", value: 5000, suffix: "+", icon: "users" },
	{ label: "Live Sessions", value: 300, suffix: "+", icon: "video" },
	{ label: "Success Rate", value: 92, suffix: "%", icon: "chart-bar" },
	{ label: "Years of Experience", value: 8, suffix: "+", icon: "award" },
] as const;

// ─── Social Links ─────────────────────────────────────────────────────────────

export const SOCIAL_LINKS = [
	{ label: "YouTube", href: "https://youtube.com", icon: "brand-youtube" },
	{
		label: "Instagram",
		href: "https://instagram.com",
		icon: "brand-instagram",
	},
	{ label: "Telegram", href: "https://t.me", icon: "brand-telegram" },
	{ label: "WhatsApp", href: "https://wa.me", icon: "brand-whatsapp" },
] as const;

// ─── Design Tokens ────────────────────────────────────────────────────────────

/** Astra brand colors — keep in sync with tailwind.config.ts */
export const COLORS = {
	// Primary green accent
	primary: "#1DB97B",
	primaryDark: "#159A65",
	primaryLight: "#25E699",

	// Background shades (dark theme)
	bgBase: "#050C07", // deepest background
	bgSurface: "#0A1510", // card / section bg
	bgOverlay: "#0F1F15", // hover overlays

	// Text
	textPrimary: "#F2F2F0",
	textSecondary: "#A3B3A8",
	textMuted: "#566B60",

	// Border
	border: "rgba(255,255,255,0.08)",
	borderHover: "rgba(255,255,255,0.16)",

	// Sector accents
	finance: "#1DB97B",
	realEstate: "#F59E0B",
	importExport: "#6366F1",
} as const;

// ─── Three.js / 3D Scene Config ───────────────────────────────────────────────

export const THREE_CONFIG = {
	cameraZ: 5,
	particleCount: 3000,
	particleSize: 0.012,
	candlestickCount: 60,
	mouseInfluenceRadius: 1.5,
	mouseStrength: 0.25,
	rotationSpeed: 0.0008,
	floatAmplitude: 0.04,
	floatSpeed: 0.6,
} as const;

// ─── Scroll Config ────────────────────────────────────────────────────────────

export const SCROLL_CONFIG = {
	/** Intersection Observer threshold for scroll reveals */
	revealThreshold: 0.15,
	revealRootMargin: "0px 0px -60px 0px",
	/** Navbar background appears after this scroll offset (px) */
	navbarScrollOffset: 60,
} as const;

// ─── App Meta ─────────────────────────────────────────────────────────────────

export const APP_META = {
	name: "Astra",
	tagline: "Your Gateway to Financial Intelligence",
	description:
		"Astra is a professional learning platform for Finance, Real Estate, and Trade — built for serious learners.",
	url: process.env.NEXT_PUBLIC_APP_URL ?? "https://astra.in",
	ogImage: "/og-image.png",
	twitterHandle: "@astra_learn",
} as const;

// ─── IDs ──────────────────────────────────────────────────────────────────────

/**
 * Prefix for user-facing IDs (enrollment numbers, certificate numbers, etc).
 * Pairs with `generateId()` from utils, e.g. generateId(ASTRA_ID_PREFIX).
 */
export const ASTRA_ID_PREFIX = "AST";

// ─── Auth Config ──────────────────────────────────────────────────────────────

export const AUTH_CONFIG = {
	googleProvider: true,
	sessionExpiry: 7 * 24 * 60 * 60, // 7 days in seconds
	redirectAfterLogin: "/dashboard",
	redirectAfterLogout: "/",
} as const;

// ─── Course / Payment ─────────────────────────────────────────────────────────

export const PAYMENT_CONFIG = {
	currency: "INR",
	gateway: "razorpay",
	keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "",
} as const;

/** Minutes before an unpaid Razorpay order is treated as expired. */
export const RAZORPAY_ORDER_TTL_MINUTES = 30;

/**
 * Default course/subscription access window in days, applied at enrollment
 * unless a course specifies its own duration. Tune to match your actual
 * batch length or access policy.
 */
export const DEFAULT_SUBSCRIPTION_DAYS = 365;

// ─── Pagination ───────────────────────────────────────────────────────────────

/** Default page size for public-facing listings (courses, achievements, etc). */
export const DEFAULT_PAGE_SIZE = 12;

/** Default rows per page for admin dashboard tables (students, transactions, etc). */
export const ADMIN_PAGE_SIZE = 25;

/** Page size for notification lists/dropdowns (typically loaded in smaller batches). */
export const NOTIFICATIONS_PAGE_SIZE = 20;

// ─── Quest / Paper Trading ─────────────────────────────────────────────────────

/** Starting virtual capital (INR) for a new paper-trading quest. */
export const DEFAULT_PAPER_CAPITAL = 100_000;

// ─── Breakpoints (mirrors Tailwind defaults) ──────────────────────────────────

export const BREAKPOINTS = {
	sm: 640,
	md: 768,
	lg: 1024,
	xl: 1280,
	"2xl": 1536,
} as const;
