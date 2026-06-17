import type { Config } from "tailwindcss";

// ─── Tailwind Config ──────────────────────────────────────────────────────────
// Astra uses Tailwind v4 which reads tokens from globals.css @theme.
// This config handles:
//   - Content paths for class scanning
//   - Extended theme values not expressible in CSS @theme
//   - Plugin configuration
// ─────────────────────────────────────────────────────────────────────────────

const config: Config = {
	// ── Content Paths ──────────────────────────────────────────────────────────
	content: [
		"./src/app/**/*.{ts,tsx}",
		"./src/components/**/*.{ts,tsx}",
		"./src/lib/**/*.{ts,tsx}",
		"./src/hooks/**/*.{ts,tsx}",
	],

	// ── Theme Extension ────────────────────────────────────────────────────────
	theme: {
		extend: {
			// Font families — mirror @theme CSS vars so Tailwind classes work
			fontFamily: {
				sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
				display: [
					"var(--font-syne)",
					"ui-sans-serif",
					"system-ui",
					"sans-serif",
				],
				mono: ["ui-monospace", "Cascadia Code", "Source Code Pro", "monospace"],
			},

			// Brand color palette
			colors: {
				primary: {
					DEFAULT: "#1DB97B",
					dark: "#159A65",
					light: "#25E699",
				},
				bg: {
					base: "#050C07",
					surface: "#0A1510",
					overlay: "#0F1F15",
				},
				text: {
					primary: "#F2F2F0",
					secondary: "#A3B3A8",
					muted: "#566B60",
				},
				sector: {
					finance: "#1DB97B",
					"real-estate": "#F59E0B",
					"import-export": "#6366F1",
				},
				border: {
					DEFAULT: "rgba(255,255,255,0.08)",
					hover: "rgba(255,255,255,0.16)",
				},
			},

			// Box shadows — green glow system
			boxShadow: {
				"glow-sm": "0 0 20px rgba(29,185,123,0.25)",
				"glow-md": "0 0 40px rgba(29,185,123,0.35)",
				"glow-lg": "0 0 60px rgba(29,185,123,0.50)",
				card: "0 8px 40px rgba(0,0,0,0.4)",
				"card-hover": "0 20px 60px rgba(0,0,0,0.5)",
				"navbar-blur": "0 4px 32px rgba(0,0,0,0.4)",
			},

			// Border radius extras
			borderRadius: {
				"4xl": "2rem",
				"5xl": "2.5rem",
			},

			// Backdrop blur extras
			backdropBlur: {
				xs: "2px",
			},

			// Min height
			minHeight: {
				screen: "100dvh",
			},

			// Heights
			height: {
				18: "4.5rem", // Navbar height on md+
			},

			// Keyframe animations (mirrors animations.css for JIT purging)
			keyframes: {
				"fade-in": {
					from: { opacity: "0", transform: "translateY(12px)" },
					to: { opacity: "1", transform: "translateY(0)" },
				},
				shimmer: {
					"0%": { backgroundPosition: "-200% 0" },
					"100%": { backgroundPosition: "200% 0" },
				},
				float: {
					"0%, 100%": { transform: "translateY(0px)" },
					"50%": { transform: "translateY(-10px)" },
				},
				"glow-pulse": {
					"0%, 100%": { boxShadow: "0 0 20px rgba(29,185,123,0.25)" },
					"50%": { boxShadow: "0 0 40px rgba(29,185,123,0.50)" },
				},
				marquee: {
					from: { transform: "translateX(0)" },
					to: { transform: "translateX(-50%)" },
				},
				"slide-down": {
					from: { opacity: "0", transform: "translateY(-16px)" },
					to: { opacity: "1", transform: "translateY(0)" },
				},
				ping: {
					"75%, 100%": { transform: "scale(2)", opacity: "0" },
				},
			},

			animation: {
				"fade-in": "fade-in 0.45s cubic-bezier(0.25,0.1,0.25,1) both",
				shimmer: "shimmer 1.6s ease-in-out infinite",
				float: "float 4s ease-in-out infinite",
				"glow-pulse": "glow-pulse 2.5s ease-in-out infinite",
				marquee: "marquee 28s linear infinite",
				"slide-down": "slide-down 0.4s cubic-bezier(0.25,0.1,0.25,1) both",
			},

			// Typography scale extras
			fontSize: {
				"2xs": ["0.625rem", { lineHeight: "1rem" }],
			},

			// Transition durations
			transitionDuration: {
				"250": "250ms",
				"350": "350ms",
				"400": "400ms",
			},

			// Z-index scale
			zIndex: {
				"60": "60",
				"70": "70",
				"80": "80",
				"90": "90",
				"100": "100",
			},
		},
	},

	plugins: [],
};

export default config;
