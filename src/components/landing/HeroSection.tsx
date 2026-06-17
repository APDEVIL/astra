"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";
import * as THREE from "three";

import {
	heroButtonsVariant,
	heroHeadlineVariant,
	heroSubtextVariant,
	heroTagVariant,
	glowPulse,
} from "@/lib/animations";
import { APP_META, AUTH_LINKS, THREE_CONFIG } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useMouseParallax } from "@/hooks/useMouseParallax";

// ─── Three.js Background Canvas ───────────────────────────────────────────────

function CandlestickCanvas() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const { mouse } = useMouseParallax({ smoothing: 0.04 });
	const mouseRef = useRef(mouse);

	useEffect(() => {
		mouseRef.current = mouse;
	}, [mouse]);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const renderer = new THREE.WebGLRenderer({
			alpha: true,
			antialias: true,
			canvas,
		});
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		renderer.setSize(canvas.clientWidth, canvas.clientHeight);

		const scene = new THREE.Scene();
		const camera = new THREE.PerspectiveCamera(
			60,
			canvas.clientWidth / canvas.clientHeight,
			0.1,
			100,
		);
		camera.position.z = THREE_CONFIG.cameraZ;

		const group = new THREE.Group();
		scene.add(group);

		const candleCount = THREE_CONFIG.candlestickCount;
		const candles: THREE.Mesh[] = [];
		const wicks: THREE.LineSegments[] = [];
		const candleData: {
			baseY: number;
			dir: number;
			price: number;
			speed: number;
		}[] = [];

		const matGreen = new THREE.MeshBasicMaterial({
			color: 0x1db97b,
			opacity: 0.55,
			transparent: true,
		});
		const matRed = new THREE.MeshBasicMaterial({
			color: 0xe05050,
			opacity: 0.45,
			transparent: true,
		});
		const wickMat = new THREE.LineBasicMaterial({
			color: 0x566b60,
			opacity: 0.35,
			transparent: true,
		});

		for (let i = 0; i < candleCount; i++) {
			const isUp = Math.random() > 0.42;
			const bodyH = 0.08 + Math.random() * 0.28;
			const bodyW = 0.045 + Math.random() * 0.02;
			const geo = new THREE.BoxGeometry(bodyW, bodyH, bodyW * 0.6);
			const mesh = new THREE.Mesh(geo, isUp ? matGreen : matRed);

			const col = (i % 12) - 5.5;
			const row = Math.floor(i / 12) - 2;
			mesh.position.set(
				col * 0.72 + (Math.random() - 0.5) * 0.25,
				row * 0.9 + (Math.random() - 0.5) * 0.35,
				-1.5 + Math.random() * -4,
			);

			const wickH = bodyH + 0.08 + Math.random() * 0.22;
			const wickGeo = new THREE.BufferGeometry().setFromPoints([
				new THREE.Vector3(0, -wickH / 2, 0),
				new THREE.Vector3(0, wickH / 2, 0),
			]);
			const wick = new THREE.LineSegments(wickGeo, wickMat);
			wick.position.copy(mesh.position);

			group.add(mesh);
			group.add(wick);
			candles.push(mesh);
			wicks.push(wick);
			candleData.push({
				baseY: mesh.position.y,
				dir: Math.random() > 0.5 ? 1 : -1,
				price: mesh.position.y,
				speed: 0.0003 + Math.random() * 0.0006,
			});
		}

		const particleGeo = new THREE.BufferGeometry();
		const positions = new Float32Array(THREE_CONFIG.particleCount * 3);
		for (let i = 0; i < THREE_CONFIG.particleCount; i++) {
			positions[i * 3] = (Math.random() - 0.5) * 14;
			positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
			positions[i * 3 + 2] = (Math.random() - 0.5) * 8 - 3;
		}
		particleGeo.setAttribute(
			"position",
			new THREE.BufferAttribute(positions, 3),
		);
		const particleMat = new THREE.PointsMaterial({
			color: 0x1db97b,
			opacity: 0.3,
			size: THREE_CONFIG.particleSize,
			transparent: true,
		});
		scene.add(new THREE.Points(particleGeo, particleMat));

		let frame: number;
		let t = 0;

		const animate = () => {
			frame = requestAnimationFrame(animate);
			t += 0.016;

			const mx = mouseRef.current.normalizedX;
			const my = mouseRef.current.normalizedY;

			group.rotation.y = THREE.MathUtils.lerp(
				group.rotation.y,
				mx * 0.18,
				0.03,
			);
			group.rotation.x = THREE.MathUtils.lerp(
				group.rotation.x,
				-my * 0.1,
				0.03,
			);

			for (let i = 0; i < candles.length; i++) {
				const c = candles[i];
				const d = candleData[i];
				if (!c || !d) continue;

				d.price += d.speed * d.dir;
				if (Math.abs(d.price - d.baseY) > 0.3) d.dir *= -1;
				c.position.y =
					d.price +
					Math.sin(t * THREE_CONFIG.floatSpeed + i) *
						THREE_CONFIG.floatAmplitude;

				const wick = wicks[i];
				if (wick) wick.position.y = c.position.y;
			}

			group.rotation.y += THREE_CONFIG.rotationSpeed;
			renderer.render(scene, camera);
		};
		animate();

		const onResize = () => {
			if (!canvas) return;
			const w = canvas.clientWidth;
			const h = canvas.clientHeight;
			camera.aspect = w / h;
			camera.updateProjectionMatrix();
			renderer.setSize(w, h);
		};
		window.addEventListener("resize", onResize);

		return () => {
			cancelAnimationFrame(frame);
			window.removeEventListener("resize", onResize);
			renderer.dispose();
		};
	}, []);

	return (
		<canvas
			ref={canvasRef}
			className="pointer-events-none absolute inset-0 h-full w-full"
		/>
	);
}

