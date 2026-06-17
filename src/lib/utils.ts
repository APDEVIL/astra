import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// ─── Class Name Merger ────────────────────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// ─── Type Helpers ─────────────────────────────────────────────────────────────
export type WithClassName<T = Record<string, unknown>> = T & {
	className?: string;
};

// ─── Number Utilities ─────────────────────────────────────────────────────────

export function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

export function lerp(start: number, end: number, t: number): number {
	return start + (end - start) * t;
}

export function mapRange(
	value: number,
	inMin: number,
	inMax: number,
	outMin: number,
	outMax: number,
): number {
	return ((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;
}

export function round(value: number, decimals = 2): number {
	return Math.round(value * 10 ** decimals) / 10 ** decimals;
}

// ─── String Utilities ─────────────────────────────────────────────────────────

export function capitalize(str: string): string {
	if (!str) return "";
	return str.charAt(0).toUpperCase() + str.slice(1);
}

export function toTitleCase(str: string): string {
	return str.replace(
		/\w\S*/g,
		(word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
	);
}

export function truncate(str: string, maxLength: number): string {
	if (str.length <= maxLength) return str;
	return `${str.slice(0, maxLength - 3)}...`;
}

/**
 * Convert a title to a URL-safe slug.
 * @example slugify("Advanced F&O Trading!") → "advanced-fo-trading"
 */
export function slugify(text: string): string {
	return text
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, "")
		.replace(/[\s_-]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

export function slugToLabel(slug: string): string {
	return slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

export function generateId(prefix = "astra"): string {
	return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Currency & Number Formatting ─────────────────────────────────────────────

/**
 * Format a number as Indian Rupees, preserving paise precision.
 * @example formatCurrency(1999.5) → "₹1,999.50"
 */
export function formatCurrency(amount: number | string): string {
	const num = typeof amount === "string" ? parseFloat(amount) : amount;
	return new Intl.NumberFormat("en-IN", {
		style: "currency",
		currency: "INR",
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
	}).format(num);
}

/**
 * Format a number as Indian Rupees, rounded to whole rupees.
 * @example formatINR(1999.5) → "₹2,000"
 */
export function formatINR(amount: number): string {
	return new Intl.NumberFormat("en-IN", {
		style: "currency",
		currency: "INR",
		maximumFractionDigits: 0,
	}).format(amount);
}

export function formatCompactNumber(num: number): string {
	if (num >= 10_000_000) return `${(num / 10_000_000).toFixed(1)}Cr`;
	if (num >= 100_000) return `${(num / 100_000).toFixed(1)}L`;
	if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
	return num.toString();
}

export function formatStat(num: number, suffix = "+"): string {
	return new Intl.NumberFormat("en-IN").format(num) + suffix;
}

/**
 * Convert INR to paise for Razorpay.
 * @example inrToPaise(199.99) → 19999
 */
export function inrToPaise(inr: number | string): number {
	const num = typeof inr === "string" ? parseFloat(inr) : inr;
	return Math.round(num * 100);
}

/**
 * Convert paise back to INR for display.
 */
export function paiseToInr(paise: number): number {
	return paise / 100;
}

// ─── Date Utilities ───────────────────────────────────────────────────────────

/**
 * Add `days` to a base date (defaults to now).
 */
export function addDays(days: number, from: Date = new Date()): Date {
	const d = new Date(from);
	d.setDate(d.getDate() + days);
	return d;
}

/**
 * Add `hours` to a base date (defaults to now).
 */
export function addHours(hours: number, from: Date = new Date()): Date {
	return new Date(from.getTime() + hours * 60 * 60 * 1000);
}

/**
 * Returns true if the given date is in the past.
 */
export function isPast(date: Date | string): boolean {
	return new Date(date) < new Date();
}

/**
 * Alias of `isPast`, kept for expiry-flavored call sites (e.g. coupons, offers).
 */
export const isExpired = isPast;

/**
 * Returns true if the given date is within `days` days from now.
 */
export function isExpiringSoon(date: Date | string, days: number): boolean {
	const target = new Date(date);
	const threshold = addDays(days);
	return target > new Date() && target <= threshold;
}

export function isToday(date: Date | string): boolean {
	const d = new Date(date);
	const now = new Date();
	return (
		d.getDate() === now.getDate() &&
		d.getMonth() === now.getMonth() &&
		d.getFullYear() === now.getFullYear()
	);
}

/**
 * Human-readable relative time, past or future — e.g. "in 3 days", "2 hours ago".
 */
export function relativeTime(date: Date | string): string {
	const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
	const diffMs = new Date(date).getTime() - Date.now();
	const diffSecs = Math.round(diffMs / 1000);
	const diffMins = Math.round(diffSecs / 60);
	const diffHours = Math.round(diffMins / 60);
	const diffDays = Math.round(diffHours / 24);

	if (Math.abs(diffDays) >= 1) return rtf.format(diffDays, "day");
	if (Math.abs(diffHours) >= 1) return rtf.format(diffHours, "hour");
	if (Math.abs(diffMins) >= 1) return rtf.format(diffMins, "minute");
	return rtf.format(diffSecs, "second");
}

/**
 * Simple past-only "time ago" string — e.g. "2 hours ago", "just now".
 * Use `relativeTime` instead if you also need future-facing phrasing.
 */
export function timeAgo(date: Date | string): string {
	const now = new Date();
	const then = new Date(date);
	const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

	const intervals: [number, string][] = [
		[31536000, "year"],
		[2592000, "month"],
		[86400, "day"],
		[3600, "hour"],
		[60, "minute"],
	];

	for (const [secs, label] of intervals) {
		const count = Math.floor(seconds / secs);
		if (count >= 1) return `${count} ${label}${count > 1 ? "s" : ""} ago`;
	}

	return "just now";
}

/**
 * Format a date for display — e.g. "18 Apr 2026".
 */
export function formatDate(date: Date | string): string {
	return new Intl.DateTimeFormat("en-IN", {
		day: "numeric",
		month: "short",
		year: "numeric",
	}).format(new Date(date));
}

/**
 * Format a date with the full month name — e.g. "18 April 2026".
 */
export function formatDateLong(date: Date | string): string {
	return new Intl.DateTimeFormat("en-IN", {
		day: "numeric",
		month: "long",
		year: "numeric",
	}).format(new Date(date));
}

/**
 * Format a datetime — e.g. "18 Apr 2026, 6:30 PM".
 */
export function formatDateTime(date: Date | string): string {
	return new Intl.DateTimeFormat("en-IN", {
		day: "numeric",
		month: "short",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
	}).format(new Date(date));
}

// ─── Array Utilities ──────────────────────────────────────────────────────────

export function chunk<T>(arr: T[], size: number): T[][] {
	return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
		arr.slice(i * size, i * size + size),
	);
}

export function shuffle<T>(arr: T[]): T[] {
	const result = [...arr];
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		const temp = result[i];
		const swap = result[j];
		if (temp !== undefined && swap !== undefined) {
			result[i] = swap;
			result[j] = temp;
		}
	}
	return result;
}

export function unique<T>(arr: T[]): T[] {
	return [...new Set(arr)];
}

// ─── Object Utilities ─────────────────────────────────────────────────────────

/**
 * Pick selected keys from an object (type-safe).
 */
export function pick<T extends object, K extends keyof T>(
	obj: T,
	keys: K[],
): Pick<T, K> {
	return keys.reduce(
		(acc, key) => {
			if (key in obj) acc[key] = obj[key];
			return acc;
		},
		{} as Pick<T, K>,
	);
}

/**
 * Omit selected keys from an object (type-safe).
 */
export function omit<T extends object, K extends keyof T>(
	obj: T,
	keys: K[],
): Omit<T, K> {
	const result = { ...obj };
	for (const key of keys) delete result[key];
	return result as Omit<T, K>;
}

// ─── URL Utilities ────────────────────────────────────────────────────────────

export function buildQueryString(
	params: Record<string, string | number | boolean>,
): string {
	const search = new URLSearchParams();
	Object.entries(params).forEach(([key, value]) => {
		if (value !== undefined && value !== null && value !== "") {
			search.set(key, String(value));
		}
	});
	const str = search.toString();
	return str ? `?${str}` : "";
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginationInput {
	page?: number;
	pageSize?: number;
}

export interface PaginationMeta {
	page: number;
	pageSize: number;
	total: number;
	totalPages: number;
	hasNextPage: boolean;
	hasPrevPage: boolean;
}

/**
 * Compute Drizzle-compatible `limit` and `offset` from page/pageSize inputs.
 */
export function getPaginationParams(
	input: PaginationInput,
	defaultPageSize = 12,
): { limit: number; offset: number; page: number; pageSize: number } {
	const page = Math.max(1, input.page ?? 1);
	const pageSize = Math.min(100, input.pageSize ?? defaultPageSize);
	const offset = (page - 1) * pageSize;
	return { limit: pageSize, offset, page, pageSize };
}

/**
 * Build a pagination meta object to return alongside list results.
 */
export function buildPaginationMeta(
	total: number,
	page: number,
	pageSize: number,
): PaginationMeta {
	const totalPages = Math.ceil(total / pageSize);
	return {
		page,
		pageSize,
		total,
		totalPages,
		hasNextPage: page < totalPages,
		hasPrevPage: page > 1,
	};
}

// ─── Async Utilities ──────────────────────────────────────────────────────────

export function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export function debounce<T extends (...args: unknown[]) => unknown>(
	fn: T,
	delay: number,
): (...args: Parameters<T>) => void {
	let timer: ReturnType<typeof setTimeout>;
	return (...args: Parameters<T>) => {
		clearTimeout(timer);
		timer = setTimeout(() => fn(...args), delay);
	};
}

export function throttle<T extends (...args: unknown[]) => unknown>(
	fn: T,
	limit: number,
): (...args: Parameters<T>) => void {
	let lastCall = 0;
	return (...args: Parameters<T>) => {
		const now = Date.now();
		if (now - lastCall >= limit) {
			lastCall = now;
			fn(...args);
		}
	};
}

// ─── Validation Utilities ─────────────────────────────────────────────────────

export function isValidEmail(email: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPhone(phone: string): boolean {
	return /^[6-9]\d{9}$/.test(phone.replace(/\s|-/g, ""));
}

export function isEmpty(value: unknown): boolean {
	if (value === null || value === undefined) return true;
	if (typeof value === "string") return value.trim().length === 0;
	if (Array.isArray(value)) return value.length === 0;
	if (typeof value === "object") return Object.keys(value).length === 0;
	return false;
}

/**
 * Type-safe assertion — throws at runtime if condition is false.
 */
export function assert(condition: boolean, message: string): asserts condition {
	if (!condition) throw new Error(message);
}

// ─── Environment ──────────────────────────────────────────────────────────────

export const isBrowser = typeof window !== "undefined";
export const isServer = !isBrowser;
export const isDev = process.env.NODE_ENV === "development";
export const isProd = process.env.NODE_ENV === "production";
