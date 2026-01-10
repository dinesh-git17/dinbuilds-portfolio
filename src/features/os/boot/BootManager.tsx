"use client";

import { useCallback, useEffect, useRef } from "react";

import { useSystemStore } from "@/os/store";
import { useReducedMotion } from "@/os/window";

import { BOOT_TIMING, hasBootedThisSession } from "./constants";

export interface BootManagerProps {
	/** Content to render (Desktop, windows, etc.) */
	children: React.ReactNode;
}

/**
 * BootManager — System Initialization Orchestrator
 *
 * Manages the boot sequence state machine transitions:
 * hidden -> booting -> welcome -> complete
 *
 * This component wraps the entire OS and controls the timing
 * of transitions between boot phases. The actual visual components
 * (BootScreen, WelcomeOverlay) subscribe to bootPhase state directly.
 *
 * Session Handling:
 * - First visit: Full boot sequence with animations
 * - Page refresh (same session): Skip directly to desktop
 *
 * Timing sequence (first visit):
 * 1. Mount: Immediately transition to 'booting'
 * 2. After 2.5s: Transition to 'welcome'
 * 3. WelcomeOverlay controls transition to 'complete' (user interaction or timer)
 *
 * The desktop Stage renders behind the boot screen (opacity: 0)
 * and fades in during the 'welcome' phase with only wallpaper visible.
 * Full UI (Dock, SystemBar) appears when 'complete'.
 */
export function BootManager({ children }: BootManagerProps) {
	const setBootPhase = useSystemStore((s) => s.setBootPhase);
	const prefersReducedMotion = useReducedMotion();
	const hasStartedRef = useRef(false);

	/**
	 * Calculate timing based on motion preference.
	 * Reduced motion users skip most of the boot animation.
	 */
	const getTiming = useCallback(() => {
		if (prefersReducedMotion) {
			return {
				startDelay: BOOT_TIMING.REDUCED_MOTION_DELAY,
				bootDuration: BOOT_TIMING.REDUCED_MOTION_DELAY,
			};
		}
		return {
			startDelay: BOOT_TIMING.START_DELAY,
			bootDuration: BOOT_TIMING.BOOT_DURATION,
		};
	}, [prefersReducedMotion]);

	/**
	 * Start the boot sequence when component mounts.
	 * Skips animation if user has already booted this session.
	 * Uses refs to prevent double-execution in StrictMode.
	 */
	useEffect(() => {
		if (hasStartedRef.current) return;
		hasStartedRef.current = true;

		// Skip boot sequence if already seen this session
		if (hasBootedThisSession()) {
			setBootPhase("complete");
			return;
		}

		const timing = getTiming();
		const timeouts: NodeJS.Timeout[] = [];

		// Phase 1: hidden -> booting
		const startBootTimeout = setTimeout(() => {
			setBootPhase("booting");
		}, timing.startDelay);
		timeouts.push(startBootTimeout);

		// Phase 2: booting -> welcome
		// The WelcomeOverlay component handles the transition to 'complete'
		const welcomeTimeout = setTimeout(() => {
			setBootPhase("welcome");
		}, timing.startDelay + timing.bootDuration);
		timeouts.push(welcomeTimeout);

		return () => {
			for (const timeout of timeouts) {
				clearTimeout(timeout);
			}
		};
	}, [getTiming, setBootPhase]);

	return <>{children}</>;
}
