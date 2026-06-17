import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

// ─── Public Layout ────────────────────────────────────────────────────────────
// All routes inside (public)/ get Navbar + Footer.
// Auth routes are excluded — they use (auth)/layout.tsx instead.

export default function PublicLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<>
			<Navbar />
			{children}
			<Footer />
		</>
	);
}
