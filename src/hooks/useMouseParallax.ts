"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { lerp, clamp } from "@/lib/utils";

interface MousePosition {
	/** Raw mouse X in pixels */
	x: number;
	/** Raw mouse Y in pixels */
	y: number;
	/** Normalized X: -1 (left) to 1 (right) */
	normalizedX: number;
	/** Normalized Y: -1 (top) to 1 (bottom) */
	normalizedY: number;
	/** Normalized X centered: -0.5 to 0.5 */
	centeredX: number;
	/** Normalized Y centered: -0.5 to 0.5 */
	centeredY: number;
}

interface UseMouseParallaxOptions {
	/** Smoothing factor 0–1. Higher = more responsive, lower = more lag (default: 0.08) */
	smoothing?: number;
	/** Clamp output to [-1, 1] (default: true) */
	clampOutput?: boolean;
	/** Only track when element is hovered — pass a ref */
	targetRef?: React.RefObject<HTMLElement>;
	/** Disable on mobile (default: true) */
	disableOnMobile?: boolean;
}

interface UseMouseParallaxReturn {
	/** Smoothed mouse state */
	mouse: MousePosition;
	/** CSS transform string for X/Y parallax — pass strength in px */
	getTransform: (strengthX: number, strengthY?: number) => string;
	/** Rotation style for 3D tilt effect */
	getTilt: (maxDeg?: number) => { rotateX: number; rotateY: number };
	/** Is the user currently hovering the target (if targetRef passed) */
	isHovered: boolean;
}

export function useMouseParallax(
	options: UseMouseParallaxOptions = {},
): UseMouseParallaxReturn {
	const {
		smoothing = 0.08,
		clampOutput = true,
		targetRef,
		disableOnMobile = true,
	} = options;

	const rafRef = useRef<number | null>(null);
	const rawRef = useRef<MousePosition>({
		x: 0,
		y: 0,
		normalizedX: 0,
		normalizedY: 0,
		centeredX: 0,
		centeredY: 0,
	});
	const smoothRef = useRef<MousePosition>({
		x: 0,
		y: 0,
		normalizedX: 0,
		normalizedY: 0,
		centeredX: 0,
		centeredY: 0,
	});

	const [mouse, setMouse] = useState<MousePosition>(smoothRef.current);
	const [isHovered, setIsHovered] = useState(false);
	const isMobile = useRef(false);

	useEffect(() => {
		isMobile.current =
			typeof window !== "undefined" &&
			window.matchMedia("(hover: none)").matches;
	}, []);

	// Animate loop — smoothly interpolates toward raw position
	const animate = useCallback(() => {
		const raw = rawRef.current;
		const smooth = smoothRef.current;

		const nextX = lerp(smooth.normalizedX, raw.normalizedX, smoothing);
		const nextY = lerp(smooth.normalizedY, raw.normalizedY, smoothing);
		const centX = lerp(smooth.centeredX, raw.centeredX, smoothing);
		const centY = lerp(smooth.centeredY, raw.centeredY, smoothing);

		const changed =
			Math.abs(nextX - smooth.normalizedX) > 0.0001 ||
			Math.abs(nextY - smooth.normalizedY) > 0.0001;

		if (changed) {
			smoothRef.current = {
				x: raw.x,
				y: raw.y,
				normalizedX: nextX,
				normalizedY: nextY,
				centeredX: centX,
				centeredY: centY,
			};
			setMouse({ ...smoothRef.current });
		}

		rafRef.current = requestAnimationFrame(animate);
	}, [smoothing]);

	useEffect(() => {
		if (disableOnMobile && isMobile.current) return;

		const handleMouseMove = (e: MouseEvent) => {
			const el = targetRef?.current;
			let nx: number, ny: number;

			if (el) {
				const rect = el.getBoundingClientRect();
				nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
				ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
			} else {
				nx = (e.clientX / window.innerWidth) * 2 - 1;
				ny = (e.clientY / window.innerHeight) * 2 - 1;
			}

			if (clampOutput) {
				nx = clamp(nx, -1, 1);
				ny = clamp(ny, -1, 1);
			}

			rawRef.current = {
				x: e.clientX,
				y: e.clientY,
				normalizedX: nx,
				normalizedY: ny,
				centeredX: nx / 2,
				centeredY: ny / 2,
			};
		};

		const target = targetRef?.current ?? window;
		target.addEventListener("mousemove", handleMouseMove as EventListener);
		rafRef.current = requestAnimationFrame(animate);

		return () => {
			target.removeEventListener("mousemove", handleMouseMove as EventListener);
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
		};
	}, [animate, clampOutput, disableOnMobile, targetRef]);

	// Track hover state if targetRef provided
	useEffect(() => {
		if (!targetRef?.current) return;
		const el = targetRef.current;
		const onEnter = () => setIsHovered(true);
		const onLeave = () => setIsHovered(false);
		el.addEventListener("mouseenter", onEnter);
		el.addEventListener("mouseleave", onLeave);
		return () => {
			el.removeEventListener("mouseenter", onEnter);
			el.removeEventListener("mouseleave", onLeave);
		};
	}, [targetRef]);

	const getTransform = useCallback(
		(strengthX: number, strengthY = strengthX): string => {
			const tx = mouse.centeredX * strengthX;
			const ty = mouse.centeredY * strengthY;
			return `translate(${tx}px, ${ty}px)`;
		},
		[mouse],
	);

	const getTilt = useCallback(
		(maxDeg = 12): { rotateX: number; rotateY: number } => ({
			// Invert Y so moving mouse up tilts card toward you
			rotateX: -mouse.centeredY * maxDeg * 2,
			rotateY: mouse.centeredX * maxDeg * 2,
		}),
		[mouse],
	);

	return { mouse, getTransform, getTilt, isHovered };
}
