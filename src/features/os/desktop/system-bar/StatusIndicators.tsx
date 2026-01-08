"use client";

import { BatteryCharging, Search, Wifi } from "lucide-react";
import { memo } from "react";

export interface StatusIndicatorsProps {
	/** Optional className for additional styling */
	className?: string;
}

/**
 * StatusIndicators — Right-side utility cluster for the SystemBar.
 *
 * Displays system status icons in macOS menu bar style:
 * - Spotlight (Search) — Interactive with hover glow
 * - Wifi — Static full signal
 * - Battery — Static charging state
 *
 * Icons are static for MVP; functionality can be added later.
 */
export const StatusIndicators = memo(function StatusIndicators({
	className,
}: StatusIndicatorsProps) {
	return (
		<div className={`flex items-center gap-4 ${className ?? ""}`}>
			{/* Spotlight/Search */}
			<button
				type="button"
				className="group flex items-center justify-center rounded-md p-1 transition-all hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
				aria-label="Search"
			>
				<Search
					size={15}
					className="text-foreground-muted transition-all group-hover:text-foreground group-hover:drop-shadow-[0_0_6px_rgba(255,255,255,0.5)]"
					strokeWidth={2}
				/>
			</button>

			{/* Wifi - Static full signal */}
			<output className="flex items-center justify-center p-1" aria-label="Wifi connected">
				<Wifi size={15} className="text-foreground-muted" strokeWidth={2} />
			</output>

			{/* Battery - Static charging */}
			<output className="flex items-center gap-1 p-1" aria-label="Battery charging at 100%">
				<BatteryCharging size={17} className="text-foreground-muted" strokeWidth={2} />
				<span className="font-mono text-[10px] tabular-nums text-foreground-muted">100%</span>
			</output>
		</div>
	);
});
