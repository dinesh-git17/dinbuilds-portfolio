import * as React from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { AnalyticsEvent, trackEvent } from "@/lib/analytics";

import type { OnboardingStep, OnboardingStore } from "./types";
import { DESKTOP_STEP_ORDER } from "./types";

/**
 * localStorage key for onboarding persistence.
 * Only persists completion status, not current step (ephemeral).
 */
const ONBOARDING_STORAGE_KEY = "dinbuilds-onboarding";

/**
 * State keys that should persist across sessions.
 * Only the completion status survives browser close.
 */
interface PersistedOnboardingState {
	hasCompletedTour: boolean;
}

/**
 * Get the next step in the onboarding sequence.
 * Returns 'complete' if already at the final step.
 *
 * @param currentStep - The current onboarding step
 * @param stepOrder - The ordered list of steps for this device type
 */
function getNextStep(currentStep: OnboardingStep, stepOrder: OnboardingStep[]): OnboardingStep {
	if (currentStep === "idle") {
		return stepOrder[0] ?? "complete";
	}

	if (currentStep === "complete") {
		return "complete";
	}

	const currentIndex = stepOrder.indexOf(currentStep);
	if (currentIndex === -1 || currentIndex >= stepOrder.length - 1) {
		return "complete";
	}

	const nextStep = stepOrder[currentIndex + 1];
	return nextStep ?? "complete";
}

/**
 * Onboarding Store — Tour Orchestrator
 *
 * Manages the "Ghost in the Machine" onboarding experience.
 * This store controls the state machine for the guided tour
 * that demonstrates OS mechanics to first-time users.
 *
 * The tour runs on both desktop and mobile with device-specific steps:
 * - Desktop: Includes window drag physics demonstration
 * - Mobile: Includes dock stack highlight (Projects folder)
 *
 * The tour only runs:
 * - For users who haven't completed the tour before
 * - After the About app finishes its opening animation
 *
 * Usage with granular selectors:
 * ```
 * const currentStep = useOnboardingStore(selectCurrentStep);
 * const advanceStep = useOnboardingStore(s => s.advanceStep);
 * ```
 */
export const useOnboardingStore = create<OnboardingStore>()(
	persist(
		(set, get) => ({
			// Initial State
			currentStep: "idle" as OnboardingStep,
			hasCompletedTour: false,
			isInteractionBlocked: false,
			stepOrder: DESKTOP_STEP_ORDER,
			tourStartTime: null,

			// Actions
			startTour: (stepOrder: OnboardingStep[]) => {
				const { hasCompletedTour, currentStep } = get();

				// Don't start if already completed or already running
				if (hasCompletedTour || currentStep !== "idle") {
					return;
				}

				const firstStep = stepOrder[0] ?? "complete";
				const startTime = Date.now();

				// Track tour started (exclude "complete" from step count)
				trackEvent(AnalyticsEvent.TOUR_STARTED, {
					total_steps: stepOrder.length - 1,
				});

				set({
					stepOrder,
					currentStep: firstStep,
					isInteractionBlocked: true,
					tourStartTime: startTime,
				});
			},

			advanceStep: () => {
				const { currentStep, stepOrder, tourStartTime } = get();

				// Can't advance from idle without calling startTour
				if (currentStep === "idle") {
					return;
				}

				// Track step completion before advancing (if not already complete)
				if (currentStep !== "complete") {
					const stepIndex = stepOrder.indexOf(currentStep);
					trackEvent(AnalyticsEvent.TOUR_STEP_COMPLETED, {
						step_id: currentStep,
						step_index: stepIndex,
					});
				}

				const nextStep = getNextStep(currentStep, stepOrder);
				const isComplete = nextStep === "complete";

				// Track tour completion
				if (isComplete && tourStartTime) {
					trackEvent(AnalyticsEvent.TOUR_COMPLETED, {
						total_duration_ms: Date.now() - tourStartTime,
					});
				}

				set({
					currentStep: nextStep,
					hasCompletedTour: isComplete,
					// Unblock interaction on completion
					isInteractionBlocked: isComplete ? false : get().isInteractionBlocked,
					// Clear start time on completion
					tourStartTime: isComplete ? null : tourStartTime,
				});
			},

			skipTour: () => {
				// Note: tour_skipped tracking is handled in OnboardingController
				// where we have access to the current step and elapsed time
				set({
					currentStep: "complete",
					hasCompletedTour: true,
					isInteractionBlocked: false,
					tourStartTime: null,
				});
			},

			setInteractionBlocked: (blocked: boolean) => {
				set({ isInteractionBlocked: blocked });
			},

			resetTour: () => {
				set({
					currentStep: "idle",
					hasCompletedTour: false,
					isInteractionBlocked: false,
					stepOrder: DESKTOP_STEP_ORDER,
					tourStartTime: null,
				});
			},
		}),
		{
			name: ONBOARDING_STORAGE_KEY,
			partialize: (state): PersistedOnboardingState => ({
				hasCompletedTour: state.hasCompletedTour,
			}),
		},
	),
);

/**
 * Hook to check if onboarding store has hydrated from localStorage.
 * Use this to prevent hydration mismatches when checking completion status.
 */
export function useOnboardingHasHydrated(): boolean {
	const [hasHydrated, setHasHydrated] = React.useState(false);

	React.useEffect(() => {
		setHasHydrated(true);
	}, []);

	return hasHydrated;
}

/**
 * Selector helpers for common patterns.
 * Use these to avoid unnecessary re-renders.
 */
export const selectCurrentStep = (state: OnboardingStore) => state.currentStep;
export const selectHasCompletedTour = (state: OnboardingStore) => state.hasCompletedTour;
export const selectIsInteractionBlocked = (state: OnboardingStore) => state.isInteractionBlocked;
export const selectIsOnboarding = (state: OnboardingStore) =>
	state.currentStep !== "idle" && state.currentStep !== "complete";
export const selectIsOnboardingStep = (step: OnboardingStep) => (state: OnboardingStore) =>
	state.currentStep === step;
