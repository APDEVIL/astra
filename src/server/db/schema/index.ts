/**
 * Barrel export for all Drizzle schema tables, relations, enums, and types.
 * Always import from "@/server/db/schema" — never from individual files
 * to avoid circular dependency issues with the Drizzle relations graph.
 */

// Assessment — quest module + paper trading
export * from "./assessment";
// Auth — Better Auth managed tables + user role enum
export * from "./auth";
// Content — achievements, news, faculty profiles
export * from "./content";
// Course — courses, videos, live classes, enrollments
export * from "./course";
// Events & Workshops — events, workshops, participants, updates
export * from "./event";
// Notifications — in-app notification feed
export * from "./notification";
// Payments — Razorpay orders + transactions
export * from "./payment";
// Subscriptions — premium access + guidance sessions
export * from "./subscription";
