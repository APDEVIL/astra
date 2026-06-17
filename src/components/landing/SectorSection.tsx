"use client";

import { motion } from "framer-motion";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import { SECTORS } from "@/lib/constants";

import { SectorCard } from "./SectorCard";

// ─── Sector Section ───────────────────────────────────────────────────────────

export function SectorSection() {
	const { ref, isVisible } = useScrollReveal({ threshold: 0.1 });

	return (
		<section
			aria-labelledby="sectors-heading"
			className="relative overflow-hidden bg-[#050C07] py-24 md:py-32"
			ref={ref}
		>
			{/* Top rule */}
			<div
				aria-hidden="true"
				className="absolute top-0 right-0 left-0 h-px"
				style={{
					background:
						"linear-gradient(90deg, transparent 0%, rgba(29,185,123,0.2) 30%, rgba(29,185,123,0.2) 70%, transparent 100%)",
				}}
			/>

			{/* Ambient glow */}
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-0"
				style={{
					background:
						"radial-gradient(ellipse 80% 40% at 50% 0%, rgba(29,185,123,0.05) 0%, transparent 70%)",
				}}
			/>

			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				{/* Header */}
				<motion.div
					animate={isVisible ? "visible" : "hidden"}
					className="mb-16 flex flex-col items-center gap-4 text-center md:mb-20"
					initial="hidden"
					variants={staggerContainer}
				>
					<motion.div
						className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-1.5 font-medium text-[#1DB97B] text-sm"
						variants={fadeInUp}
					>
						<svg
							aria-hidden="true"
							className="h-3.5 w-3.5"
							fill="currentColor"
							viewBox="0 0 16 16"
						>
							<path d="M8 1l1.8 3.6L14 5.2l-3 2.9.7 4.1L8 10.3l-3.7 1.9.7-4.1-3-2.9 4.2-.6L8 1z" />
						</svg>
						What We Teach
					</motion.div>

					<motion.h2
						className="max-w-2xl font-bold font-display text-4xl text-[#F2F2F0] leading-tight tracking-tight md:text-5xl"
						id="sectors-heading"
						variants={fadeInUp}
					>
						Three Domains.{" "}
						<span
							className="bg-clip-text text-transparent"
							style={{
								backgroundImage:
									"linear-gradient(135deg, #1DB97B 0%, #25E699 100%)",
							}}
						>
							One Platform.
						</span>
					</motion.h2>

					<motion.p
						className="max-w-xl text-[#A3B3A8] text-lg leading-relaxed"
						variants={fadeInUp}
					>
						Structured learning for serious learners — from equity markets to
						real estate deals to cross-border trade.
					</motion.p>
				</motion.div>

				{/* Cards */}
				<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
					{SECTORS.map((sector, i) => (
						<SectorCard index={i} key={sector.id} sector={sector} />
					))}
				</div>

				{/* Footer note */}
				<motion.div
					className="mt-14 text-center"
					initial={{ opacity: 0, y: 20 }}
					transition={{ delay: 0.5, duration: 0.5 }}
					viewport={{ once: true }}
					whileInView={{ opacity: 1, y: 0 }}
				>
					<p className="text-[#566B60] text-sm">
						All programs include live sessions, recorded content, and
						performance tracking.
					</p>
				</motion.div>
			</div>
		</section>
	);
}
