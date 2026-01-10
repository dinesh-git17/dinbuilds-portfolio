"use client";

import { AnimatePresence, motion } from "framer-motion";
import { memo, useEffect, useRef, useState } from "react";

export interface SystemClockProps {
	/** Optional className for additional styling */
	className?: string;
}

/**
 * Formats a Date object to "Thu Jan 8 9:41 AM" format.
 * Uses Intl.DateTimeFormat for proper localization.
 */
function formatDateTime(date: Date): string {
	const weekday = new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date);
	const month = new Intl.DateTimeFormat("en-US", { month: "short" }).format(date);
	const day = new Intl.DateTimeFormat("en-US", { day: "numeric" }).format(date);
	const time = new Intl.DateTimeFormat("en-US", {
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
	}).format(date);

	return `${weekday} ${month} ${day} ${time}`;
}

/**
 * SystemClock — Hydration-safe date/time display.
 *
 * Renders nothing during SSR to prevent hydration mismatch,
 * then fades in the formatted time on client mount.
 *
 * Updates every minute, synced to the start of each minute
 * to avoid unnecessary re-renders.
 */
export const SystemClock = memo(function SystemClock({ className }: SystemClockProps) {
	const [mounted, setMounted] = useState(false);
	const [time, setTime] = useState<string>("");
	const intervalRef = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		// Initial render on client
		const now = new Date();
		setTime(formatDateTime(now));
		setMounted(true);

		// Calculate ms until next minute starts
		const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

		// First timeout syncs to the start of the next minute
		const syncTimeout = setTimeout(() => {
			setTime(formatDateTime(new Date()));

			// Then set up interval for every minute
			intervalRef.current = setInterval(() => {
				setTime(formatDateTime(new Date()));
			}, 60_000);
		}, msUntilNextMinute);

		return () => {
			clearTimeout(syncTimeout);
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
		};
	}, []);

	// SSR: Render nothing to avoid hydration mismatch
	if (!mounted) {
		return null;
	}

	return (
		<AnimatePresence>
			<motion.span
				className={`whitespace-nowrap font-mono text-xs text-foreground-muted ${className ?? ""}`}
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.3, ease: "easeOut" }}
			>
				{time}
			</motion.span>
		</AnimatePresence>
	);
});
