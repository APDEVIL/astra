import { boolean, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

// ─── Role Enum ────────────────────────────────────────────────────────────────
// Stored on the user row. Drives adminProcedure and subscription-gated routes.
export const userRoleEnum = pgEnum("user_role", [
	"user",
	"subscription",
	"admin",
]);

// ─── User ─────────────────────────────────────────────────────────────────────
// Better Auth manages this table via its drizzle adapter.
// We extend it with `role`, `astraId`, and `emailVerified`.
export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").notNull().default(false),
	image: text("image"),
	phone: text("phone"),
	// Role-based access control
	role: userRoleEnum("role").notNull().default("user"),
	// Subscription users get a unique Astra ID for login
	astraId: text("astra_id").unique(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Session ──────────────────────────────────────────────────────────────────
// Managed by Better Auth. Do not mutate directly.
export const session = pgTable("session", {
	id: text("id").primaryKey(),
	expiresAt: timestamp("expires_at").notNull(),
	token: text("token").notNull().unique(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
});

// ─── Account ──────────────────────────────────────────────────────────────────
// OAuth provider links (Google, etc.). Managed by Better Auth.
export const account = pgTable("account", {
	id: text("id").primaryKey(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at"),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
	scope: text("scope"),
	password: text("password"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Verification ─────────────────────────────────────────────────────────────
// Email verification tokens. Managed by Better Auth.
export const verification = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── Types ────────────────────────────────────────────────────────────────────
export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type Session = typeof session.$inferSelect;
export type Account = typeof account.$inferSelect;
export type UserRole = (typeof userRoleEnum.enumValues)[number];
