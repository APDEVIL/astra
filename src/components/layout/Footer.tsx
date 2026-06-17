"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import { APP_META, SOCIAL_LINKS } from "@/lib/constants";
import { cn } from "@/lib/utils";

// ─── Footer columns ───────────────────────────────────────────────────────────

const FOOTER_COLUMNS = [
	{
		heading: "Platform",
		links: [
			{ href: "/", label: "Home" },
			{ href: "/about", label: "About Us" },
			{ href: "/achievements", label: "Achievements" },
		],
	},
	{
		heading: "Learning",
		links: [
			{ href: "/courses?sector=finance", label: "Finance Courses" },
			{ href: "/courses?sector=real-estate", label: "Real Estate" },
			{ href: "/courses?sector=import-export", label: "Import & Export" },
		],
	},
	{
		heading: "Account",
		links: [
			{ href: "/login", label: "Login" },
			{ href: "/register", label: "Register" },
			{ href: "/dashboard", label: "Dashboard" },
		],
	},
	{
		heading: "Legal",
		links: [
			{ href: "/privacy", label: "Privacy Policy" },
			{ href: "/terms", label: "Terms of Service" },
			{ href: "/refund", label: "Refund Policy" },
		],
	},
] as const;

// ─── Social icon SVGs ─────────────────────────────────────────────────────────

const SOCIAL_PATHS: Record<string, React.ReactNode> = {
	"brand-instagram": (
		<path d="M8 2h8a6 6 0 0 1 6 6v8a6 6 0 0 1-6 6H8a6 6 0 0 1-6-6V8a6 6 0 0 1 6-6zm4 5a5 5 0 1 0 0 10A5 5 0 0 0 12 7zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm5-2a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
	),
	"brand-telegram": (
		<path d="M15 10L11 14l-4-2-4 1.5L12 3l10-2-7 9zM11 14l.5 3.5 2-2L11 14z" />
	),
	"brand-whatsapp": (
		<path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21zm9-17a7 7 0 1 0 0 14A7 7 0 0 0 12 4zm-3.5 5.5c.2.4.8 1.4 1.5 2.1.7.7 1.5 1.2 2 1.5l1-.5c.1-.05.3-.1.45 0l1.5.75c.1.05.2.15.2.3 0 1-.75 1.85-1.7 2.1-1.2.3-3.2-.2-5.2-2.2S5.45 9.25 5.75 8.05c.25-.95 1.1-1.7 2.1-1.7.15 0 .25.1.3.2l.75 1.5c.1.15.05.35 0 .45l-.5 1z" />
	),
	"brand-youtube": (
		<path d="M2.5 8s0-3.5.45-5.05A2.7 2.7 0 0 1 4.85 1.1C6.4.65 12 .65 12 .65s5.6 0 7.15.45a2.7 2.7 0 0 1 1.9 1.85C21.5 4.5 21.5 8 21.5 8s0 3.5-.45 5.05a2.7 2.7 0 0 1-1.9 1.85C17.6 15.35 12 15.35 12 15.35s-5.6 0-7.15-.45A2.7 2.7 0 0 1 2.95 13.05C2.5 11.5 2.5 8 2.5 8zm7.75 3.65L15.5 8l-5.25-3.65v7.3z" />
	),
};

function SocialIcon({ icon }: { icon: string }) {
	return (
		<svg
			aria-hidden="true"
			className="h-4 w-4"
			fill="currentColor"
			viewBox="0 0 24 24"
		>
			{SOCIAL_PATHS[icon] ?? null}
		</svg>
	);
}

// ─── Footer ───────────────────────────────────────────────────────────────────

export function Footer() {
	const { ref, isVisible } = useScrollReveal({ threshold: 0.05 });

	return (
		<footer
			className="relative border-white/[0.06] border-t bg-[#050C07]"
			ref={ref}
		>
			{/* Top glow line */}
			<div
				aria-hidden="true"
				className="absolute top-0 left-1/2 h-px w-64 -translate-x-1/2 bg-gradient-to-r from-transparent via-[#1DB97B]/40 to-transparent"
			/>

			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				{/* Main grid */}
				<motion.div
					animate={isVisible ? "visible" : "hidden"}
					className="grid grid-cols-2 gap-10 py-16 md:grid-cols-6"
					initial="hidden"
					variants={staggerContainer}
				>
					{/* Brand column */}
					<motion.div className="col-span-2" variants={fadeInUp}>
						<Link
							className="group mb-4 inline-flex items-center gap-2.5"
							href="/"
						>
							<div className="relative h-8 w-8 transition-transform duration-300 group-hover:scale-105">
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
						<p className="max-w-[220px] text-[#566B60] text-sm leading-relaxed">
							{APP_META.description}
						</p>

						<div className="mt-6 flex items-center gap-3">
							{SOCIAL_LINKS.map((social) => (
								<a
									aria-label={social.label}
									className={cn(
										"flex h-8 w-8 items-center justify-center rounded-full",
										"border border-white/[0.08] bg-white/[0.05]",
										"text-[#566B60] transition-all duration-200",
										"hover:border-[#1DB97B]/30 hover:text-[#1DB97B]",
									)}
									href={social.href}
									key={social.label}
									rel="noopener noreferrer"
									target="_blank"
								>
									<SocialIcon icon={social.icon} />
								</a>
							))}
						</div>
					</motion.div>

					{/* Link columns */}
					{FOOTER_COLUMNS.map((col) => (
						<motion.div
							className="col-span-1"
							key={col.heading}
							variants={fadeInUp}
						>
							<p className="mb-4 font-semibold text-[#F2F2F0] text-sm">
								{col.heading}
							</p>
							<ul className="flex flex-col gap-2.5">
								{col.links.map((link) => (
									<li key={link.href}>
										<Link
											className="text-[#566B60] text-sm transition-colors duration-200 hover:text-[#A3B3A8]"
											href={link.href}
										>
											{link.label}
										</Link>
									</li>
								))}
							</ul>
						</motion.div>
					))}
				</motion.div>

				{/* Bottom bar */}
				<div className="flex flex-col items-center justify-between gap-3 border-white/[0.06] border-t py-6 sm:flex-row">
					<p className="text-[#566B60] text-xs">
						© {new Date().getFullYear()} Astra. All rights reserved.
					</p>
					<p className="text-[#566B60] text-xs">
						Crafted with precision for serious learners.
					</p>
				</div>
			</div>
		</footer>
	);
}
