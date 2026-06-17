"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { FaLinkedin, FaTwitter } from "react-icons/fa";

import { fadeInLeft, fadeInRight } from "@/lib/animations";
import { cn } from "@/lib/utils";
import type { RouterOutputs } from "@/trpc/react";

// ─── Types ────────────────────────────────────────────────────────────────────

type FacultyProfile = RouterOutputs["content"]["getFaculty"][number];

interface OwnerCardProps {
	owner: FacultyProfile;
}

// ─── Owner Card ───────────────────────────────────────────────────────────────

export function OwnerCard({ owner }: OwnerCardProps) {
	return (
		<div className="mb-20 grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-16">
			{/* Avatar */}
			<motion.div
				animate="visible"
				className="flex justify-center md:justify-end"
				initial="hidden"
				variants={fadeInLeft}
			>
				<div className="relative">
					<div
						aria-hidden="true"
						className="absolute -inset-1 rounded-2xl opacity-40 blur-xl"
						style={{
							background: "linear-gradient(135deg, #1DB97B 0%, #25E699 100%)",
						}}
					/>

					<div className="relative h-72 w-72 overflow-hidden rounded-2xl border border-[#1DB97B]/20 md:h-80 md:w-80">
						{owner.avatarUrl ? (
							<Image
								alt={owner.name}
								className="object-cover"
								fill
								priority
								sizes="320px"
								src={owner.avatarUrl}
							/>
						) : (
							<div className="flex h-full w-full items-center justify-center bg-[#0A1510]">
								<span className="font-bold font-display text-6xl text-[#1DB97B]/40">
									{owner.name.charAt(0)}
								</span>
							</div>
						)}
					</div>

					<div
						className={cn(
							"absolute -bottom-4 left-1/2 -translate-x-1/2",
							"inline-flex items-center gap-2 rounded-full px-4 py-2",
							"border border-[#1DB97B]/20 bg-[#050C07]",
							"font-semibold text-[#1DB97B] text-sm",
							"shadow-[0_4px_24px_rgba(0,0,0,0.5)]",
						)}
					>
						<span
							aria-hidden="true"
							className="h-2 w-2 animate-pulse rounded-full bg-[#1DB97B]"
						/>
						{owner.title}
					</div>
				</div>
			</motion.div>

			{/* Content */}
			<motion.div
				animate="visible"
				className="flex flex-col gap-6"
				initial="hidden"
				variants={fadeInRight}
			>
				<div className="flex flex-col gap-2">
					<span className="font-semibold text-[#1DB97B] text-sm uppercase tracking-widest">
						Meet the Founder
					</span>
					<h2 className="font-bold font-display text-3xl text-[#F2F2F0] leading-tight md:text-4xl">
						{owner.name}
					</h2>
				</div>

				<p className="text-[#A3B3A8] text-base leading-relaxed">{owner.bio}</p>

				{(owner.linkedinUrl ?? owner.twitterUrl) && (
					<div className="flex items-center gap-3">
						{owner.linkedinUrl && (
							<a
								aria-label={`${owner.name} on LinkedIn`}
								className={cn(
									"flex h-10 w-10 items-center justify-center rounded-xl",
									"border border-white/[0.08] bg-white/[0.04]",
									"text-[#566B60] transition-all duration-200",
									"hover:border-[#1DB97B]/30 hover:bg-[#1DB97B]/10 hover:text-[#1DB97B]",
								)}
								href={owner.linkedinUrl}
								rel="noopener noreferrer"
								target="_blank"
							>
								<FaLinkedin size={16} strokeWidth={1.8} />
							</a>
						)}
						{owner.twitterUrl && (
							<a
								aria-label={`${owner.name} on Twitter`}
								className={cn(
									"flex h-10 w-10 items-center justify-center rounded-xl",
									"border border-white/[0.08] bg-white/[0.04]",
									"text-[#566B60] transition-all duration-200",
									"hover:border-[#1DB97B]/30 hover:bg-[#1DB97B]/10 hover:text-[#1DB97B]",
								)}
								href={owner.twitterUrl}
								rel="noopener noreferrer"
								target="_blank"
							>
								<FaTwitter size={16} strokeWidth={1.8} />
							</a>
						)}
					</div>
				)}
			</motion.div>
		</div>
	);
}
