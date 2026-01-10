"use client";

import { useCallback, useEffect, useRef } from "react";

import { ONBOARDING_STEP_TIMING, ONBOARDING_TIMING } from "@/os/boot";
import { useDeviceType } from "@/os/desktop/dock/useDeviceType";
import {
	type OnboardingStep,
	selectCurrentStep,
	selectHasCompletedTour,
	useOnboardingHasHydrated,
	useOnboardingStore,
} from "@/os/store";
import { useReducedMotion } from "@/os/window";

/**
 * Highlight states for each onboarding target.
 */
export interface OnboardingHighlights {
	/** Window controls (traffic lights) should glow */
	windowControls: boolean;
	/** Window header/drag area should glow */
	windowHeader: boolean;
	/** Ghost drag animation should play */
	shouldGhostDrag: boolean;
	/** Dock should glow */
	dock: boolean;
	/** Desktop icons should glow */
	desktopIcons: boolean;
}

/**
 * Tooltip content for each step.
 */
export interface OnboardingTooltip {
	/** Whether to show the tooltip */
	visible: boolean;
	/** Tooltip text content */
	text: string;
	/** Position hint for tooltip placement */
	position: "top" | "bottom" | "left" | "right" | "center" | "above-window";
}

export interface UseOnboardingOrchestratorReturn {
	/** Whether onboarding is currently active */
	isActive: boolean;
	/** Current step in the tour */
	currentStep: OnboardingStep;
	/** Highlight states for each target */
	highlights: OnboardingHighlights;
	/** Current tooltip to display */
	tooltip: OnboardingTooltip;
	/** Whether user interactions should be blocked */
	isBlocking: boolean;
	/** Start the onboarding tour */
	startTour: () => void;
	/** Skip to the end of the tour */
	skipTour: () => void;
	/** Manually advance to next step */
	advanceStep: () => void;
	/** Callback for when ghost drag completes */
	onGhostDragComplete: () => void;
}

/**
 * Get tooltip content for each step.
 */
function getTooltipForStep(step: OnboardingStep): OnboardingTooltip {
	switch (step) {
		case "window_controls":
			return {
				visible: true,
				text: "Close, minimize, or maximize windows",
				position: "above-window",
			};
		case "window_drag":
			return {
				visible: true,
				text: "Drag anywhere to organize",
				position: "above-window",
			};
		case "dock":
			return {
				visible: true,
				text: "Launch apps & navigate",
				position: "top",
			};
		case "desktop_icons":
			return {
				visible: true,
				text: "Explore my projects & details",
				position: "left",
			};
		case "outro":
			return {
				visible: true,
				text: "Have fun exploring.",
				position: "center",
			};
		default:
			return {
				visible: false,
				text: "",
				position: "center",
			};
	}
}

/**
 * Get step duration in milliseconds.
 */
function getStepDuration(step: OnboardingStep, reducedMotion: boolean): number {
	if (reducedMotion) {
		return ONBOARDING_TIMING.REDUCED_MOTION_DELAY;
	}

	switch (step) {
		case "window_controls":
			return (
				ONBOARDING_STEP_TIMING.window_controls.glowDuration +
				ONBOARDING_STEP_TIMING.window_controls.tooltipDuration
			);
		case "window_drag":
			// This step advances via onGhostDragComplete callback
			return 0;
		case "dock":
			return ONBOARDING_STEP_TIMING.dock.glowDuration + ONBOARDING_STEP_TIMING.dock.tooltipDuration;
		case "desktop_icons":
			return (
				ONBOARDING_STEP_TIMING.desktop_icons.glowDuration +
				ONBOARDING_STEP_TIMING.desktop_icons.tooltipDuration
			);
		case "outro":
			return (
				ONBOARDING_STEP_TIMING.outro.fadeInDuration +
				ONBOARDING_STEP_TIMING.outro.holdDuration +
				ONBOARDING_STEP_TIMING.outro.fadeOutDuration
			);
		default:
			return 0;
	}
}

