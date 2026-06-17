"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

import { fadeInLeft, fadeInRight } from "@/lib/animations";

// ─── Auth Shell ───────────────────────────────────────────────────────────────
// Shared two-column layout for login and register pages.

interface AuthShellProps {
	children: React.ReactNode;
	heading: string;
	subheading: string;
}

const TRUST_POINTS = [
	{ icon: "📈", text: "Live market sessions every trading day" },
	{ icon: "🎯", text: "Paper trading from Day 2 of your course" },
	{ icon: "🏆", text: "5,000+ learners already on the platform" },
	{ icon: "🔒", text: "Secure — powered by Better Auth" },
] as const;

export function AuthShell({ children, heading, subheading }: AuthShellProps) {
	return (
		<div className="flex min-h-screen bg-[#050C07]">
			{/* Left panel — branding (hidden on mobile) */}
			<motion.aside
				animate="visible"
				className="relative hidden w-[480px] shrink-0 flex-col justify-between overflow-hidden border-white/[0.06] border-r p-10 lg:flex"
				initial="hidden"
				variants={fadeInLeft}
			>
				{/* Background glow */}
				<div
					aria-hidden="true"
					className="pointer-events-none absolute inset-0"
					style={{
						background:
							"radial-gradient(ellipse 80% 60% at 20% 50%, rgba(29,185,123,0.08) 0%, transparent 70%)",
					}}
				/>

				{/* Grid texture */}
				<div
					aria-hidden="true"
					className="pointer-events-none absolute inset-0 opacity-[0.025]"
					style={{
						backgroundImage:
							"linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
						backgroundSize: "48px 48px",
					}}
				/>

				{/* Logo */}
				<Link
					className="group relative z-10 flex items-center gap-2.5"
					href="/"
				>
					<div className="relative h-8 w-8">
						<Image
							alt="Astra"
							className="object-contain"
							fill
							src="/logo.png"
						/>
					</div>
					<span className="font-semibold text-[#F2F2F0] text-lg tracking-tight">
						Astra
					</span>
				</Link>

				{/* Centre content */}
				<div className="relative z-10 flex flex-col gap-8">
					<div className="flex flex-col gap-3">
						<span className="font-semibold text-[#1DB97B] text-sm uppercase tracking-widest">
							Why Astra?
						</span>
						<p className="font-bold font-display text-3xl text-[#F2F2F0] leading-tight">
							Learn from practitioners,
							<br />
							not just professors.
						</p>
					</div>

					<ul className="flex flex-col gap-4">
						{TRUST_POINTS.map((point) => (
							<li className="flex items-start gap-3" key={point.text}>
								<span aria-hidden="true" className="mt-0.5 text-lg">
									{point.icon}
								</span>
								<span className="text-[#A3B3A8] text-sm leading-relaxed">
									{point.text}
								</span>
							</li>
						))}
					</ul>
				</div>

				{/* Footer quote */}
				<p className="relative z-10 text-[#566B60] text-xs">
					"The market rewards the educated."
				</p>
			</motion.aside>

			{/* Right panel — form */}
			<motion.main
				animate="visible"
				className="flex flex-1 flex-col items-center justify-center px-4 py-16 sm:px-8"
				initial="hidden"
				variants={fadeInRight}
			>
				{/* Mobile logo */}
				<Link className="mb-8 flex items-center gap-2.5 lg:hidden" href="/">
					<div className="relative h-7 w-7">
						<Image
							alt="Astra"
							className="object-contain"
							fill
							src="/logo.png"
						/>
					</div>
					<span className="font-semibold text-[#F2F2F0] text-base tracking-tight">
						Astra
					</span>
				</Link>

				<div className="w-full max-w-[440px]">
					{/* Heading */}
					<div className="mb-8 flex flex-col gap-2">
						<h1 className="font-bold font-display text-2xl text-[#F2F2F0] sm:text-3xl">
							{heading}
						</h1>
						<p className="text-[#566B60] text-sm">{subheading}</p>
					</div>

					{/* Form slot */}
					{children}
				</div>
			</motion.main>
		</div>
	);
}
