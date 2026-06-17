"use client";

import Image from "next/image";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";

import { fadeInUp } from "@/lib/animations";
import { cn } from "@/lib/utils";
import type { RouterOutputs } from "@/trpc/react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Achievement = RouterOutputs["content"]["getAchievements"][number];

interface MilestoneCardProps {
	achievement: Achievement;
	index: number;
}

// ─── Milestone Card ───────────────────────────────────────────────────────────

export function MilestoneCard({ achievement, index }: MilestoneCardProps) {
	const cardRef = useRef<HTMLDivElement>(null);

	// 3D tilt
	const rawX = useMotionValue(0);
	const rawY = useMotionValue(0);
	const springCfg = { damping: 22, mass: 0.8, stiffness: 200 };
	const rotateX = useSpring(
		useTransform(rawY, [-0.5, 0.5], [8, -8]),
		springCfg,
	);
	const rotateY = useSpring(
		useTransform(rawX, [-0.5, 0.5], [-8, 8]),
		springCfg,
	);
	const shineX = useSpring(
		useTransform(rawX, [-0.5, 0.5], ["-30%", "130%"]),
		springCfg,
	);
	const shineY = useSpring(
		useTransform(rawY, [-0.5, 0.5], ["-30%", "130%"]),
		springCfg,
	);

	const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
		const rect = cardRef.current?.getBoundingClientRect();
		if (!rect) return;
		rawX.set((e.clientX - rect.left) / rect.width - 0.5);
		rawY.set((e.clientY - rect.top) / rect.height - 0.5);
	};

	const handleMouseLeave = () => {
		rawX.set(0);
		rawY.set(0);
	};

	return (
		<motion.div
			style={{ perspective: 1000 }}
			transition={{
				damping: 20,
				delay: index * 0.08,
				stiffness: 120,
				type: "spring",
			}}
			variants={fadeInUp}
		>
			<motion.div
				ref={cardRef}
				className={cn(
					"group relative flex h-full flex-col overflow-hidden rounded-2xl",
					"border border-white/[0.08] bg-[#0A1510]",
					"cursor-default transition-[border-color] duration-300",
					"hover:border-[#1DB97B]/25",
				)}
				style={{
					boxShadow: "0 0 0 1px rgba(255,255,255,0.03)",
					rotateX,
					rotateY,
					transformStyle: "preserve-3d",
				}}
				whileHover={{
					boxShadow:
						"0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(29,185,123,0.15)",
				}}
				onMouseLeave={handleMouseLeave}
				onMouseMove={handleMouseMove}
			>
				{/* Shine overlay */}
				<motion.div
					aria-hidden="true"
					className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
					style={{
						background: `radial-gradient(circle at ${shineX} ${shineY}, rgba(255,255,255,0.05) 0%, transparent 60%)`,
					}}
				/>

				{/* Top accent bar */}
				<div
					aria-hidden="true"
					className="absolute top-0 right-0 left-0 h-[2px] bg-gradient-to-r from-transparent via-[#1DB97B] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
				/>

				{/* Cover image */}
				{achievement.imageUrl && (
					<div className="relative h-44 w-full shrink-0 overflow-hidden">
						<Image
							alt={achievement.title}
							className="object-cover transition-transform duration-500 group-hover:scale-105"
							fill
							sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
							src={achievement.imageUrl}
						/>
						<div
							aria-hidden="true"
							className="absolute inset-0"
							style={{
								background:
									"linear-gradient(to bottom, transparent 50%, #0A1510 100%)",
							}}
						/>
					</div>
				)}

				{/* Body */}
				<div className="relative z-10 flex flex-1 flex-col gap-4 p-6">
					{/* Icon + metric row */}
					<div className="flex items-start justify-between gap-4">
						{/* Icon */}
						{achievement.iconUrl && (
							<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#1DB97B]/20 bg-[#1DB97B]/10">
								<Image
									alt=""
									aria-hidden="true"
									className="object-contain"
									height={22}
									src={achievement.iconUrl}
									width={22}
								/>
							</div>
						)}

						{/* Metric badge */}
						{achievement.metric && (
							<div className="ml-auto flex flex-col items-end gap-0.5">
								<span className="font-bold font-display text-2xl text-[#1DB97B]">
									{achievement.metric}
								</span>
								{achievement.metricLabel && (
									<span className="text-[#566B60] text-xs">
										{achievement.metricLabel}
									</span>
								)}
							</div>
						)}
					</div>

					{/* Title */}
					<h3 className="font-bold font-display text-[#F2F2F0] text-lg leading-snug">
						{achievement.title}
					</h3>

					{/* Description */}
					<p className="flex-1 text-[#566B60] text-sm leading-relaxed">
						{achievement.description}
					</p>
				</div>
			</motion.div>
		</motion.div>
	);
}
