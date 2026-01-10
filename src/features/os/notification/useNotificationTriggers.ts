"use client";

import { useCallback, useEffect, useRef } from "react";

import {
	type AppID,
	NotificationID,
	type OnboardingStep,
	PROJECT_APP_IDS,
	selectBootPhase,
	selectCurrentStep,
	selectHasCompletedTour,
	useNotificationHasHydrated,
	useNotificationStore,
	useOnboardingStore,
	useSystemStore,
} from "@/os/store";

import { useIdle } from "./useIdle";

/**
 * Delay after onboarding outro completes before showing welcome notification.
 * Allows the "Have fun exploring" message to fully fade out.
 */
const WELCOME_NOTIFICATION_DELAY = 1500;

/**
 * Delay before triggering welcome back notification for returning visitors.
 * These users don't see onboarding, so we delay slightly after boot.
 */
const WELCOME_BACK_DELAY = 1200;

/**
 * Delay before triggering app open notification.
 * Allows window animation to complete.
 */
const APP_NOTIFICATION_DELAY = 600;

/**
 * Idle timeout before showing "Take your time" notification.
 * 5 minutes of no pointer/keyboard activity.
 */
const IDLE_TIMEOUT = 5 * 60 * 1000;

/**
 * useNotificationTriggers — Boot, App & Idle Triggers
 *
 * Listens for system events and triggers appropriate notifications:
 *
 * Boot Events:
 * - First-time visitor: Shows "Welcome to Focus OS" after onboarding completes
 * - Returning visitor: Shows "Welcome back" shortly after boot
 *
 * App Exploration:
 * - First project app opened: Shows "You're in"
 * - All 3 project apps opened: Shows "Nice. You found them all."
 *
 * Idle State:
 * - 5 minutes of inactivity: Shows "Take your time"
 *
 * This hook should be rendered once at the top level (e.g., in Stage).
 */
export function useNotificationTriggers(): void {
	const bootPhase = useSystemStore(selectBootPhase);
	const windows = useSystemStore((s) => s.windows);
	const hasHydrated = useNotificationHasHydrated();

	// Onboarding state
	const currentStep = useOnboardingStore(selectCurrentStep);
	const hasCompletedTour = useOnboardingStore(selectHasCompletedTour);

	const addNotification = useNotificationStore((s) => s.addNotification);
	const hasSeen = useNotificationStore((s) => s.hasSeen);
	const trackProjectAppOpen = useNotificationStore((s) => s.trackProjectAppOpen);

	// Track if we've already triggered welcome notification this mount
	const welcomeTriggeredRef = useRef(false);

	// Track previous onboarding step to detect transitions
	const prevStepRef = useRef<OnboardingStep>("idle");

	// Track previously seen window IDs to detect new opens
	const prevWindowIdsRef = useRef<Set<AppID>>(new Set());

	// Welcome notification trigger - fires after onboarding completes
	useEffect(() => {
		// Wait for store to hydrate before checking seen status
		if (!hasHydrated) return;

		// Only trigger once per mount
		if (welcomeTriggeredRef.current) return;

		// Boot must be complete
		if (bootPhase !== "complete") return;

		// Case 1: First-time visitor - show Welcome after onboarding outro → complete
		if (!hasSeen(NotificationID.Welcome)) {
			// Wait for onboarding to transition from outro to complete
			if (prevStepRef.current === "outro" && currentStep === "complete") {
				welcomeTriggeredRef.current = true;

				// Delay to let "Have fun exploring" fade out
				const timer = setTimeout(() => {
					addNotification(NotificationID.Welcome);
				}, WELCOME_NOTIFICATION_DELAY);

				return () => clearTimeout(timer);
			}

			// Update previous step ref
			prevStepRef.current = currentStep;
			return;
		}

		// Case 2: Returning visitor (already completed tour) - show Welcome back
		if (hasCompletedTour && !hasSeen(NotificationID.WelcomeBack)) {
			welcomeTriggeredRef.current = true;

			// Delay slightly after boot to let UI settle
			const timer = setTimeout(() => {
				addNotification(NotificationID.WelcomeBack);
			}, WELCOME_BACK_DELAY);

			return () => clearTimeout(timer);
		}

		// Update previous step ref
		prevStepRef.current = currentStep;
	}, [bootPhase, currentStep, hasCompletedTour, hasHydrated, hasSeen, addNotification]);

	// App open trigger
	useEffect(() => {
		// Wait for store to hydrate
		if (!hasHydrated) return;

		// Get current open window IDs
		const currentWindowIds = new Set(windows.filter((w) => w.status === "open").map((w) => w.id));

		// Find newly opened windows
		const newlyOpened: AppID[] = [];
		for (const id of currentWindowIds) {
			if (!prevWindowIdsRef.current.has(id)) {
				newlyOpened.push(id);
			}
		}

		// Update ref for next comparison
		prevWindowIdsRef.current = currentWindowIds;

		// Track any newly opened project apps
		for (const appId of newlyOpened) {
			// Check if this is a project app
			if (PROJECT_APP_IDS.includes(appId as (typeof PROJECT_APP_IDS)[number])) {
				// Delay to let window animation complete
				setTimeout(() => {
					trackProjectAppOpen(appId);
				}, APP_NOTIFICATION_DELAY);
			}
		}
	}, [windows, hasHydrated, trackProjectAppOpen]);

	// Idle notification trigger - fires after 5 minutes of inactivity
	const handleIdle = useCallback(() => {
		addNotification(NotificationID.IdleMessage);
	}, [addNotification]);

	// Only enable idle detection after boot completes and if notification hasn't been seen
	const idleEnabled =
		hasHydrated && bootPhase === "complete" && !hasSeen(NotificationID.IdleMessage);

	useIdle({
		timeout: IDLE_TIMEOUT,
		onIdle: handleIdle,
		enabled: idleEnabled,
	});
}
