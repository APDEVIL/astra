"use client";

import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import { TRPCReactProvider } from "@/trpc/react";

// ─── Providers ────────────────────────────────────────────────────────────────
// TRPCReactProvider (from trpc/react.tsx) already wraps QueryClientProvider
// internally — we do NOT double-wrap it here.
// Add any future client providers (theme, analytics, etc.) inside this tree.

interface ProvidersProps {
	children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
	return (
		<TRPCReactProvider>
			{children}
			{process.env.NODE_ENV === "development" && (
				<ReactQueryDevtools
					buttonPosition="bottom-left"
					initialIsOpen={false}
				/>
			)}
		</TRPCReactProvider>
	);
}
