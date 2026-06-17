"use client";

import { motion } from "framer-motion";
import {
	ArrowRight,
	ChevronLeft,
	ChevronRight,
	Clock,
	Users,
} from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import { AUTH_LINKS } from "@/lib/constants";
import { cn, formatINR } from "@/lib/utils";

// ─── Sample Data ──────────────────────────────────────────────────────────────

const SAMPLE_COURSES = [
	{
		id: "1",
		level: "Intermediate",
		price: 12999,
		sector: "Finance",
		sectorAccent: "#1DB97B",
		students: 1240,
		tag: "Best Seller",
		tagColor: "#1DB97B",
		title: "Technical Analysis Masterclass",
		duration: "8 weeks",
	},
	{
		id: "2",
		level: "Advanced",
		price: 9999,
		sector: "Finance",
		sectorAccent: "#1DB97B",
		students: 890,
		tag: "Live",
		tagColor: "#E05050",
		title: "F&O Trading Strategies",
		duration: "6 weeks",
	},
	{
		id: "3",
		level: "Beginner",
		price: 8499,
		sector: "Real Estate",
		sectorAccent: "#F59E0B",
		students: 620,
		tag: "New",
		tagColor: "#6366F1",
		title: "Real Estate Investment Blueprint",
		duration: "5 weeks",
	},
	{
		id: "4",
		level: "Intermediate",
		price: 7499,
		sector: "Real Estate",
		sectorAccent: "#F59E0B",
		students: 430,
		tag: null,
		tagColor: null,
		title: "REIT & Property Portfolio",
		duration: "4 weeks",
	},
	{
		id: "5",
		level: "Beginner",
		price: 10999,
		sector: "Import & Export",
		sectorAccent: "#6366F1",
		students: 310,
		tag: "Popular",
		tagColor: "#6366F1",
		title: "Import-Export Business Setup",
		duration: "6 weeks",
	},
	{
		id: "6",
		level: "Intermediate",
		price: 8999,
		sector: "Import & Export",
		sectorAccent: "#6366F1",
		students: 255,
		tag: null,
		tagColor: null,
		title: "Forex & Cross-Border Trade",
		duration: "5 weeks",
	},
] as const;

// ─── Course Card ──────────────────────────────────────────────────────────────

function CourseCard({ course }: { course: (typeof SAMPLE_COURSES)[number] }) {
	return (
		<motion.div
			className={cn(
				"group relative w-[300px] shrink-0 overflow-hidden rounded-2xl",
				"border border-white/[0.07] bg-[#0A1510]",
				"cursor-pointer transition-[border-color] duration-300 hover:border-white/[0.14]",
				"hover:shadow-[0_16px_60px_rgba(0,0,0,0.5)]",
			)}
			transition={{ damping: 22, stiffness: 250, type: "spring" }}
			whileHover={{ scale: 1.015, y: -6 }}
		>
			{/* Accent bar */}
			<div
				aria-hidden="true"
				className="h-[3px] w-full"
				style={{ backgroundColor: course.sectorAccent }}
			/>

			<div className="flex flex-col gap-4 p-6">
				{/* Header */}
				<div className="flex items-start justify-between gap-3">
					<span
						className="font-semibold text-xs uppercase tracking-widest"
						style={{ color: course.sectorAccent }}
					>
						{course.sector}
					</span>
					{course.tag && (
						<span
							className="rounded-full border px-2.5 py-0.5 font-medium text-xs"
							style={{
								backgroundColor: `${course.tagColor}10`,
								borderColor: `${course.tagColor}50`,
								color: course.tagColor ?? "#F2F2F0",
							}}
						>
							{course.tag}
						</span>
					)}
				</div>

				{/* Title */}
				<h3 className="font-bold text-[#F2F2F0] text-lg leading-snug transition-colors group-hover:text-white">
					{course.title}
				</h3>

				{/* Meta */}
				<div className="flex items-center gap-4 text-[#566B60] text-xs">
					<span className="flex items-center gap-1.5">
						<Clock size={12} strokeWidth={1.8} />
						{course.duration}
					</span>
					<span className="flex items-center gap-1.5">
						<Users size={12} strokeWidth={1.8} />
						{course.students.toLocaleString("en-IN")} enrolled
					</span>
				</div>

				{/* Level */}
				<span className="w-fit rounded-lg border border-white/[0.06] bg-white/[0.04] px-2.5 py-1 text-[#A3B3A8] text-xs">
					{course.level}
				</span>

				{/* Price + CTA */}
				<div className="mt-1 flex items-center justify-between">
					<span className="font-bold font-display text-[#F2F2F0] text-xl">
						{formatINR(course.price)}
					</span>
					<Link
						className="flex items-center gap-1 rounded-xl border px-4 py-2 font-semibold text-sm transition-all duration-200"
						href={AUTH_LINKS.register}
						style={{
							backgroundColor: `${course.sectorAccent}18`,
							borderColor: `${course.sectorAccent}30`,
							color: course.sectorAccent,
						}}
					>
						Enroll
						<ArrowRight size={13} strokeWidth={2} />
					</Link>
				</div>
			</div>
		</motion.div>
	);
}

