import * as React from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { OnboardingStep, OnboardingStore } from "./types";
import { ONBOARDING_STEP_ORDER } from "./types";

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
 */
function getNextStep(currentStep: OnboardingStep): OnboardingStep {
	if (currentStep === "idle") {
		return "window_controls";
	}

	if (currentStep === "complete") {
		return "complete";
	}

	const currentIndex = ONBOARDING_STEP_ORDER.indexOf(currentStep);
	if (currentIndex === -1 || currentIndex >= ONBOARDING_STEP_ORDER.length - 1) {
		return "complete";
	}

	const nextStep = ONBOARDING_STEP_ORDER[currentIndex + 1];
	return nextStep ?? "complete";
}

/**
 * Onboarding Store — Desktop Tour Orchestrator
 *
 * Manages the "Ghost in the Machine" onboarding experience.
 * This store controls the state machine for the guided tour
 * that demonstrates OS mechanics to first-time desktop users.
 *
 * The tour only runs:
 * - On desktop devices (not mobile)
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

			// Actions
			startTour: () => {
				const { hasCompletedTour, currentStep } = get();

				// Don't start if already completed or already running
				if (hasCompletedTour || currentStep !== "idle") {
					return;
				}

				set({
					currentStep: "window_controls",
					isInteractionBlocked: true,
				});
			},

			advanceStep: () => {
				const { currentStep } = get();

				// Can't advance from idle without calling startTour
				if (currentStep === "idle") {
					return;
				}

				const nextStep = getNextStep(currentStep);
				const isComplete = nextStep === "complete";

				set({
					currentStep: nextStep,
					hasCompletedTour: isComplete,
					// Unblock interaction on completion
					isInteractionBlocked: isComplete ? false : get().isInteractionBlocked,
				});
			},

			skipTour: () => {
				set({
					currentStep: "complete",
					hasCompletedTour: true,
					isInteractionBlocked: false,
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
