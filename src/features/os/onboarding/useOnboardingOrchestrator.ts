"use client";

import { useCallback, useEffect, useRef } from "react";

import { getDeviceTiming, ONBOARDING_STEP_TIMING, ONBOARDING_TIMING } from "@/os/boot";
import { useDeviceType } from "@/os/desktop/dock/useDeviceType";
import {
	AppID,
	DESKTOP_STEP_ORDER,
	MOBILE_STEP_ORDER,
	type OnboardingStep,
	selectCurrentStep,
	selectHasCompletedTour,
	useOnboardingHasHydrated,
	useOnboardingStore,
	useSystemStore,
} from "@/os/store";
import { useReducedMotion } from "@/os/window";

/**
 * Timing constants for mobile window management during onboarding.
 */
const MOBILE_WINDOW_TIMING = {
	/** Delay before closing window to allow step transition to settle */
	CLOSE_DELAY: 100,
	/** Duration to wait for window exit animation before showing desktop icons */
	EXIT_ANIMATION_DURATION: 300,
	/** Delay before reopening window after tour completes */
	RESTORE_DELAY: 400,
} as const;

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
	/** Projects stack in dock should glow (mobile only) */
	dockProjectsStack: boolean;
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
	/** Current step index in the tour sequence */
	currentStepIndex: number;
	/** Timestamp when the tour started (null if not started) */
	tourStartTime: number | null;
}

/**
 * Get tooltip content for each step.
 * Mobile-specific steps have touch-optimized copy.
 */
function getTooltipForStep(step: OnboardingStep, isMobile: boolean): OnboardingTooltip {
	switch (step) {
		case "window_controls":
			return {
				visible: true,
				text: "Close, minimize, or maximize windows",
				position: isMobile ? "bottom" : "above-window",
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
				text: isMobile ? "Navigate your apps" : "Launch apps & navigate",
				position: "top",
			};
		case "dock_projects_stack":
			return {
				visible: true,
				text: "Try out my featured projects",
				position: "top",
			};
		case "desktop_icons":
			return {
				visible: true,
				text: isMobile
					? "Double-tap to open files & folders"
					: "Double-click to open files & folders",
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
 * Uses device-aware timings for mobile vs desktop contexts.
 */
function getStepDuration(step: OnboardingStep, reducedMotion: boolean, isMobile: boolean): number {
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
		case "dock_projects_stack":
			return (
				ONBOARDING_STEP_TIMING.dock_projects_stack.glowDuration +
				ONBOARDING_STEP_TIMING.dock_projects_stack.tooltipDuration
			);
		case "desktop_icons":
			return (
				ONBOARDING_STEP_TIMING.desktop_icons.glowDuration +
				ONBOARDING_STEP_TIMING.desktop_icons.tooltipDuration
			);
		case "outro":
			return (
				ONBOARDING_STEP_TIMING.outro.fadeInDuration +
				getDeviceTiming(ONBOARDING_STEP_TIMING.outro.holdDuration, isMobile) +
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

	// Onboarding store state
	const currentStep = useOnboardingStore(selectCurrentStep);
	const hasCompletedTour = useOnboardingStore(selectHasCompletedTour);
	const stepOrder = useOnboardingStore((s) => s.stepOrder);
	const tourStartTime = useOnboardingStore((s) => s.tourStartTime);
	const storeStartTour = useOnboardingStore((s) => s.startTour);
	const storeAdvanceStep = useOnboardingStore((s) => s.advanceStep);
	const storeSkipTour = useOnboardingStore((s) => s.skipTour);

	// Calculate current step index
	const currentStepIndex = stepOrder.indexOf(currentStep);

	// System store actions for window management
	const closeWindow = useSystemStore((s) => s.closeWindow);
	const launchApp = useSystemStore((s) => s.launchApp);

	// Timer ref for step advancement
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Track if ghost drag has completed (for window_drag step)
	const ghostDragCompletedRef = useRef(false);

	// Track previous step for detecting transitions (mobile window management)
	const previousStepRef = useRef<OnboardingStep>(currentStep);

	// Determine if onboarding is active
	const isActive = currentStep !== "idle" && currentStep !== "complete";

	// Calculate highlights based on current step
	const highlights: OnboardingHighlights = {
		windowControls: currentStep === "window_controls",
		windowHeader: currentStep === "window_drag",
		shouldGhostDrag: currentStep === "window_drag" && !ghostDragCompletedRef.current,
		dock: currentStep === "dock",
		dockProjectsStack: currentStep === "dock_projects_stack",
		desktopIcons: currentStep === "desktop_icons",
	};

	// Get tooltip for current step (mobile-aware for copy and positioning)
	const tooltip = getTooltipForStep(currentStep, isMobile);

	// Start tour with device-specific step order
	const startTour = useCallback(() => {
		// Don't start if already completed or not hydrated
		if (hasCompletedTour || !hasHydrated) {
			return;
		}

		// Use device-specific step sequence
		const stepOrder = isMobile ? MOBILE_STEP_ORDER : DESKTOP_STEP_ORDER;
		storeStartTour(stepOrder);
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

		const duration = getStepDuration(currentStep, reducedMotion, isMobile);
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
	}, [currentStep, isActive, reducedMotion, isMobile, advanceStep]);

	// Reset ghost drag completed flag when step changes
	useEffect(() => {
		if (currentStep !== "window_drag") {
			ghostDragCompletedRef.current = false;
		}
	}, [currentStep]);

	// Mobile: Manage About window state during onboarding transitions
	// - Close window when transitioning to desktop_icons to "reveal" the icons
	// - Restore window after tour completes to return user to initial state
	useEffect(() => {
		const previousStep = previousStepRef.current;

		// Always update the ref for next render (before any early returns)
		previousStepRef.current = currentStep;

		// Skip window management on desktop
		if (!isMobile) {
			return;
		}

		let actionTimer: ReturnType<typeof setTimeout> | null = null;

		// Transition: dock_projects_stack → desktop_icons
		// Close the About window to reveal the desktop icons underneath
		if (previousStep === "dock_projects_stack" && currentStep === "desktop_icons") {
			actionTimer = setTimeout(() => {
				closeWindow(AppID.About);
			}, MOBILE_WINDOW_TIMING.CLOSE_DELAY);
		}

		// Transition: outro → complete
		// Restore the About window to return user to their starting state
		if (previousStep === "outro" && currentStep === "complete") {
			actionTimer = setTimeout(() => {
				launchApp(AppID.About);
			}, MOBILE_WINDOW_TIMING.RESTORE_DELAY);
		}

		return () => {
			if (actionTimer) {
				clearTimeout(actionTimer);
			}
		};
	}, [currentStep, isMobile, closeWindow, launchApp]);

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
		currentStepIndex,
		tourStartTime,
	};
}
