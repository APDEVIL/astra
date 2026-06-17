"use client";

import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { fadeInUp, staggerContainer } from "@/lib/animations";
import { AUTH_CONFIG, AUTH_LINKS } from "@/lib/constants";
import { cn, isValidEmail, isValidPhone } from "@/lib/utils";
import { authClient } from "@/server/better-auth/client";

// ─── Field ────────────────────────────────────────────────────────────────────

interface FieldProps {
	error?: string;
	label: string;
	placeholder: string;
	type?: string;
	value: string;
	onChange: (v: string) => void;
}

function Field({
	error,
	label,
	onChange,
	placeholder,
	type = "text",
	value,
}: FieldProps) {
	const [show, setShow] = useState(false);
	const isPassword = type === "password";
	const id = label.toLowerCase().replace(/\s+/g, "-");

	return (
		<div className="flex flex-col gap-1.5">
			<label className="font-medium text-[#A3B3A8] text-sm" htmlFor={id}>
				{label}
			</label>
			<div className="relative">
				<input
					className={cn(
						"w-full rounded-xl border bg-white/[0.03] px-4 py-3 text-[#F2F2F0] text-sm",
						"outline-none placeholder:text-[#566B60]",
						"transition-[border-color,box-shadow] duration-200",
						"focus:border-[#1DB97B]/50 focus:shadow-[0_0_0_3px_rgba(29,185,123,0.10)]",
						error
							? "border-red-500/50 focus:border-red-500/70"
							: "border-white/[0.08] hover:border-white/[0.14]",
						isPassword && "pr-11",
					)}
					id={id}
					onChange={(e) => onChange(e.target.value)}
					placeholder={placeholder}
					type={isPassword ? (show ? "text" : "password") : type}
					value={value}
				/>
				{isPassword && (
					<button
						aria-label={show ? "Hide password" : "Show password"}
						className="absolute top-1/2 right-3 -translate-y-1/2 text-[#566B60] hover:text-[#A3B3A8]"
						onClick={() => setShow((v) => !v)}
						type="button"
					>
						{show ? <EyeOff size={16} /> : <Eye size={16} />}
					</button>
				)}
			</div>
			{error && <p className="text-red-400 text-xs">{error}</p>}
		</div>
	);
}
// ─── Register Form ────────────────────────────────────────────────────────────

