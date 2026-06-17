"use client";

import { animate, motion } from "framer-motion";
import { Award, BarChart2, Users, Video } from "lucide-react";
import { useEffect, useRef } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import { PLATFORM_STATS } from "@/lib/constants";
import { cn } from "@/lib/utils";

// ─── Icon Map ─────────────────────────────────────────────────────────────────

const ICON_MAP = {
	award: Award,
	"chart-bar": BarChart2,
	users: Users,
	video: Video,
} as const;

// ─── Trust Features ───────────────────────────────────────────────────────────

const TRUST_FEATURES = [
	{
		description:
			"Daily market sessions with active practitioners — not pre-recorded lectures from years ago.",
		icon: "⚡",
		title: "Live-First Learning",
	},
	{
		description:
			"Real-time simulated trading unlocked after Day 2 of your course — zero risk, full experience.",
		icon: "📊",
		title: "Paper Trading Practice",
	},
	{
		description:
			"Every trade and decision is tracked inside your personal Quest module with measurable outcomes.",
		icon: "🏆",
		title: "Certified Performance Tracking",
	},
] as const;

// ─── Animated Counter ─────────────────────────────────────────────────────────

function AnimatedCounter({
	duration = 2,
	shouldAnimate,
	suffix,
	value,
}: {
	duration?: number;
	shouldAnimate: boolean;
	suffix: string;
	value: number;
}) {
	const displayRef = useRef<HTMLSpanElement>(null);
	const hasAnimated = useRef(false);

	useEffect(() => {
		if (!shouldAnimate || hasAnimated.current) return;
		hasAnimated.current = true;

		const controls = animate(0, value, {
			duration,
			ease: [0.16, 1, 0.3, 1],
			onUpdate: (latest) => {
				if (displayRef.current) {
					displayRef.current.textContent =
						Math.round(latest).toLocaleString("en-IN");
				}
			},
		});

		return () => controls.stop();
	}, [shouldAnimate, value, duration]);

	return (
		<span>
			<span ref={displayRef}>0</span>
			{suffix}
		</span>
	);
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
	index,
	shouldAnimate,
	stat,
}: {
	index: number;
	shouldAnimate: boolean;
	stat: (typeof PLATFORM_STATS)[number];
}) {
	const Icon = ICON_MAP[stat.icon as keyof typeof ICON_MAP] ?? BarChart2;

	return (
		<motion.div
			className={cn(
				"group relative flex flex-col items-start gap-4 overflow-hidden rounded-2xl p-8",
				"border border-white/[0.06] bg-[#0A1510]",
				"transition-[border-color,box-shadow] duration-300",
				"hover:border-white/[0.12] hover:shadow-[0_8px_40px_rgba(0,0,0,0.4)]",
			)}
			initial={{ opacity: 0, y: 40 }}
			transition={{
				damping: 20,
				delay: index * 0.1,
				stiffness: 120,
				type: "spring",
			}}
			viewport={{ margin: "-40px", once: true }}
			whileInView={{ opacity: 1, y: 0 }}
		>
			{/* Hover glow */}
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
				style={{
					background:
						"radial-gradient(ellipse 60% 60% at 20% 80%, rgba(29,185,123,0.06) 0%, transparent 70%)",
				}}
			/>

			<div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#1DB97B]/20 bg-[#1DB97B]/10">
				<Icon className="text-[#1DB97B]" size={18} strokeWidth={1.8} />
			</div>

			<div className="font-bold font-display text-4xl text-[#F2F2F0] tabular-nums md:text-5xl">
				<AnimatedCounter
					shouldAnimate={shouldAnimate}
					suffix={stat.suffix}
					value={stat.value}
				/>
			</div>

			<p className="font-medium text-[#566B60] text-sm">{stat.label}</p>
		</motion.div>
	);
}

// ─── Stats Section ────────────────────────────────────────────────────────────

export function StatsSection() {
	const { ref, isVisible } = useScrollReveal({ threshold: 0.1 });

	return (
		<section
			aria-labelledby="stats-heading"
			className="relative overflow-hidden bg-[#050C07] py-24 md:py-32"
			ref={ref}
		>
			{/* Grid texture */}
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-0 opacity-[0.025]"
				style={{
					backgroundImage:
						"linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
					backgroundSize: "60px 60px",
				}}
			/>

			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				{/* Header */}
				<motion.div
					animate={isVisible ? "visible" : "hidden"}
					className="mb-16 flex flex-col items-start justify-between gap-6 md:mb-20 md:flex-row md:items-end"
					initial="hidden"
					variants={staggerContainer}
				>
					<div className="flex flex-col gap-4">
						<motion.div
							className="inline-flex w-fit items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-1.5 font-medium text-[#1DB97B] text-sm"
							variants={fadeInUp}
						>
							By the Numbers
						</motion.div>

						<motion.h2
							className="font-bold font-display text-4xl text-[#F2F2F0] leading-tight tracking-tight md:text-5xl"
							id="stats-heading"
							variants={fadeInUp}
						>
							Built for Results.
							<br />
							<span
								className="bg-clip-text text-transparent"
								style={{
									backgroundImage:
										"linear-gradient(135deg, #1DB97B 0%, #25E699 100%)",
								}}
							>
								Trusted Worldwide.
							</span>
						</motion.h2>
					</div>

					<motion.p
						className="max-w-xs text-[#566B60] text-base leading-relaxed md:text-right"
						variants={fadeInUp}
					>
						Numbers don't lie — here's what our learners have achieved through
						Astra.
					</motion.p>
				</motion.div>

				{/* Stats grid */}
				<div className="mb-16 grid grid-cols-2 gap-4 md:grid-cols-4">
					{PLATFORM_STATS.map((stat, i) => (
						<StatCard
							index={i}
							key={stat.label}
							shouldAnimate={isVisible}
							stat={stat}
						/>
					))}
				</div>

				{/* Trust features */}
				<div className="grid grid-cols-1 gap-5 md:grid-cols-3">
					{TRUST_FEATURES.map((feature, i) => (
						<motion.div
							className={cn(
								"flex gap-4 rounded-xl border p-6",
								"border-white/[0.06] bg-white/[0.02]",
								"transition-all duration-300 hover:border-white/[0.10] hover:bg-white/[0.04]",
							)}
							initial={{ opacity: 0, x: -20 }}
							key={feature.title}
							transition={{ delay: 0.2 + i * 0.12, duration: 0.5 }}
							viewport={{ once: true }}
							whileInView={{ opacity: 1, x: 0 }}
						>
							<span aria-hidden="true" className="mt-0.5 shrink-0 text-2xl">
								{feature.icon}
							</span>
							<div className="flex flex-col gap-1.5">
								<h3 className="font-semibold text-[#F2F2F0] text-base">
									{feature.title}
								</h3>
								<p className="text-[#566B60] text-sm leading-relaxed">
									{feature.description}
								</p>
							</div>
						</motion.div>
					))}
				</div>
			</div>
		</section>
	);
}
