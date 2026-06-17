"use client";

import { motion } from "framer-motion";

import {
	heroHeadlineVariant,
	heroSubtextVariant,
	heroTagVariant,
	staggerContainer,
} from "@/lib/animations";
import { PLATFORM_STATS } from "@/lib/constants";
import { formatStat } from "@/lib/utils";

// ─── About Hero ───────────────────────────────────────────────────────────────

export function HeroAbout() {
	return (
		<section className="relative overflow-hidden bg-[#050C07] pt-32 pb-16 md:pt-40">
			{/* Ambient glow */}
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-0"
				style={{
					background:
						"radial-gradient(ellipse 60% 50% at 50% 0%, rgba(29,185,123,0.09) 0%, transparent 70%)",
				}}
			/>

			<div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6">
				<motion.div
					animate="visible"
					className="flex flex-col items-center gap-5"
					initial="hidden"
					variants={staggerContainer}
				>
					{/* Pill */}
					<motion.div
						className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-1.5 font-medium text-[#1DB97B] text-sm"
						variants={heroTagVariant}
					>
						Our Story
					</motion.div>

					{/* Headline */}
					<motion.h1
						className="font-bold font-display text-4xl text-[#F2F2F0] leading-[1.08] tracking-tight sm:text-5xl md:text-6xl"
						variants={heroHeadlineVariant}
					>
						Built for{" "}
						<span
							className="bg-clip-text text-transparent"
							style={{
								backgroundImage:
									"linear-gradient(135deg, #1DB97B 0%, #25E699 100%)",
							}}
						>
							Serious Learners
						</span>
					</motion.h1>

					{/* Subtext */}
					<motion.p
						className="max-w-2xl text-[#A3B3A8] text-base leading-relaxed md:text-lg"
						variants={heroSubtextVariant}
					>
						Astra was founded on a simple belief — financial education in India
						needs to be practical, live, and outcome-driven. We cover Finance,
						Real Estate, and International Trade with practitioners who are
						active in their fields.
					</motion.p>

					{/* Stats strip */}
					<motion.div
						className="mt-4 flex w-full flex-wrap items-center justify-center gap-8 border-white/[0.06] border-t pt-8"
						variants={heroSubtextVariant}
					>
						{PLATFORM_STATS.map((stat) => (
							<div
								key={stat.label}
								className="flex flex-col items-center gap-0.5"
							>
								<span className="font-bold font-display text-2xl text-[#F2F2F0]">
									{formatStat(stat.value, stat.suffix)}
								</span>
								<span className="text-[#566B60] text-xs">{stat.label}</span>
							</div>
						))}
					</motion.div>
				</motion.div>
			</div>
		</section>
	);
}