// ─── Hero Section ─────────────────────────────────────────────────────────────

export function HeroSection() {
	const shouldReduceMotion = useReducedMotion();

	return (
		<section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#050C07]">
			{!shouldReduceMotion && <CandlestickCanvas />}

			{/* Radial green glow */}
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-0"
				style={{
					background:
						"radial-gradient(ellipse 60% 50% at 50% 60%, rgba(29,185,123,0.10) 0%, transparent 70%)",
				}}
			/>

			{/* Bottom fade */}
			<div
				aria-hidden="true"
				className="pointer-events-none absolute right-0 bottom-0 left-0 h-40"
				style={{
					background:
						"linear-gradient(to bottom, transparent 0%, #050C07 100%)",
				}}
			/>

			{/* Copy */}
			<div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 text-center sm:px-6">
				{/* Pill tag */}
				<motion.div
					animate="visible"
					className={cn(
						"inline-flex items-center gap-2 rounded-full border px-4 py-1.5",
						"border-white/[0.10] bg-white/[0.06]",
						"font-medium text-[#1DB97B] text-sm backdrop-blur-sm",
					)}
					initial="hidden"
					variants={heroTagVariant}
				>
					<motion.span
						animate={shouldReduceMotion ? undefined : glowPulse}
						className="h-1.5 w-1.5 rounded-full bg-[#1DB97B]"
					/>
					{APP_META.tagline}
				</motion.div>

				{/* Headline */}
				<motion.h1
					animate="visible"
					className="font-bold font-display text-5xl text-[#F2F2F0] leading-[1.08] tracking-tight sm:text-6xl md:text-7xl"
					initial="hidden"
					variants={heroHeadlineVariant}
				>
					Your Gateway to{" "}
					<span className="relative inline-block">
						<span
							className="bg-clip-text text-transparent"
							style={{
								backgroundImage:
									"linear-gradient(135deg, #1DB97B 0%, #25E699 50%, #1DB97B 100%)",
							}}
						>
							Financial
						</span>
					</span>
					<br />
					Intelligence
				</motion.h1>

				{/* Subtext */}
				<motion.p
					animate="visible"
					className="max-w-2xl text-[#A3B3A8] text-lg leading-relaxed md:text-xl"
					initial="hidden"
					variants={heroSubtextVariant}
				>
					Master Finance, Real Estate, and Global Trade with live mentorship,
					structured courses, and real-world market guidance.
				</motion.p>

				{/* CTA Buttons */}
				<motion.div
					animate="visible"
					className="mt-2 flex flex-wrap items-center justify-center gap-4"
					initial="hidden"
					variants={heroButtonsVariant}
				>
					<Link
						className={cn(
							"inline-flex items-center gap-2 rounded-full px-7 py-3",
							"bg-[#1DB97B] font-semibold text-[#050C07] text-base",
							"shadow-[0_0_28px_rgba(29,185,123,0.30)] transition-all duration-200",
							"hover:bg-[#25E699] hover:shadow-[0_0_40px_rgba(29,185,123,0.50)]",
							"active:scale-[0.97]",
						)}
						href={AUTH_LINKS.register}
					>
						Start Learning
						<svg
							aria-hidden="true"
							className="h-4 w-4"
							fill="none"
							viewBox="0 0 16 16"
						>
							<path
								d="M3 8h10M8 3l5 5-5 5"
								stroke="currentColor"
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
							/>
						</svg>
					</Link>

					<Link
						className={cn(
							"inline-flex items-center gap-2 rounded-full px-7 py-3",
							"border border-white/[0.15] font-medium text-[#F2F2F0] text-base",
							"backdrop-blur-sm transition-all duration-200",
							"hover:border-white/[0.25] hover:bg-white/[0.05]",
						)}
						href="/about"
					>
						Explore Astra
						<svg
							aria-hidden="true"
							className="h-4 w-4"
							fill="none"
							viewBox="0 0 16 16"
						>
							<path
								d="M3 8h10M8 3l5 5-5 5"
								stroke="currentColor"
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="1.8"
							/>
						</svg>
					</Link>
				</motion.div>
			</div>

			{/* Scroll indicator */}
			<motion.div
				animate={{ opacity: 1 }}
				aria-hidden="true"
				className="absolute bottom-10 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2"
				initial={{ opacity: 0 }}
				transition={{ delay: 1.2, duration: 0.6 }}
			>
				<span className="text-[#566B60] text-xs uppercase tracking-widest">
					Scroll
				</span>
				<motion.div
					animate={
						shouldReduceMotion
							? undefined
							: { opacity: [0.4, 1, 0.4], y: [0, 6, 0] }
					}
					className="h-8 w-px bg-gradient-to-b from-[#566B60] to-transparent"
					transition={{
						duration: 1.8,
						ease: "easeInOut" as const,
						repeat: Infinity,
					}}
				/>
			</motion.div>
		</section>
	);
}
