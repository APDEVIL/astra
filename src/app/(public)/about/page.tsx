import type { Metadata } from "next";

import { FacultyGrid } from "@/components/about/FacultyGrid";
import { HeroAbout } from "@/components/about/HeroAbout";
import { OwnerCard } from "@/components/about/OwnerCard";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { api } from "@/trpc/server";

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
	description:
		"Learn about Astra — our mission, our founder, and the team of practitioners behind the platform.",
	title: "About Us",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AboutPage() {
	const faculty = await api.content.getFaculty();

	// Owner is always first (sorted by isOwner DESC in router)
	const owner = faculty.find((f) => f.isOwner);
	const team = faculty.filter((f) => !f.isOwner);

	return (
		<PageWrapper noPadding pageKey="about">
			<HeroAbout />

			<div className="mx-auto max-w-7xl px-4 pt-16 pb-24 sm:px-6 lg:px-8">
				{/* Owner spotlight */}
				{owner && <OwnerCard owner={owner} />}

				{/* Divider */}
				{owner && team.length > 0 && (
					<div
						aria-hidden="true"
						className="mb-20 h-px w-full bg-gradient-to-r from-transparent via-white/[0.08] to-transparent"
					/>
				)}

				{/* Faculty team */}
				{team.length > 0 && <FacultyGrid faculty={team} />}
			</div>
		</PageWrapper>
	);
}
