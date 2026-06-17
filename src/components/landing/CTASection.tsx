"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

import { fadeInUp, staggerContainer } from "@/lib/animations";
import { AUTH_LINKS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useScrollReveal } from "@/hooks/useScrollReveal";

// ─── CTA Section ──────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
	"#1DB97B",
	"#F59E0B",
	"#6366F1",
	"#E05050",
	"#A3B3A8",
] as const;
const AVATAR_LABELS = ["A", "R", "S", "T", "P"] as const;

export function CTASection() {
	const { ref, isVisible } = useScrollReveal({ threshold: 0.2 });
	const shouldReduceMotion = useReducedMotion();

	return (
		<section
			ref={ref}
			aria-labelledby="cta-heading"
			className="relative overflow-hidden bg-[#050C07] py-24 md:py-32"
		>
			{/* Ambient glow */}
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-0"
				style={{
					background:
						"radial-gradient(ellipse 70% 60% at 50% 50%, rgba(29,185,123,0.08) 0%, transparent 70%)",
				}}
			/>

			{/* Animated rings */}
			{!shouldReduceMotion &&
				[1, 2, 3].map((i) => (
					<motion.div
						key={i}
						animate={{ opacity: [0.06, 0.02, 0.06], scale: [1, 1.15, 1] }}
						aria-hidden="true"
						className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#1DB97B]/20"
						style={{
							height: `${200 + i * 180}px`,
							width: `${200 + i * 180}px`,
						}}
						transition={{
							delay: i * 0.8,
							duration: 4 + i,
							ease: "easeInOut",
							repeat: Infinity,
						}}
					/>
				))}

			<div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
				<motion.div
					animate={isVisible ? "visible" : "hidden"}
					className="flex flex-col items-center gap-8 text-center"
					initial="hidden"
					variants={staggerContainer}
				>
					{/* Eyebrow */}
					<motion.div
						className="inline-flex items-center gap-2 rounded-full border border-[#1DB97B]/20 bg-[#1DB97B]/10 px-4 py-1.5 font-medium text-[#1DB97B] text-sm"
						variants={fadeInUp}
					>
						<Sparkles aria-hidden="true" size={13} strokeWidth={2} />
						Start Your Journey
					</motion.div>

					{/* Headline */}
					<motion.h2
						className="font-bold font-display text-4xl text-[#F2F2F0] leading-[1.08] tracking-tight sm:text-5xl md:text-6xl"
						id="cta-heading"
						variants={fadeInUp}
					>
						Ready to Master the{" "}
						<span
							className="bg-clip-text text-transparent"
							style={{
								backgroundImage:
									"linear-gradient(135deg, #1DB97B 0%, #25E699 50%, #1DB97B 100%)",
							}}
						>
							Markets?
						</span>
					</motion.h2>

					{/* Subtext */}
					<motion.p
						className="max-w-xl text-[#A3B3A8] text-lg leading-relaxed md:text-xl"
						variants={fadeInUp}
					>
						Join thousands of learners building real wealth through structured
						education and live market guidance.
					</motion.p>

					{/* Buttons */}
					<motion.div
						className="flex flex-wrap items-center justify-center gap-4"
						variants={fadeInUp}
					>
						<Link
							className={cn(
								"inline-flex items-center gap-2.5 rounded-full px-8 py-4",
								"bg-[#1DB97B] font-bold text-[#050C07] text-base",
								"shadow-[0_0_40px_rgba(29,185,123,0.35)] transition-all duration-200",
								"hover:bg-[#25E699] hover:shadow-[0_0_60px_rgba(29,185,123,0.55)]",
								"active:scale-[0.97]",
							)}
							href={AUTH_LINKS.register}
						>
							Create Free Account
							<ArrowRight aria-hidden="true" size={18} strokeWidth={2.2} />
						</Link>

						<Link
							className={cn(
								"inline-flex items-center gap-2 rounded-full px-8 py-4",
								"border border-white/[0.12] font-medium text-[#A3B3A8] text-base",
								"transition-all duration-200",
								"hover:border-white/[0.24] hover:bg-white/[0.04] hover:text-[#F2F2F0]",
							)}
							href={AUTH_LINKS.login}
						>
							Sign In
						</Link>
					</motion.div>

					{/* Social proof */}
					<motion.div
						className="mt-2 flex items-center gap-3"
						variants={fadeInUp}
					>
						<div aria-hidden="true" className="flex -space-x-2">
							{AVATAR_COLORS.map((color, i) => (
								<div
									key={color}
									className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#050C07] font-bold text-white text-xs"
									style={{ backgroundColor: color, zIndex: 5 - i }}
								>
									{AVATAR_LABELS[i]}
								</div>
							))}
						</div>
						<p className="text-[#566B60] text-sm">
							<span className="font-semibold text-[#A3B3A8]">5,000+</span>{" "}
							learners already enrolled
						</p>
					</motion.div>
				</motion.div>
			</div>
		</section>
	);
}
