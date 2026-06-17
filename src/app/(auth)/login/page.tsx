import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/authshel";
import { LoginForm } from "@/components/auth/LoginForm";

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
	description:
		"Sign in to your Astra account to access your courses and live sessions.",
	title: "Login",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LoginPage() {
	return (
		<AuthShell
			heading="Welcome back"
			subheading="Sign in to access your courses and live sessions."
		>
			<LoginForm />
		</AuthShell>
	);
}
