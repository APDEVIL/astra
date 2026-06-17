"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Building2, Ship, TrendingUp } from "lucide-react";
import { useRef } from "react";

import type { SECTORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

// ─── Icon Map ─────────────────────────────────────────────────────────────────

const ICON_MAP = {
	building: Building2,
	ship: Ship,
	"trending-up": TrendingUp,
} as const;

// ─── Background Patterns ──────────────────────────────────────────────────────

function SectorPattern({ accent, bgKey }: { accent: string; bgKey: string }) {
	if (bgKey === "finance") {
		return (
			<svg
				aria-hidden="true"
				className="absolute right-0 bottom-0 h-28 w-48 opacity-[0.12]"
				fill="none"
				viewBox="0 0 200 120"
			>
				{[
					{ h: 40, wick: [30, 80] as [number, number], x: 20, y: 50 },
					{ h: 55, wick: [20, 95] as [number, number], x: 45, y: 30 },
					{ h: 30, wick: [45, 100] as [number, number], x: 70, y: 60 },
					{ h: 60, wick: [15, 95] as [number, number], x: 95, y: 25 },
					{ h: 35, wick: [40, 95] as [number, number], x: 120, y: 50 },
					{ h: 70, wick: [10, 100] as [number, number], x: 145, y: 20 },
					{ h: 45, wick: [28, 92] as [number, number], x: 170, y: 40 },
				].map((c, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: static decorative list
					<g key={i}>
						<rect
							fill={accent}
							height={c.h}
							rx={2}
							width={18}
							x={c.x}
							y={c.y}
						/>
						<line
							stroke={accent}
							strokeWidth={1.5}
							x1={c.x + 9}
							x2={c.x + 9}
							y1={c.wick[0]}
							y2={c.wick[1]}
						/>
					</g>
				))}
			</svg>
		);
	}

	if (bgKey === "realestate") {
		return (
			<svg
				aria-hidden="true"
				className="absolute right-0 bottom-0 h-32 w-48 opacity-[0.10]"
				fill={accent}
				viewBox="0 0 200 140"
			>
				<rect height="100" rx="2" width="60" x="70" y="40" />
				<rect height="70" rx="2" width="45" x="20" y="70" />
				<rect height="80" rx="2" width="45" x="135" y="60" />
				{[80, 90, 100, 110].map((y) =>
					[75, 90, 105, 120].map((x) => (
						<rect
							key={`${x}-${y}`}
							fill="#050C07"
							height={8}
							opacity={0.5}
							rx={1}
							width={8}
							x={x}
							y={y}
						/>
					)),
				)}
			</svg>
		);
	}

	return (
		<svg
			aria-hidden="true"
			className="absolute right-0 bottom-0 h-44 w-44 opacity-[0.10]"
			fill="none"
			stroke={accent}
			strokeWidth={1}
			viewBox="0 0 200 200"
		>
			<circle cx="100" cy="100" r="70" />
			<ellipse cx="100" cy="100" rx="35" ry="70" />
			<line x1="30" x2="170" y1="100" y2="100" />
			<line x1="100" x2="100" y1="30" y2="170" />
			<ellipse cx="100" cy="100" rx="70" ry="28" />
		</svg>
	);
}

// ─── Sector Card ──────────────────────────────────────────────────────────────

type Sector = (typeof SECTORS)[number];

interface SectorCardProps {
	index: number;
	sector: Sector;
}

export function SectorCard({ index, sector }: SectorCardProps) {
	const cardRef = useRef<HTMLDivElement>(null);

	const rawX = useMotionValue(0);
	const rawY = useMotionValue(0);

	const springConfig = { damping: 22, mass: 0.8, stiffness: 200 };
	const rotateX = useSpring(
		useTransform(rawY, [-0.5, 0.5], [10, -10]),
		springConfig,
	);
	const rotateY = useSpring(
		useTransform(rawX, [-0.5, 0.5], [-10, 10]),
		springConfig,
	);
	const shineX = useSpring(
		useTransform(rawX, [-0.5, 0.5], ["-30%", "130%"]),
		springConfig,
	);
	const shineY = useSpring(
		useTransform(rawY, [-0.5, 0.5], ["-30%", "130%"]),
		springConfig,
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

	const Icon = ICON_MAP[sector.icon as keyof typeof ICON_MAP] ?? TrendingUp;

	return (
		<motion.div
			initial={{ opacity: 0, y: 50 }}
			style={{ perspective: 1000 }}
			transition={{
				damping: 20,
				delay: index * 0.12,
				stiffness: 120,
				type: "spring",
			}}
			viewport={{ margin: "-60px", once: true }}
			whileInView={{ opacity: 1, y: 0 }}
		>
			<motion.div
				ref={cardRef}
				className={cn(
					"group relative h-full min-h-[320px] cursor-pointer overflow-hidden rounded-2xl",
					"border border-white/[0.08] bg-[#0A1510] p-8",
					"transition-[border-color] duration-300 hover:border-white/[0.16]",
				)}
				style={{
					boxShadow: "0 0 0 1px rgba(255,255,255,0.04)",
					rotateX,
					rotateY,
					transformStyle: "preserve-3d",
				}}
				whileHover={{
					boxShadow: `0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px ${sector.accent}28`,
				}}
				onMouseLeave={handleMouseLeave}
				onMouseMove={handleMouseMove}
			>
				{/* Shine */}
				<motion.div
					aria-hidden="true"
					className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
					style={{
						background: `radial-gradient(circle at ${shineX} ${shineY}, rgba(255,255,255,0.06) 0%, transparent 60%)`,
					}}
				/>

				{/* BG pattern */}
				<SectorPattern accent={sector.accent} bgKey={sector.bgKey} />

				{/* Top accent line */}
				<div
					aria-hidden="true"
					className="absolute top-0 right-0 left-0 h-[2px] rounded-t-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
					style={{
						background: `linear-gradient(90deg, transparent 0%, ${sector.accent} 50%, transparent 100%)`,
					}}
				/>

				{/* Content */}
				<div className="relative z-10 flex h-full flex-col gap-5">
					{/* Icon */}
					<motion.div
						className="flex h-12 w-12 items-center justify-center rounded-xl"
						style={{
							backgroundColor: `${sector.accent}18`,
							border: `1px solid ${sector.accent}30`,
						}}
						transition={{ duration: 0.35 }}
						whileHover={{ rotate: [-2, 2, 0], scale: 1.1 }}
					>
						<Icon
							size={22}
							strokeWidth={1.8}
							style={{ color: sector.accent }}
						/>
					</motion.div>

					{/* Label + tagline */}
					<div className="flex flex-col gap-1.5">
						<span
							className="font-semibold text-xs uppercase tracking-widest"
							style={{ color: sector.accent }}
						>
							{sector.label}
						</span>
						<h3 className="font-bold font-display text-2xl text-[#F2F2F0] leading-tight">
							{sector.tagline}
						</h3>
					</div>

					{/* Description */}
					<p className="flex-1 text-[#566B60] text-sm leading-relaxed">
						{sector.description}
					</p>

					{/* CTA */}
					<div className="mt-auto flex items-center gap-2">
						<span
							className="font-medium text-sm underline-offset-2 transition-colors duration-200 group-hover:underline"
							style={{ color: sector.accent }}
						>
							Explore courses
						</span>
						<motion.svg
							animate={{ x: [0, 3, 0] }}
							aria-hidden="true"
							className="h-4 w-4"
							fill="none"
							style={{ color: sector.accent }}
							transition={{
								duration: 1.6,
								ease: "easeInOut",
								repeat: Infinity,
							}}
							viewBox="0 0 16 16"
						>
							<path
								d="M3 8h10M8 3l5 5-5 5"
								stroke="currentColor"
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="1.8"
							/>
						</motion.svg>
					</div>
				</div>
			</motion.div>
		</motion.div>
	);
}
