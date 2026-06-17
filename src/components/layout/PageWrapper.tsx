"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { pageTransitionVariants } from "@/lib/animations";

interface PageWrapperProps {
	children: React.ReactNode;
	className?: string;
	/** Disable top padding (e.g. for hero pages that go edge-to-edge) */
	noPadding?: boolean;
	/** Key for framer-motion page transition — usually the pathname */
	pageKey?: string;
}

export function PageWrapper({
	children,
	className,
	noPadding = false,
	pageKey,
}: PageWrapperProps) {
	const shouldReduceMotion = useReducedMotion();

	const variants = shouldReduceMotion
		? {
				initial: { opacity: 0 },
				animate: { opacity: 1, transition: { duration: 0.15 } },
				exit: { opacity: 0, transition: { duration: 0.1 } },
			}
		: pageTransitionVariants;

	return (
		<motion.main
			key={pageKey}
			variants={variants}
			initial="initial"
			animate="animate"
			exit="exit"
			className={cn(
				"min-h-screen bg-[#050C07] text-[#F2F2F0]",
				!noPadding && "pt-16 md:pt-18",
				className,
			)}
		>
			{children}
		</motion.main>
	);
}
