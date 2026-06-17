import type { Metadata } from "next";

import { CTASection } from "@/components/landing/CTASection";
import { CoursesPreview } from "@/components/landing/CoursesPreview";
import { HeroSection } from "@/components/landing/HeroSection";
import { SectorSection } from "@/components/landing/SectorSection";
import { StatsSection } from "@/components/landing/StatsSection";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { APP_META } from "@/lib/constants";

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
	description: APP_META.description,
	title: {
		absolute: APP_META.name,
	},
};

// ─── Home Page ────────────────────────────────────────────────────────────────

export default function HomePage() {
	return (
		<PageWrapper noPadding pageKey="home">
			{/* 1 — Full viewport hero with Three.js candlestick background */}
			<HeroSection />

			{/* 2 — Finance / Real Estate / Import & Export sector cards */}
			<SectorSection />

			{/* 3 — Animated stats + trust feature cards */}
			<StatsSection />

			{/* 4 — Horizontal course carousel (Capitro preview) */}
			<CoursesPreview />

			{/* 5 — Final CTA with pulsing rings and social proof */}
			<CTASection />
		</PageWrapper>
	);
}
