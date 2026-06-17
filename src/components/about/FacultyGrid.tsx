"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { FaLinkedin, FaTwitter } from "react-icons/fa";

import { fadeInUp, staggerContainer } from "@/lib/animations";
import { cn } from "@/lib/utils";
import type { RouterOutputs } from "@/trpc/react";

// ─── Types ────────────────────────────────────────────────────────────────────

type FacultyProfile = RouterOutputs["content"]["getFaculty"][number];

interface FacultyGridProps {
	faculty: FacultyProfile[];
}

// ─── Faculty Card ─────────────────────────────────────────────────────────────

function FacultyCard({ member }: { member: FacultyProfile }) {
	return (
		<motion.div
			className={cn(
				"group flex flex-col items-center gap-4 rounded-2xl p-6 text-center",
				"border border-white/[0.06] bg-[#0A1510]",
				"transition-[border-color,box-shadow] duration-300",
				"hover:border-white/[0.12] hover:shadow-[0_8px_40px_rgba(0,0,0,0.4)]",
			)}
			variants={fadeInUp}
		>
			{/* Avatar */}
			<div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-white/[0.08] transition-[border-color] duration-300 group-hover:border-[#1DB97B]/30">
				{member.avatarUrl ? (
					<Image
						alt={member.name}
						className="object-cover"
						fill
						sizes="80px"
						src={member.avatarUrl}
					/>
				) : (
					<div className="flex h-full w-full items-center justify-center bg-[#1DB97B]/10">
						<span className="font-bold font-display text-2xl text-[#1DB97B]/60">
							{member.name.charAt(0)}
						</span>
					</div>
				)}
			</div>

			{/* Info */}
			<div className="flex flex-col gap-1">
				<h3 className="font-bold font-display text-[#F2F2F0] text-base">
					{member.name}
				</h3>
				<span className="font-medium text-[#1DB97B] text-xs">
					{member.title}
				</span>
			</div>

			{/* Bio */}
			<p className="text-[#566B60] text-xs leading-relaxed">{member.bio}</p>

			{/* Socials */}
			{(member.linkedinUrl ?? member.twitterUrl) && (
				<div className="mt-auto flex items-center gap-2 pt-2">
					{member.linkedinUrl && (
						<a
							aria-label={`${member.name} on LinkedIn`}
							className={cn(
								"flex h-8 w-8 items-center justify-center rounded-lg",
								"border border-white/[0.06] bg-white/[0.03]",
								"text-[#566B60] transition-all duration-200",
								"hover:border-[#1DB97B]/30 hover:text-[#1DB97B]",
							)}
							href={member.linkedinUrl}
							rel="noopener noreferrer"
							target="_blank"
						>
							<FaLinkedin size={13} strokeWidth={1.8} />
						</a>
					)}
					{member.twitterUrl && (
						<a
							aria-label={`${member.name} on Twitter`}
							className={cn(
								"flex h-8 w-8 items-center justify-center rounded-lg",
								"border border-white/[0.06] bg-white/[0.03]",
								"text-[#566B60] transition-all duration-200",
								"hover:border-[#1DB97B]/30 hover:text-[#1DB97B]",
							)}
							href={member.twitterUrl}
							rel="noopener noreferrer"
							target="_blank"
						>
							<FaTwitter size={13} strokeWidth={1.8} />
						</a>
					)}
				</div>
			)}
		</motion.div>
	);
}

// ─── Faculty Grid ─────────────────────────────────────────────────────────────

export function FacultyGrid({ faculty }: FacultyGridProps) {
	if (faculty.length === 0) return null;

	return (
		<div className="flex flex-col gap-10">
			<div className="flex flex-col items-center gap-3 text-center">
				<span className="font-semibold text-[#1DB97B] text-sm uppercase tracking-widest">
					Our Team
				</span>
				<h2 className="font-bold font-display text-3xl text-[#F2F2F0] md:text-4xl">
					The People Behind Astra
				</h2>
				<p className="max-w-xl text-[#A3B3A8] text-base">
					Practitioners, analysts, and educators who've been in the market — not
					just studying it.
				</p>
			</div>

			<motion.div
				animate="visible"
				className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
				initial="hidden"
				variants={staggerContainer}
			>
				{faculty.map((member) => (
					<FacultyCard key={member.id} member={member} />
				))}
			</motion.div>
		</div>
	);
}
