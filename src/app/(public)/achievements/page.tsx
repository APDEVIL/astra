import type { Metadata } from "next";

import { AchievementsGrid } from "@/components/achievements/AchievementsGrid";
import { AchievementsHero } from "@/components/achievements/achievementshero";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { api } from "@/trpc/server";

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
	description:
		"Explore Astra's milestones, success stories, and the results our learners have achieved.",
	title: "Achievements",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AchievementsPage() {
	const achievements = await api.content.getAchievements();

	return (
		<PageWrapper noPadding pageKey="achievements">
			<AchievementsHero count={achievements.length} />

			<section
				aria-labelledby="achievements-list-heading"
				className="mx-auto max-w-7xl px-4 pt-16 pb-24 sm:px-6 lg:px-8"
			>
				<h2 className="sr-only" id="achievements-list-heading">
					All Achievements
				</h2>
				<AchievementsGrid items={achievements} />
			</section>
		</PageWrapper>
	);
}
