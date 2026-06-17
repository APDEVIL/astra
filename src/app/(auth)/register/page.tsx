import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/authshel";
import { RegisterForm } from "@/components/auth/RegisterForm";

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
	description:
		"Create your Astra account and start learning Finance, Real Estate, and Trade.",
	title: "Create Account",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RegisterPage() {
	return (
		<AuthShell
			heading="Create your account"
			subheading="Join 5,000+ learners mastering Finance, Real Estate, and Global Trade."
		>
			<RegisterForm />
		</AuthShell>
	);
}
