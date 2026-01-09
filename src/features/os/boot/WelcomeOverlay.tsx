"use client";

import { AnimatePresence, motion } from "framer-motion";
import { memo, useCallback, useEffect, useState } from "react";

import { AppID, selectBootPhase, useSystemStore } from "@/os/store";
import { useReducedMotion } from "@/os/window";

import { BOOT_TIMING, SESSION_BOOT_KEY, WELCOME_SPRING } from "./constants";

/**
 * Check if user has already seen boot sequence this session.
 */
function hasBootedThisSession(): boolean {
	if (typeof window === "undefined") return false;
	try {
		return sessionStorage.getItem(SESSION_BOOT_KEY) === "true";
	} catch {
		return false;
	}
}

/**
 * WelcomeOverlay — "Spotify Wrapped" style hero text.
 *
 * A typographic overlay that appears after the OS desktop has loaded,
 * providing a warm welcome with bouncy spring animations.
 *
 * Features:
 * - Triggers only when bootPhase reaches 'complete' (first visit only)
 * - Skips entirely on page refresh within same session
 * - Main text scales up with heavy spring bounce (stiffness: 300, damping: 20)
 * - Subtext fades in 400ms after main text
 * - Auto-dismisses after 4 seconds
 * - Click anywhere to dismiss early
 * - Exit animation: blur out + fade away
 *
 * Z-Index: 40 (above desktop, below boot screen)
 */
export const WelcomeOverlay = memo(function WelcomeOverlay() {
	const bootPhase = useSystemStore(selectBootPhase);
	const launchApp = useSystemStore((s) => s.launchApp);
	const prefersReducedMotion = useReducedMotion();
	const [isVisible, setIsVisible] = useState(false);
	// Skip welcome if returning within same session
	const [isDismissed, setIsDismissed] = useState(() => hasBootedThisSession());

	// Show welcome when boot completes
	const shouldShow = bootPhase === "complete" && !isDismissed;

	// Trigger visibility when boot completes
	useEffect(() => {
		if (bootPhase === "complete" && !isDismissed) {
			setIsVisible(true);
		}
	}, [bootPhase, isDismissed]);

	// Launch About window with delay after dismissal
	const launchAboutWithDelay = useCallback(() => {
		const delay = prefersReducedMotion ? 0 : BOOT_TIMING.ABOUT_LAUNCH_DELAY;
		setTimeout(() => {
			launchApp(AppID.About);
		}, delay);
	}, [launchApp, prefersReducedMotion]);

	// Auto-dismiss timer
	useEffect(() => {
		if (!isVisible) return;

		const displayDuration = prefersReducedMotion
			? BOOT_TIMING.WELCOME_DISPLAY_DURATION / 2
			: BOOT_TIMING.WELCOME_DISPLAY_DURATION;

		const timer = setTimeout(() => {
			setIsVisible(false);
			setIsDismissed(true);
			launchAboutWithDelay();
		}, displayDuration);

		return () => clearTimeout(timer);
	}, [isVisible, prefersReducedMotion, launchAboutWithDelay]);

	// Click to dismiss
	const handleDismiss = useCallback(() => {
		setIsVisible(false);
		setIsDismissed(true);
		launchAboutWithDelay();
	}, [launchAboutWithDelay]);

	// Calculate timing based on motion preference
	const subtextDelay = prefersReducedMotion ? 0 : BOOT_TIMING.WELCOME_SUBTEXT_DELAY / 1000;
	const exitDuration = prefersReducedMotion
		? BOOT_TIMING.REDUCED_MOTION_DELAY / 1000
		: BOOT_TIMING.WELCOME_EXIT_DURATION / 1000;

	// Spring config for reduced motion (instant)
	const springConfig = prefersReducedMotion
		? { duration: 0.1 }
		: { type: "spring" as const, ...WELCOME_SPRING };

	return (
		<AnimatePresence>
			{shouldShow && isVisible && (
				<motion.div
					className="fixed inset-0 z-40 flex cursor-pointer flex-col items-center justify-center"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{
						opacity: 0,
						filter: "blur(20px)",
						transition: { duration: exitDuration, ease: "easeOut" },
					}}
					onClick={handleDismiss}
					role="status"
					aria-live="polite"
					aria-label="Welcome message"
				>
					{/* Main welcome text with spring bounce */}
					<motion.h1
						className="select-none text-center font-sans text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl"
						initial={{ scale: 0, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						transition={springConfig}
					>
						Welcome to{" "}
						<span className="bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent">
							DinBuilds OS
						</span>
					</motion.h1>

					{/* Subtext with delayed fade-in */}
					<motion.p
						className="mt-4 select-none text-center font-mono text-sm text-white/60 sm:text-base md:mt-6 md:text-lg"
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{
							delay: subtextDelay,
							duration: 0.5,
							ease: "easeOut",
						}}
					>
						System online. Building in progress.
					</motion.p>

					{/* Dismiss hint */}
					<motion.span
						className="absolute bottom-8 select-none font-mono text-xs text-white/30"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: subtextDelay + 0.5, duration: 0.5 }}
					>
						Click anywhere to continue
					</motion.span>
				</motion.div>
			)}
		</AnimatePresence>
	);
});
