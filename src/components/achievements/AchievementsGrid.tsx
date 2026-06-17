"use client";

import { motion } from "framer-motion";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { staggerContainer } from "@/lib/animations";
import type { RouterOutputs } from "@/trpc/react";

import { MilestoneCard } from "./MilestoneCard";

// ─── Types ────────────────────────────────────────────────────────────────────

type Achievement = RouterOutputs["content"]["getAchievements"][number];

interface AchievementsGridProps {
	items: Achievement[];
}

// ─── Achievements Grid ────────────────────────────────────────────────────────

export function AchievementsGrid({ items }: AchievementsGridProps) {
	const { ref, isVisible } = useScrollReveal({ threshold: 0.05 });

	if (items.length === 0) {
		return (
			<div className="flex min-h-[300px] flex-col items-center justify-center gap-3">
				<span aria-hidden="true" className="text-4xl">
					🏆
				</span>
				<p className="text-[#566B60] text-sm">No achievements published yet.</p>
			</div>
		);
	}

	return (
		<motion.div
			animate={isVisible ? "visible" : "hidden"}
			className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
			initial="hidden"
			ref={ref}
			variants={staggerContainer}
		>
			{items.map((achievement, i) => (
				<MilestoneCard
					achievement={achievement}
					index={i}
					key={achievement.id}
				/>
			))}
		</motion.div>
	);
}
