"use client";

import { motion } from "framer-motion";
import { BatteryCharging, CircleHelp, Wifi } from "lucide-react";
import { memo, useCallback } from "react";

import { AppID, useSystemStore } from "@/os/store";

export interface StatusIndicatorsProps {
	/** Optional className for additional styling */
	className?: string;
}

/**
 * StatusIndicators — Right-side utility cluster for the SystemBar.
 *
 * Displays system status icons in macOS menu bar style:
 * - Help — Opens the System Manual (FAQ)
 * - Wifi — Static full signal
 * - Battery — Static charging state
 */
export const StatusIndicators = memo(function StatusIndicators({
	className,
}: StatusIndicatorsProps) {
	const launchApp = useSystemStore((s) => s.launchApp);

	const handleHelpClick = useCallback(() => {
		launchApp(AppID.FAQ);
	}, [launchApp]);

	return (
		<div className={`flex items-center gap-4 ${className ?? ""}`}>
			{/* Help — Opens System Manual */}
			<motion.button
				type="button"
				onClick={handleHelpClick}
				whileTap={{ scale: 0.9 }}
				className="group flex items-center justify-center rounded-md p-1 transition-all hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
				aria-label="Help"
			>
				<CircleHelp
					size={15}
					className="text-foreground-muted transition-all group-hover:text-foreground group-hover:drop-shadow-[0_0_6px_rgba(255,255,255,0.5)]"
					strokeWidth={2}
				/>
			</motion.button>

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
