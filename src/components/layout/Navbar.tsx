"use client";

import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";

import { fadeIn, navbarSlideDown } from "@/lib/animations";
import { AUTH_LINKS, NAV_LINKS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useNavbarScroll } from "@/hooks/useScrollReveal";

// ─── Navbar ───────────────────────────────────────────────────────────────────

export function Navbar() {
	const pathname = usePathname();
	const { isScrolled } = useNavbarScroll(60);
	const [mobileOpen, setMobileOpen] = useState(false);

	const isActive = (href: string) =>
		href === "/" ? pathname === "/" : pathname.startsWith(href);

	return (
		<>
			<motion.header
				animate="visible"
				className={cn(
					"fixed top-0 right-0 left-0 z-50 transition-all duration-500",
					isScrolled
						? "border-white/[0.06] border-b bg-[#050C07]/80 shadow-[0_4px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl"
						: "bg-transparent",
				)}
				initial="hidden"
				variants={navbarSlideDown}
			>
				<nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="flex h-16 items-center justify-between md:h-18">
						{/* Logo */}
						<Link className="group flex shrink-0 items-center gap-2.5" href="/">
							<div className="relative h-8 w-8 transition-transform duration-300 group-hover:scale-105">
								<Image
									alt="Astra"
									className="object-contain"
									fill
									priority
									src="/logo.png"
								/>
							</div>
							<span className="font-semibold text-[#F2F2F0] text-lg tracking-tight">
								Astra
							</span>
						</Link>

						{/* Desktop nav — pill group */}
						<div className="hidden items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.05] px-2 py-1.5 md:flex">
							{NAV_LINKS.filter((l) => !l.disabled).map((link) => (
								<Link
									key={link.href}
									className={cn(
										"relative rounded-full px-4 py-1.5 font-medium text-sm transition-colors duration-200",
										isActive(link.href)
											? "text-[#050C07]"
											: "text-[#A3B3A8] hover:text-[#F2F2F0]",
									)}
									href={link.href}
								>
									{isActive(link.href) && (
										<motion.span
											className="absolute inset-0 rounded-full bg-[#1DB97B]"
											layoutId="nav-pill"
											style={{ zIndex: -1 }}
											transition={{
												damping: 30,
												stiffness: 350,
												type: "spring",
											}}
										/>
									)}
									{link.label}
								</Link>
							))}
						</div>

						{/* Desktop CTAs */}
						<div className="hidden items-center gap-3 md:flex">
							<Link
								className="px-3 py-1.5 font-medium text-[#A3B3A8] text-sm transition-colors duration-200 hover:text-[#F2F2F0]"
								href={AUTH_LINKS.login}
							>
								Login
							</Link>
							<Link
								className={cn(
									"flex items-center gap-1.5 rounded-full px-4 py-2 font-semibold text-sm",
									"bg-[#1DB97B] text-[#050C07]",
									"shadow-[0_0_20px_rgba(29,185,123,0.25)] transition-all duration-200",
									"hover:bg-[#25E699] hover:shadow-[0_0_28px_rgba(29,185,123,0.40)]",
								)}
								href={AUTH_LINKS.register}
							>
								Get Started
								<svg
									aria-hidden="true"
									className="h-3.5 w-3.5"
									fill="none"
									viewBox="0 0 14 14"
								>
									<path
										d="M2 7h10M7 2l5 5-5 5"
										stroke="currentColor"
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="1.8"
									/>
								</svg>
							</Link>
						</div>

						{/* Mobile hamburger */}
						<button
							aria-label={mobileOpen ? "Close menu" : "Open menu"}
							className="p-2 text-[#A3B3A8] transition-colors hover:text-[#F2F2F0] md:hidden"
							type="button"
							onClick={() => setMobileOpen((v) => !v)}
						>
							{mobileOpen ? <X size={22} /> : <Menu size={22} />}
						</button>
					</div>
				</nav>
			</motion.header>

			{/* Mobile drawer */}
			<AnimatePresence>
				{mobileOpen && (
					<>
						<motion.div
							key="backdrop"
							animate={{ opacity: 1 }}
							className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
							exit={{ opacity: 0 }}
							initial={{ opacity: 0 }}
							onClick={() => setMobileOpen(false)}
						/>

						<motion.div
							key="drawer"
							animate={{ x: 0 }}
							className={cn(
								"fixed top-0 right-0 bottom-0 z-50 w-72 md:hidden",
								"flex flex-col border-white/[0.08] border-l bg-[#0A1510] px-6 pt-20 pb-8",
							)}
							exit={{ x: "100%" }}
							initial={{ x: "100%" }}
							transition={{ damping: 30, stiffness: 300, type: "spring" }}
						>
							<button
								aria-label="Close menu"
								className="absolute top-5 right-5 p-2 text-[#A3B3A8]"
								type="button"
								onClick={() => setMobileOpen(false)}
							>
								<X size={20} />
							</button>

							<nav className="flex flex-col gap-1">
								{NAV_LINKS.filter((l) => !l.disabled).map((link, i) => (
									<motion.div
										key={link.href}
										animate="visible"
										initial="hidden"
										transition={{ delay: i * 0.07 }}
										variants={fadeIn}
									>
										<Link
											className={cn(
												"block rounded-xl px-4 py-3 font-medium text-base transition-colors",
												isActive(link.href)
													? "bg-[#1DB97B]/10 text-[#1DB97B]"
													: "text-[#A3B3A8] hover:bg-white/[0.04] hover:text-[#F2F2F0]",
											)}
											href={link.href}
											onClick={() => setMobileOpen(false)}
										>
											{link.label}
										</Link>
									</motion.div>
								))}
							</nav>

							<div className="mt-auto flex flex-col gap-3">
								<Link
									className="w-full rounded-xl border border-white/[0.1] px-4 py-2.5 text-center font-medium text-[#A3B3A8] text-sm transition-colors hover:text-[#F2F2F0]"
									href={AUTH_LINKS.login}
									onClick={() => setMobileOpen(false)}
								>
									Login
								</Link>
								<Link
									className="w-full rounded-xl bg-[#1DB97B] px-4 py-2.5 text-center font-semibold text-[#050C07] text-sm transition-colors hover:bg-[#25E699]"
									href={AUTH_LINKS.register}
									onClick={() => setMobileOpen(false)}
								>
									Get Started
								</Link>
							</div>
						</motion.div>
					</>
				)}
			</AnimatePresence>
		</>
	);
}