export function RegisterForm() {
	const router = useRouter();

	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");

	const [errors, setErrors] = useState<Record<string, string>>({});
	const [loading, setLoading] = useState(false);
	const [serverError, setServerError] = useState("");

	const validate = (): boolean => {
		const next: Record<string, string> = {};
		if (name.trim().length < 2)
			next.name = "Name must be at least 2 characters.";
		if (!isValidEmail(email)) next.email = "Enter a valid email address.";
		if (phone && !isValidPhone(phone))
			next.phone = "Enter a valid 10-digit phone number.";
		if (password.length < 8)
			next.password = "Password must be at least 8 characters.";
		if (confirm !== password) next.confirm = "Passwords do not match.";
		setErrors(next);
		return Object.keys(next).length === 0;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!validate()) return;
		setLoading(true);
		setServerError("");

		try {
			const { error } = await authClient.signUp.email({
				email,
				name,
				password,
			});
			if (error) {
				setServerError(
					error.message ?? "Registration failed. Please try again.",
				);
				return;
			}
			router.push(AUTH_CONFIG.redirectAfterLogin);
			router.refresh();
		} catch {
			setServerError("Something went wrong. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const handleGitHub = async () => {
		setLoading(true);
		await authClient.signIn.social({ provider: "github" });
		setLoading(false);
	};

	return (
		<motion.div
			animate="visible"
			className="flex w-full flex-col gap-6"
			initial="hidden"
			variants={staggerContainer}
		>
			{/* Form */}
			<motion.form
				className="flex flex-col gap-4"
				onSubmit={handleSubmit}
				variants={fadeInUp}
			>
				<Field
					error={errors.name}
					label="Full Name"
					onChange={setName}
					placeholder="John Doe"
					value={name}
				/>
				<Field
					error={errors.email}
					label="Email"
					onChange={setEmail}
					placeholder="you@example.com"
					type="email"
					value={email}
				/>
				<Field
					error={errors.phone}
					label="Phone Number (optional)"
					onChange={setPhone}
					placeholder="9876543210"
					type="tel"
					value={phone}
				/>

				{/* Password row */}
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<Field
						error={errors.password}
						label="Password"
						onChange={setPassword}
						placeholder="••••••••"
						type="password"
						value={password}
					/>
					<Field
						error={errors.confirm}
						label="Confirm Password"
						onChange={setConfirm}
						placeholder="••••••••"
						type="password"
						value={confirm}
					/>
				</div>

				{/* Password strength hint */}
				{password.length > 0 && (
					<div className="flex items-center gap-2">
						{[1, 2, 3, 4].map((i) => (
							<div
								className={cn(
									"h-1 flex-1 rounded-full transition-colors duration-300",
									password.length >= i * 3
										? i <= 1
											? "bg-red-500"
											: i <= 2
												? "bg-yellow-500"
												: i <= 3
													? "bg-blue-500"
													: "bg-[#1DB97B]"
										: "bg-white/[0.08]",
								)}
								key={i}
							/>
						))}
						<span className="text-[#566B60] text-xs">
							{password.length < 4
								? "Weak"
								: password.length < 7
									? "Fair"
									: password.length < 10
										? "Good"
										: "Strong"}
						</span>
					</div>
				)}

				{serverError && (
					<p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-red-400 text-sm">
						{serverError}
					</p>
				)}

				{/* Terms note */}
				<p className="text-[#566B60] text-xs leading-relaxed">
					By registering, you agree to our{" "}
					<Link
						className="text-[#A3B3A8] underline-offset-2 hover:underline"
						href="/terms"
					>
						Terms of Service
					</Link>{" "}
					and{" "}
					<Link
						className="text-[#A3B3A8] underline-offset-2 hover:underline"
						href="/privacy"
					>
						Privacy Policy
					</Link>
					.
				</p>

				<button
					className={cn(
						"flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3",
						"bg-[#1DB97B] font-semibold text-[#050C07] text-sm",
						"shadow-[0_0_20px_rgba(29,185,123,0.25)] transition-all duration-200",
						"hover:bg-[#25E699] hover:shadow-[0_0_28px_rgba(29,185,123,0.40)]",
						"disabled:cursor-not-allowed disabled:opacity-60",
					)}
					disabled={loading}
					type="submit"
				>
					{loading && <Loader2 className="animate-spin" size={16} />}
					{loading ? "Creating account…" : "Create Account"}
				</button>
			</motion.form>

			{/* Divider */}
			<motion.div className="flex items-center gap-3" variants={fadeInUp}>
				<div className="h-px flex-1 bg-white/[0.06]" />
				<span className="text-[#566B60] text-xs">or</span>
				<div className="h-px flex-1 bg-white/[0.06]" />
			</motion.div>

			{/* GitHub */}
			<motion.button
				className={cn(
					"flex w-full items-center justify-center gap-3 rounded-xl border px-4 py-3",
					"border-white/[0.08] bg-white/[0.03]",
					"font-medium text-[#A3B3A8] text-sm",
					"transition-all duration-200 hover:border-white/[0.16] hover:bg-white/[0.06] hover:text-[#F2F2F0]",
					"disabled:cursor-not-allowed disabled:opacity-60",
				)}
				disabled={loading}
				onClick={handleGitHub}
				type="button"
				variants={fadeInUp}
			>
				<svg
					aria-hidden="true"
					className="h-4 w-4"
					fill="currentColor"
					viewBox="0 0 24 24"
				>
					<path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.38.6.11.82-.26.82-.58v-2.03c-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02.004 2.04.14 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.64 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.21.7.82.58C20.56 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z" />
				</svg>
				Continue with GitHub
			</motion.button>

			<motion.p
				className="text-center text-[#566B60] text-sm"
				variants={fadeInUp}
			>
				Already have an account?{" "}
				<Link
					className="font-medium text-[#1DB97B] underline-offset-2 hover:underline"
					href={AUTH_LINKS.login}
				>
					Sign in
				</Link>
			</motion.p>
		</motion.div>
	);
}