/**
 * useOnboardingOrchestrator — Coordinates the onboarding tour sequence.
 *
 * This hook manages:
 * - Step timing and automatic advancement
 * - Highlight states for each UI target
 * - Tooltip content and positioning
 * - Integration with the onboarding store
 *
 * @example
 * ```tsx
 * const { isActive, highlights, tooltip, startTour } = useOnboardingOrchestrator();
 *
 * // In WindowFrame:
 * <WindowControls isHighlighted={highlights.windowControls} />
 *
 * // In Dock:
 * <Dock isHighlighted={highlights.dock} />
 * ```
 */
export function useOnboardingOrchestrator(): UseOnboardingOrchestratorReturn {
	const deviceType = useDeviceType();
	const isMobile = deviceType === "mobile";
	const reducedMotion = useReducedMotion();
	const hasHydrated = useOnboardingHasHydrated();

	// Store state
	const currentStep = useOnboardingStore(selectCurrentStep);
	const hasCompletedTour = useOnboardingStore(selectHasCompletedTour);
	const storeStartTour = useOnboardingStore((s) => s.startTour);
	const storeAdvanceStep = useOnboardingStore((s) => s.advanceStep);
	const storeSkipTour = useOnboardingStore((s) => s.skipTour);

	// Timer ref for step advancement
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Track if ghost drag has completed (for window_drag step)
	const ghostDragCompletedRef = useRef(false);

	// Determine if onboarding is active
	const isActive = currentStep !== "idle" && currentStep !== "complete";

	// Calculate highlights based on current step
	const highlights: OnboardingHighlights = {
		windowControls: currentStep === "window_controls",
		windowHeader: currentStep === "window_drag",
		shouldGhostDrag: currentStep === "window_drag" && !ghostDragCompletedRef.current,
		dock: currentStep === "dock",
		desktopIcons: currentStep === "desktop_icons",
	};

	// Get tooltip for current step
	const tooltip = getTooltipForStep(currentStep);

	// Start tour with delay check
	const startTour = useCallback(() => {
		// Don't start on mobile or if already completed
		if (isMobile || hasCompletedTour || !hasHydrated) {
			return;
		}
		storeStartTour();
	}, [isMobile, hasCompletedTour, hasHydrated, storeStartTour]);

	// Advance to next step
	const advanceStep = useCallback(() => {
		if (timerRef.current) {
			clearTimeout(timerRef.current);
			timerRef.current = null;
		}
		ghostDragCompletedRef.current = false;
		storeAdvanceStep();
	}, [storeAdvanceStep]);

	// Skip tour entirely
	const skipTour = useCallback(() => {
		if (timerRef.current) {
			clearTimeout(timerRef.current);
			timerRef.current = null;
		}
		storeSkipTour();
	}, [storeSkipTour]);

	// Callback for when ghost drag animation completes
	const onGhostDragComplete = useCallback(() => {
		ghostDragCompletedRef.current = true;
		// Small delay before advancing to let the animation settle
		setTimeout(() => {
			advanceStep();
		}, 500);
	}, [advanceStep]);

	// Auto-advance steps based on timing
	useEffect(() => {
		// Clear any existing timer
		if (timerRef.current) {
			clearTimeout(timerRef.current);
			timerRef.current = null;
		}

		// Don't set timer if not active or if step handles its own advancement
		if (!isActive) {
			return;
		}

		// window_drag step is advanced by ghost drag completion, not timer
		if (currentStep === "window_drag") {
			return;
		}

		const duration = getStepDuration(currentStep, reducedMotion);
		if (duration > 0) {
			timerRef.current = setTimeout(() => {
				advanceStep();
			}, duration);
		}

		return () => {
			if (timerRef.current) {
				clearTimeout(timerRef.current);
				timerRef.current = null;
			}
		};
	}, [currentStep, isActive, reducedMotion, advanceStep]);

	// Reset ghost drag completed flag when step changes
	useEffect(() => {
		if (currentStep !== "window_drag") {
			ghostDragCompletedRef.current = false;
		}
	}, [currentStep]);

	return {
		isActive,
		currentStep,
		highlights,
		tooltip,
		isBlocking: isActive && currentStep !== "outro",
		startTour,
		skipTour,
		advanceStep,
		onGhostDragComplete,
	};
}
