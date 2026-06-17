import type { Metadata, Viewport } from "next";
import { Inter, Syne } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { APP_META } from "@/lib/constants";
import { Providers } from "./provider";
import "@/styles/globals.css";
import "@/styles/animations.css";

// ─── Fonts ────────────────────────────────────────────────────────────────────

const inter = Inter({
	display: "swap",
	subsets: ["latin"],
	variable: "--font-inter",
});

const syne = Syne({
	display: "swap",
	subsets: ["latin"],
	variable: "--font-syne",
	weight: ["400", "500", "600", "700", "800"],
});

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
	description: APP_META.description,
	icons: {
		apple: "/apple-touch-icon.png",
		icon: "/favicon.ico",
		shortcut: "/favicon-16x16.png",
	},
	metadataBase: new URL(APP_META.url),
	openGraph: {
		description: APP_META.description,
		images: [
			{ alt: APP_META.name, height: 630, url: APP_META.ogImage, width: 1200 },
		],
		locale: "en_IN",
		siteName: APP_META.name,
		title: APP_META.name,
		type: "website",
		url: APP_META.url,
	},
	robots: { follow: true, index: true },
	title: {
		default: APP_META.name,
		template: `%s — ${APP_META.name}`,
	},
	twitter: {
		card: "summary_large_image",
		creator: APP_META.twitterHandle,
		description: APP_META.description,
		images: [APP_META.ogImage],
		title: APP_META.name,
	},
};

export const viewport: Viewport = {
	initialScale: 1,
	themeColor: "#050C07",
	width: "device-width",
};

// ─── Root Layout ──────────────────────────────────────────────────────────────
// Navbar and Footer are NOT here — they live in (public)/layout.tsx.
// Auth pages get a clean full-screen layout via (auth)/layout.tsx.

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html
			className={`${inter.variable} ${syne.variable}`}
			lang="en"
			suppressHydrationWarning
		>
			<body className="min-h-dvh overflow-x-hidden bg-bg-base font-sans text-text-primary antialiased selection:bg-primary/30 selection:text-text-primary">
				<Providers>{children}</Providers>

				<Toaster
					position="bottom-right"
					theme="dark"
					toastOptions={{
						style: {
							background: "#0A1510",
							border: "1px solid rgba(255,255,255,0.08)",
							color: "#F2F2F0",
						},
					}}
				/>
			</body>
		</html>
	);
}
