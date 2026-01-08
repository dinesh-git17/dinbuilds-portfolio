"use client";

import { Globe, Lock, RotateCw } from "lucide-react";
import { memo } from "react";

export interface BrowserChromeProps {
	url: string;
	onRefresh: () => void;
	isLoading: boolean;
}

/**
 * Browser Chrome UI
 *
 * Simulates a browser address bar with:
 * - Lock icon (secure connection indicator)
 * - Read-only URL display
 * - Refresh button
 *
 * Styled slightly lighter than the OS window header
 * to create visual distinction (tab bar metaphor).
 */
export const BrowserChrome = memo(function BrowserChrome({
	url,
	onRefresh,
	isLoading,
}: BrowserChromeProps) {
	return (
		<div className="flex h-10 shrink-0 items-center gap-2 border-b border-white/5 bg-white/[0.02] px-3">
			{/* Navigation Buttons (Visual Only) */}
			<div className="flex items-center gap-1">
				<button
					type="button"
					disabled
					className="flex h-7 w-7 items-center justify-center rounded-md text-foreground-muted opacity-40"
					aria-label="Back (disabled)"
				>
					<svg
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
						aria-hidden="true"
					>
						<path d="M15 18l-6-6 6-6" />
					</svg>
				</button>
				<button
					type="button"
					disabled
					className="flex h-7 w-7 items-center justify-center rounded-md text-foreground-muted opacity-40"
					aria-label="Forward (disabled)"
				>
					<svg
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
						aria-hidden="true"
					>
						<path d="M9 18l6-6-6-6" />
					</svg>
				</button>
				<button
					type="button"
					onClick={onRefresh}
					disabled={isLoading}
					className="flex h-7 w-7 items-center justify-center rounded-md text-foreground-muted transition-colors hover:bg-white/5 hover:text-foreground-subtle disabled:opacity-40"
					aria-label="Refresh page"
				>
					<RotateCw size={14} className={isLoading ? "animate-spin" : ""} aria-hidden="true" />
				</button>
			</div>

			{/* Address Bar */}
			<div className="flex min-w-0 flex-1 items-center gap-2 rounded-md bg-black/40 px-3 py-1.5">
				<Lock size={12} className="shrink-0 text-green-500" aria-label="Secure connection" />
				<span className="truncate font-mono text-xs text-foreground-subtle">{url}</span>
			</div>

			{/* Globe Icon (Favicon placeholder) */}
			<div className="flex h-7 w-7 items-center justify-center">
				<Globe size={14} className="text-foreground-muted" aria-hidden="true" />
			</div>
		</div>
	);
});
