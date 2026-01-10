"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { memo, useCallback, useEffect, useState } from "react";

import { selectIsLocked, useSystemStore } from "@/os/store";
import { useReducedMotion } from "@/os/window";

/**
 * Format current time as HH:MM
 */
function formatTime(): string {
	const now = new Date();
	return now.toLocaleTimeString("en-US", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	});
}

/**
 * Format current date as "Weekday, Month Day"
 */
function formatDate(): string {
	const now = new Date();
	return now.toLocaleDateString("en-US", {
		weekday: "long",
		month: "long",
		day: "numeric",
	});
}

/**
 * LockScreen — System lock overlay.
 *
 * Displays when the system is locked, showing:
 * - Current time and date
 * - User avatar and name
 * - "Click to unlock" prompt
 *
 * Click anywhere to dismiss and unlock the system.
 */
export const LockScreen = memo(function LockScreen() {
	const isLocked = useSystemStore(selectIsLocked);
	const unlockSystem = useSystemStore((s) => s.unlockSystem);
	const prefersReducedMotion = useReducedMotion();

	// Live clock state
	const [time, setTime] = useState(formatTime);
	const [date, setDate] = useState(formatDate);

	// Update clock every second while locked
	useEffect(() => {
		if (!isLocked) return;

		const interval = setInterval(() => {
			setTime(formatTime());
			setDate(formatDate());
		}, 1000);

		return () => clearInterval(interval);
	}, [isLocked]);

	// Handle unlock
	const handleUnlock = useCallback(() => {
		unlockSystem();
	}, [unlockSystem]);

	// Animation configuration
	const fadeConfig = prefersReducedMotion
		? { duration: 0.1 }
		: { duration: 0.4, ease: "easeOut" as const };

	const springConfig = prefersReducedMotion
		? { duration: 0.1 }
		: { type: "spring" as const, stiffness: 300, damping: 25 };

	return (
		<AnimatePresence>
			{isLocked && (
				<motion.div
					className="fixed inset-0 z-[300] flex cursor-pointer flex-col items-center justify-center bg-black/80 backdrop-blur-xl"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={fadeConfig}
					onClick={handleUnlock}
					role="button"
					tabIndex={0}
					aria-label="Click to unlock system"
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							handleUnlock();
						}
					}}
				>
					{/* Time Display */}
					<motion.div
						className="mb-2 select-none text-center"
						initial={{ opacity: 0, y: -20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ ...springConfig, delay: 0.1 }}
					>
						<div className="font-sans text-7xl font-light tracking-tight text-white md:text-8xl">
							{time}
						</div>
						<div className="mt-2 font-sans text-lg text-white/60 md:text-xl">{date}</div>
					</motion.div>

					{/* User Section */}
					<motion.div
						className="mt-12 flex flex-col items-center"
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ ...springConfig, delay: 0.2 }}
					>
						{/* Avatar */}
						<div className="relative mb-4 size-24 overflow-hidden rounded-full border-2 border-white/20 shadow-2xl">
							<Image
								src="/assets/profile_picture/din.png"
								alt="Dinesh profile"
								fill
								className="object-cover"
								sizes="96px"
							/>
						</div>

						{/* Name */}
						<h2 className="text-xl font-medium text-white">Dinesh Dawonauth</h2>
					</motion.div>

					{/* Unlock Hint */}
					<motion.p
						className="absolute bottom-12 select-none font-mono text-sm text-white/40"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.5, duration: 0.5 }}
					>
						Click anywhere to unlock
					</motion.p>
				</motion.div>
			)}
		</AnimatePresence>
	);
});
