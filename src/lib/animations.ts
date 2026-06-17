import type { Easing, Transition, Variants } from "framer-motion";

// ─── Base Transitions ─────────────────────────────────────────────────────────

export const smoothTransition: Transition = {
	type: "tween",
	ease: [0.25, 0.1, 0.25, 1],
	duration: 0.5,
};

export const springTransition: Transition = {
	type: "spring",
	stiffness: 300,
	damping: 30,
};

export const softSpring: Transition = {
	type: "spring",
	stiffness: 120,
	damping: 20,
	mass: 1,
};

export const fastTransition: Transition = {
	type: "tween",
	ease: "easeOut",
	duration: 0.25,
};

// ─── Shared Easing Constant ───────────────────────────────────────────────────

const easeInOut: Easing = "easeInOut";

// ─── Fade Variants ────────────────────────────────────────────────────────────

export const fadeIn: Variants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: smoothTransition,
	},
};

export const fadeInUp: Variants = {
	hidden: { opacity: 0, y: 40 },
	visible: {
		opacity: 1,
		y: 0,
		transition: smoothTransition,
	},
};

export const fadeInDown: Variants = {
	hidden: { opacity: 0, y: -40 },
	visible: {
		opacity: 1,
		y: 0,
		transition: smoothTransition,
	},
};

export const fadeInLeft: Variants = {
	hidden: { opacity: 0, x: -40 },
	visible: {
		opacity: 1,
		x: 0,
		transition: smoothTransition,
	},
};

export const fadeInRight: Variants = {
	hidden: { opacity: 0, x: 40 },
	visible: {
		opacity: 1,
		x: 0,
		transition: smoothTransition,
	},
};

// ─── Scale Variants ───────────────────────────────────────────────────────────

export const scaleIn: Variants = {
	hidden: { opacity: 0, scale: 0.85 },
	visible: {
		opacity: 1,
		scale: 1,
		transition: softSpring,
	},
};

export const scaleInFast: Variants = {
	hidden: { opacity: 0, scale: 0.92 },
	visible: {
		opacity: 1,
		scale: 1,
		transition: fastTransition,
	},
};

// ─── Stagger Container ────────────────────────────────────────────────────────

export const staggerContainer: Variants = {
	hidden: {},
	visible: {
		transition: {
			staggerChildren: 0.12,
			delayChildren: 0.1,
		},
	},
};

export const staggerContainerFast: Variants = {
	hidden: {},
	visible: {
		transition: {
			staggerChildren: 0.07,
			delayChildren: 0.05,
		},
	},
};

export const staggerContainerSlow: Variants = {
	hidden: {},
	visible: {
		transition: {
			staggerChildren: 0.2,
			delayChildren: 0.15,
		},
	},
};

// ─── Hero Section Variants ────────────────────────────────────────────────────

export const heroTagVariant: Variants = {
	hidden: { opacity: 0, y: 20, scale: 0.95 },
	visible: {
		opacity: 1,
		y: 0,
		scale: 1,
		transition: { ...smoothTransition, delay: 0.1 },
	},
};

export const heroHeadlineVariant: Variants = {
	hidden: { opacity: 0, y: 60 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { ...smoothTransition, duration: 0.8, delay: 0.25 },
	},
};

export const heroSubtextVariant: Variants = {
	hidden: { opacity: 0, y: 30 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { ...smoothTransition, delay: 0.45 },
	},
};

export const heroButtonsVariant: Variants = {
	hidden: { opacity: 0, y: 20 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { ...smoothTransition, delay: 0.6 },
	},
};

// ─── Card Hover Variants ──────────────────────────────────────────────────────

export const cardHover: Variants = {
	rest: {
		scale: 1,
		y: 0,
		boxShadow: "0px 0px 0px rgba(0,0,0,0)",
		transition: fastTransition,
	},
	hover: {
		scale: 1.025,
		y: -6,
		boxShadow: "0px 20px 60px rgba(0,0,0,0.35)",
		transition: softSpring,
	},
};

export const sectorCardHover: Variants = {
	rest: {
		scale: 1,
		rotateX: 0,
		rotateY: 0,
		z: 0,
		transition: fastTransition,
	},
	hover: {
		scale: 1.03,
		z: 20,
		transition: softSpring,
	},
};

// ─── Icon / Badge Variants ────────────────────────────────────────────────────

export const iconBounce: Variants = {
	rest: { scale: 1 },
	hover: {
		scale: 1.15,
		rotate: [0, -5, 5, 0],
		transition: { duration: 0.35, ease: easeInOut },
	},
};

export const badgePulse: Variants = {
	animate: {
		scale: [1, 1.05, 1],
		transition: {
			duration: 2,
			repeat: Infinity,
			ease: easeInOut,
		},
	},
};

// ─── Page Transition ──────────────────────────────────────────────────────────

export const pageTransitionVariants: Variants = {
	initial: { opacity: 0, y: 16 },
	animate: {
		opacity: 1,
		y: 0,
		transition: { ...smoothTransition, duration: 0.45 },
	},
	exit: {
		opacity: 0,
		y: -16,
		transition: { ...fastTransition, duration: 0.25 },
	},
};

// ─── Navbar ───────────────────────────────────────────────────────────────────

export const navbarSlideDown: Variants = {
	hidden: { y: -80, opacity: 0 },
	visible: {
		y: 0,
		opacity: 1,
		transition: { ...softSpring, delay: 0.1 },
	},
};

// ─── Scroll Reveal ────────────────────────────────────────────────────────────

export const scrollRevealVariants: Variants = {
	offscreen: { opacity: 0, y: 50 },
	onscreen: {
		opacity: 1,
		y: 0,
		transition: { ...softSpring },
	},
};

export const scrollRevealLeft: Variants = {
	offscreen: { opacity: 0, x: -60 },
	onscreen: {
		opacity: 1,
		x: 0,
		transition: { ...softSpring },
	},
};

export const scrollRevealRight: Variants = {
	offscreen: { opacity: 0, x: 60 },
	onscreen: {
		opacity: 1,
		x: 0,
		transition: { ...softSpring },
	},
};

// ─── Number Counter ───────────────────────────────────────────────────────────

export const counterConfig = {
	duration: 2,
	ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
};

// ─── Floating / Ambient Animation ─────────────────────────────────────────────

export const floatAnimation = {
	y: [0, -12, 0],
	transition: {
		duration: 4,
		repeat: Infinity,
		ease: easeInOut,
	},
};

export const glowPulse = {
	opacity: [0.4, 0.8, 0.4],
	scale: [1, 1.05, 1],
	transition: {
		duration: 3,
		repeat: Infinity,
		ease: easeInOut,
	},
};

// ─── Reduced Motion Helper ────────────────────────────────────────────────────

export function getReducedMotionVariants(variants: Variants): Variants {
	return {
		hidden: { opacity: 0 },
		visible: { opacity: 1, transition: { duration: 0.1 } },
		...variants,
	};
}