// ─── Courses Preview Section ──────────────────────────────────────────────────

export function CoursesPreview() {
	const scrollRef = useRef<HTMLDivElement>(null);
	const { ref, isVisible } = useScrollReveal({ threshold: 0.1 });

	const scrollBy = (dir: "left" | "right") => {
		scrollRef.current?.scrollBy({
			behavior: "smooth",
			left: dir === "right" ? 320 : -320,
		});
	};

	return (
		<section
			aria-labelledby="courses-heading"
			className="relative overflow-hidden bg-[#050C07] py-24 md:py-32"
			ref={ref}
		>
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				{/* Header */}
				<motion.div
					animate={isVisible ? "visible" : "hidden"}
					className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end"
					initial="hidden"
					variants={staggerContainer}
				>
					<div className="flex flex-col gap-4">
						<motion.div
							className="inline-flex w-fit items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-1.5 font-medium text-[#1DB97B] text-sm"
							variants={fadeInUp}
						>
							Capitro Courses
						</motion.div>

						<motion.h2
							className="font-bold font-display text-4xl text-[#F2F2F0] leading-tight tracking-tight md:text-5xl"
							id="courses-heading"
							variants={fadeInUp}
						>
							Learn from the{" "}
							<span
								className="bg-clip-text text-transparent"
								style={{
									backgroundImage:
										"linear-gradient(135deg, #1DB97B 0%, #25E699 100%)",
								}}
							>
								best programs
							</span>
						</motion.h2>
					</div>

					{/* Controls */}
					<motion.div className="flex items-center gap-3" variants={fadeInUp}>
						<button
							aria-label="Scroll left"
							className={cn(
								"flex h-10 w-10 items-center justify-center rounded-full",
								"border border-white/[0.08] bg-white/[0.05]",
								"text-[#A3B3A8] transition-all duration-200",
								"hover:border-white/[0.16] hover:bg-white/[0.10] hover:text-[#F2F2F0]",
							)}
							onClick={() => scrollBy("left")}
							type="button"
						>
							<ChevronLeft size={18} />
						</button>
						<button
							aria-label="Scroll right"
							className={cn(
								"flex h-10 w-10 items-center justify-center rounded-full",
								"border border-white/[0.08] bg-white/[0.05]",
								"text-[#A3B3A8] transition-all duration-200",
								"hover:border-white/[0.16] hover:bg-white/[0.10] hover:text-[#F2F2F0]",
							)}
							onClick={() => scrollBy("right")}
							type="button"
						>
							<ChevronRight size={18} />
						</button>
						<Link
							className="ml-2 hidden items-center gap-2 font-medium text-[#1DB97B] text-sm underline-offset-2 hover:underline md:flex"
							href="/courses"
						>
							View all
							<ArrowRight size={14} />
						</Link>
					</motion.div>
				</motion.div>

				{/* Carousel */}
				<div className="relative">
					<div
						aria-hidden="true"
						className="pointer-events-none absolute top-0 bottom-0 left-0 z-10 w-12"
						style={{
							background: "linear-gradient(to right, #050C07, transparent)",
						}}
					/>
					<div
						aria-hidden="true"
						className="pointer-events-none absolute top-0 right-0 bottom-0 z-10 w-24"
						style={{
							background: "linear-gradient(to left, #050C07, transparent)",
						}}
					/>
					<div
						className="flex gap-5 overflow-x-auto scroll-smooth pb-4"
						ref={scrollRef}
						style={{ msOverflowStyle: "none", scrollbarWidth: "none" }}
					>
						{SAMPLE_COURSES.map((course) => (
							<CourseCard course={course} key={course.id} />
						))}
					</div>
				</div>

				{/* Mobile view all */}
				<div className="mt-8 text-center md:hidden">
					<Link
						className="inline-flex items-center gap-2 font-medium text-[#1DB97B] text-sm"
						href="/courses"
					>
						View all courses
						<ArrowRight size={14} />
					</Link>
				</div>
			</div>
		</section>
	);
}
