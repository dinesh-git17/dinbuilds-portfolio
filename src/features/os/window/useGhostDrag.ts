"use client";

import { animate, type MotionValue } from "framer-motion";
import { useCallback, useRef, useState } from "react";

import { ONBOARDING_STEP_TIMING } from "@/os/boot";

/**
 * Ghost Drag animation state
 */
export type GhostDragPhase = "idle" | "moving_right" | "moving_left" | "complete";

export interface UseGhostDragOptions {
	/** Motion value for X position */
	x: MotionValue<number>;
	/** Distance to move right (and back) in pixels */
	distance?: number;
	/** Whether to skip animation (reduced motion) */
	disabled?: boolean;
	/** Callback when animation completes */
	onComplete?: () => void;
}

export interface UseGhostDragReturn {
	/** Current phase of the ghost drag animation */
	phase: GhostDragPhase;
	/** Whether the animation is currently running */
	isAnimating: boolean;
	/** Trigger the ghost drag animation */
	trigger: () => Promise<void>;
	/** Cancel any running animation */
	cancel: () => void;
}

/**
 * useGhostDrag — Programmatic window drag demonstration
 *
 * Animates the window's X position to demonstrate drag physics:
 * 1. Move right by `distance` pixels (easeInOut, 0.6s)
 * 2. Move back to original position (elastic bounce, 0.8s)
 *
 * This animation operates on motion values directly,
 * NOT updating the store position (temporary visual effect).
 *
 * @example
 * ```tsx
 * const { trigger, isAnimating, phase } = useGhostDrag({
 *   x: motionValueX,
 *   distance: 50,
 *   onComplete: () => advanceStep(),
 * });
 *
 * useEffect(() => {
 *   if (shouldAnimate) trigger();
 * }, [shouldAnimate]);
 * ```
 */
export function useGhostDrag({
	x,
	distance = 50,
	disabled = false,
	onComplete,
}: UseGhostDragOptions): UseGhostDragReturn {
	const [phase, setPhase] = useState<GhostDragPhase>("idle");
	const cancelRef = useRef<(() => void) | null>(null);
	const originalXRef = useRef<number>(0);

	const cancel = useCallback(() => {
		if (cancelRef.current) {
			cancelRef.current();
			cancelRef.current = null;
		}
		setPhase("idle");
	}, []);

	const trigger = useCallback(async () => {
		// Don't animate if disabled or already running
		if (disabled || phase !== "idle") {
			return;
		}

		// Store the original position to return to
		originalXRef.current = x.get();
		const targetX = originalXRef.current + distance;

		try {
			// Phase 1: Move right with easeInOut
			setPhase("moving_right");

			const moveRight = animate(x, targetX, {
				duration: ONBOARDING_STEP_TIMING.window_drag.dragDuration / 1000 / 2,
				ease: "easeInOut",
			});

			cancelRef.current = () => moveRight.stop();
			await moveRight;

			// Phase 2: Move back with elastic bounce
			setPhase("moving_left");

			const moveBack = animate(x, originalXRef.current, {
				duration: ONBOARDING_STEP_TIMING.window_drag.dragDuration / 1000 / 2 + 0.2,
				ease: [0.34, 1.56, 0.64, 1], // Approximate elasticOut curve
				type: "tween",
			});

			cancelRef.current = () => moveBack.stop();
			await moveBack;

			// Complete
			setPhase("complete");
			cancelRef.current = null;
			onComplete?.();
		} catch {
			// Animation was cancelled
			setPhase("idle");
		}
	}, [x, distance, disabled, phase, onComplete]);

	return {
		phase,
		isAnimating: phase !== "idle" && phase !== "complete",
		trigger,
		cancel,
	};
}

/**
 * Easing functions for reference.
 * The [0.34, 1.56, 0.64, 1] cubic-bezier approximates Framer Motion's elasticOut.
 */
export const GHOST_DRAG_EASINGS = {
	/** Smooth acceleration and deceleration */
	easeInOut: "easeInOut" as const,
	/** Bouncy return with overshoot */
	elasticOut: [0.34, 1.56, 0.64, 1] as const,
} as const;
