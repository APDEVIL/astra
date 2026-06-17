"use client";

import { motion } from "framer-motion";

import { staggerContainer } from "@/lib/animations";
import { useScrollReveal } from "@/hooks/useScrollReveal";
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
				<span className="text-4xl" aria-hidden="true">
					🏆
				</span>
				<p className="text-[#566B60] text-sm">No achievements published yet.</p>
			</div>
		);
	}

	return (
		<motion.div
			ref={ref}
			animate={isVisible ? "visible" : "hidden"}
			className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
			initial="hidden"
			variants={staggerContainer}
		>
			{items.map((achievement, i) => (
				<MilestoneCard
					key={achievement.id}
					achievement={achievement}
					index={i}
				/>
			))}
		</motion.div>
	);
}
