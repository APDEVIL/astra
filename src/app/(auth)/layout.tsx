// ─── Auth Layout ──────────────────────────────────────────────────────────────
// Routes inside (auth)/ get NO Navbar or Footer.
// AuthShell component handles its own two-column branding layout.

export default function AuthLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <>{children}</>;
}
