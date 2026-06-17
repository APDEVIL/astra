"use client";

import { motion } from "framer-motion";

import {
	heroButtonsVariant,
	heroHeadlineVariant,
	heroSubtextVariant,
	heroTagVariant,
} from "@/lib/animations";

// ─── Achievements Hero ────────────────────────────────────────────────────────

interface AchievementsHeroProps {
	count: number;
}

export function AchievementsHero({ count }: AchievementsHeroProps) {
	return (
		<section className="relative overflow-hidden bg-[#050C07] pt-32 pb-0 md:pt-40">
			{/* Ambient glow */}
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-0"
				style={{
					background:
						"radial-gradient(ellipse 60% 50% at 50% 0%, rgba(29,185,123,0.10) 0%, transparent 70%)",
				}}
			/>

			{/* Bottom fade into grid */}
			<div
				aria-hidden="true"
				className="pointer-events-none absolute right-0 bottom-0 left-0 h-24"
				style={{
					background: "linear-gradient(to bottom, transparent, #050C07)",
				}}
			/>

			<div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center gap-5 px-4 text-center sm:px-6">
				{/* Pill tag */}
				<motion.div
					animate="visible"
					className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-1.5 font-medium text-[#1DB97B] text-sm"
					initial="hidden"
					variants={heroTagVariant}
				>
					<svg
						aria-hidden="true"
						className="h-3.5 w-3.5"
						fill="currentColor"
						viewBox="0 0 16 16"
					>
						<path d="M8 1l1.8 3.6L14 5.2l-3 2.9.7 4.1L8 10.3l-3.7 1.9.7-4.1-3-2.9 4.2-.6L8 1z" />
					</svg>
					{count > 0 ? `${count} Milestones` : "Our Milestones"}
				</motion.div>

				{/* Heading */}
				<motion.h1
					animate="visible"
					className="font-bold font-display text-4xl text-[#F2F2F0] leading-[1.08] tracking-tight sm:text-5xl md:text-6xl"
					initial="hidden"
					variants={heroHeadlineVariant}
				>
					What We've{" "}
					<span
						className="bg-clip-text text-transparent"
						style={{
							backgroundImage:
								"linear-gradient(135deg, #1DB97B 0%, #25E699 100%)",
						}}
					>
						Achieved
					</span>
				</motion.h1>

				{/* Subtext */}
				<motion.p
					animate="visible"
					className="max-w-xl text-[#A3B3A8] text-base leading-relaxed md:text-lg"
					initial="hidden"
					variants={heroSubtextVariant}
				>
					Every milestone here represents real learners, real results, and real
					impact — built through structured education and market mentorship.
				</motion.p>

				{/* Stats row */}
				<motion.div
					animate="visible"
					className="mt-2 flex flex-wrap items-center justify-center gap-6 border-white/[0.06] border-t pt-6"
					initial="hidden"
					variants={heroButtonsVariant}
				>
					{[
						{ label: "Published Achievements", value: count },
						{ label: "Years of Excellence", value: "8+" },
						{ label: "Student Success Stories", value: "500+" },
					].map((stat) => (
						<div
							className="flex flex-col items-center gap-0.5"
							key={stat.label}
						>
							<span className="font-bold font-display text-2xl text-[#F2F2F0]">
								{stat.value}
							</span>
							<span className="text-[#566B60] text-xs">{stat.label}</span>
						</div>
					))}
				</motion.div>
			</div>
		</section>
	);
}
