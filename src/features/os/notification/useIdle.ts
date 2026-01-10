"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Default idle timeout: 5 minutes in milliseconds.
 */
const DEFAULT_IDLE_TIMEOUT = 5 * 60 * 1000;

/**
 * Events that indicate user activity.
 * Covers mouse, keyboard, touch, and scroll interactions.
 */
const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
	"mousemove",
	"mousedown",
	"keydown",
	"touchstart",
	"scroll",
	"wheel",
];

export interface UseIdleOptions {
	/**
	 * Time in milliseconds before user is considered idle.
	 * @default 300000 (5 minutes)
	 */
	timeout?: number;

	/**
	 * Callback fired when user becomes idle.
	 * Only fires once per idle period.
	 */
	onIdle: () => void;

	/**
	 * Whether the idle detection is enabled.
	 * Useful for disabling during certain states.
	 * @default true
	 */
	enabled?: boolean;
}

/**
 * useIdle — User Inactivity Detection Hook
 *
 * Monitors user activity and fires a callback after a period of inactivity.
 * Activity is detected through mouse, keyboard, touch, and scroll events.
 *
 * Features:
 * - Configurable timeout (default 5 minutes)
 * - Fires callback only once per idle period
 * - Automatically resets on any user activity
 * - Can be enabled/disabled dynamically
 *
 * Usage:
 * ```tsx
 * useIdle({
 *   timeout: 5 * 60 * 1000, // 5 minutes
 *   onIdle: () => console.log('User is idle'),
 *   enabled: true,
 * });
 * ```
 */
export function useIdle({
	timeout = DEFAULT_IDLE_TIMEOUT,
	onIdle,
	enabled = true,
}: UseIdleOptions): void {
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const hasTriggeredRef = useRef(false);

	/**
	 * Clear the existing timer if any.
	 */
	const clearTimer = useCallback(() => {
		if (timerRef.current) {
			clearTimeout(timerRef.current);
			timerRef.current = null;
		}
	}, []);

	/**
	 * Start or restart the idle timer.
	 */
	const startTimer = useCallback(() => {
		clearTimer();

		// Don't start if already triggered or disabled
		if (hasTriggeredRef.current || !enabled) return;

		timerRef.current = setTimeout(() => {
			hasTriggeredRef.current = true;
			onIdle();
		}, timeout);
	}, [clearTimer, timeout, onIdle, enabled]);

	/**
	 * Handle user activity - reset the timer.
	 */
	const handleActivity = useCallback(() => {
		// If already triggered, reset the flag on new activity
		if (hasTriggeredRef.current) {
			hasTriggeredRef.current = false;
		}

		startTimer();
	}, [startTimer]);

	/**
	 * Set up event listeners and initial timer.
	 */
	useEffect(() => {
		if (!enabled) {
			clearTimer();
			return;
		}

		// Start the initial timer
		startTimer();

		// Add activity listeners
		for (const event of ACTIVITY_EVENTS) {
			window.addEventListener(event, handleActivity, { passive: true });
		}

		return () => {
			clearTimer();
			for (const event of ACTIVITY_EVENTS) {
				window.removeEventListener(event, handleActivity);
			}
		};
	}, [enabled, startTimer, handleActivity, clearTimer]);
}
