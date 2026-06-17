import { redirect } from "next/navigation";

// ─── Root Redirect ────────────────────────────────────────────────────────────
// "/" → "/home" (landing page lives at (public)/home/page.tsx)
// Using redirect() keeps this as a server component with no client bundle cost.

export default function RootPage() {
	redirect("/home");
}
