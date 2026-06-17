"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { SCROLL_CONFIG } from "@/lib/constants";

interface UseScrollRevealOptions {
	/** 0–1: how much of element must be visible (default: 0.15) */
	threshold?: number;
	/** CSS margin offset (default: "0px 0px -60px 0px") */
	rootMargin?: string;
	/** Only trigger once — stays visible after first reveal (default: true) */
	once?: boolean;
	/** Delay in ms before marking as visible (default: 0) */
	delay?: number;
}

interface UseScrollRevealReturn<T extends HTMLElement> {
	ref: React.RefObject<T>;
	isVisible: boolean;
	hasBeenVisible: boolean;
}

export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
	options: UseScrollRevealOptions = {},
): UseScrollRevealReturn<T> {
	const {
		threshold = SCROLL_CONFIG.revealThreshold,
		rootMargin = SCROLL_CONFIG.revealRootMargin,
		once = true,
		delay = 0,
	} = options;

	const ref = useRef<T>(null);
	const [isVisible, setIsVisible] = useState(false);
	const [hasBeenVisible, setHasBeenVisible] = useState(false);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;

		const observer = new IntersectionObserver(
			([entry]) => {
				if (!entry) return;

				if (entry.isIntersecting) {
					if (delay > 0) {
						timerRef.current = setTimeout(() => {
							setIsVisible(true);
							setHasBeenVisible(true);
						}, delay);
					} else {
						setIsVisible(true);
						setHasBeenVisible(true);
					}

					if (once) observer.unobserve(el);
				} else {
					if (!once) {
						if (timerRef.current) clearTimeout(timerRef.current);
						setIsVisible(false);
					}
				}
			},
			{ threshold, rootMargin },
		);

		observer.observe(el);

		return () => {
			observer.unobserve(el);
			if (timerRef.current) clearTimeout(timerRef.current);
		};
	}, [threshold, rootMargin, once, delay]);

	return { ref, isVisible, hasBeenVisible };
}

// ─── Staggered Scroll Reveal ──────────────────────────────────────────────────
// For revealing multiple children in sequence

interface UseStaggeredRevealOptions extends UseScrollRevealOptions {
	/** Number of children to stagger */
	count: number;
	/** Delay between each child reveal in ms (default: 100) */
	staggerDelay?: number;
}

interface UseStaggeredRevealReturn<T extends HTMLElement> {
	containerRef: React.RefObject<T>;
	/** Call with index to check if that child should be visible */
	isChildVisible: (index: number) => boolean;
}

export function useStaggeredReveal<T extends HTMLElement = HTMLDivElement>(
	options: UseStaggeredRevealOptions,
): UseStaggeredRevealReturn<T> {
	const { count, staggerDelay = 100, ...revealOptions } = options;
	const { ref: containerRef, isVisible } = useScrollReveal<T>(revealOptions);
	const [visibleCount, setVisibleCount] = useState(0);

	useEffect(() => {
		if (!isVisible) return;

		let current = 0;
		const interval = setInterval(() => {
			current += 1;
			setVisibleCount(current);
			if (current >= count) clearInterval(interval);
		}, staggerDelay);

		return () => clearInterval(interval);
	}, [isVisible, count, staggerDelay]);

	const isChildVisible = useCallback(
		(index: number) => visibleCount > index,
		[visibleCount],
	);

	return { containerRef, isChildVisible };
}

// ─── Navbar Scroll Hook ───────────────────────────────────────────────────────

interface UseNavbarScrollReturn {
	/** True when user has scrolled past the offset threshold */
	isScrolled: boolean;
	/** Current scroll position in pixels */
	scrollY: number;
	/** True when scrolling up */
	isScrollingUp: boolean;
}

export function useNavbarScroll(offset = 60): UseNavbarScrollReturn {
	const [scrollY, setScrollY] = useState(0);
	const [isScrollingUp, setIsScrollingUp] = useState(true);
	const prevScrollY = useRef(0);

	useEffect(() => {
		const handleScroll = () => {
			const current = window.scrollY;
			setIsScrollingUp(current < prevScrollY.current);
			prevScrollY.current = current;
			setScrollY(current);
		};

		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	return {
		isScrolled: scrollY > offset,
		scrollY,
		isScrollingUp,
	};
}
