/**
 * Analytics Event Tracking — Vercel Analytics Integration
 *
 * Privacy-first behavioral analytics using Vercel Analytics.
 * Cookie-free and GDPR compliant by design.
 *
 * Event naming: snake_case with semantic prefix
 * Failure handling: Silent — analytics must never block UI
 */

import { track as vercelTrack } from "@vercel/analytics";
import type { AppID, LaunchMethod } from "@/os/store";

// Re-export LaunchMethod for convenience
export type { LaunchMethod } from "@/os/store";

// ============================================================================
// EVENT PAYLOAD TYPES
// ============================================================================

/** Story 1: Core Engagement Events */
export interface OsBootCompletePayload {
	boot_duration_ms?: number;
}

export interface AppWindowOpenedPayload {
	app_id: AppID;
	launch_method: LaunchMethod;
}

export interface AppWindowClosedPayload {
	app_id: AppID;
	session_duration_ms?: number;
}

/** Story 2: Onboarding Funnel Events */
export interface TourStartedPayload {
	total_steps: number;
}

export interface TourStepCompletedPayload {
	step_id: string;
	step_index: number;
}

export interface TourSkippedPayload {
	skipped_at_step: string;
	step_index: number;
	elapsed_ms: number;
}

export interface TourCompletedPayload {
	total_duration_ms: number;
}

/** Story 3: Content Discovery Events */
export interface AboutTabSwitchedPayload {
	from_tab: string;
	to_tab: string;
}

export interface ProfileLinkClickedPayload {
	platform: "github" | "linkedin" | "twitter" | "email" | string;
}

export interface FileOpenedPayload {
	file_slug: string;
	file_type: "markdown" | "code" | string;
}

export interface ExternalProjectClickedPayload {
	app_id: string;
	destination_url: string;
}

/** Story 4: Power User Events */
export type AllowlistedCommand =
	// Visible commands (shown in help)
	| "help"
	| "clear"
	| "whoami"
	| "pwd"
	| "ls"
	| "echo"
	| "date"
	| "uname"
	| "status"
	| "stack"
	| "exit"
	| "about"
	// Hidden commands (easter eggs)
	| "git"
	| "coffee"
	| "sudo"
	| "rm"
	| "matrix"
	// Fallback for unrecognized commands
	| "unknown";

export interface TerminalCommandExecutedPayload {
	command: AllowlistedCommand;
}

export interface SettingsChangedPayload {
	setting_category: string;
	setting_key: string;
}

export type ContextMenuTriggerLocation = "desktop" | "dock" | "window";

export interface ContextMenuOpenedPayload {
	trigger_location: ContextMenuTriggerLocation;
}

/** Story 5: Operational Stability Events */
export type ContactFormSubmittedPayload = Record<string, never>;

export interface ContactFormResultPayload {
	success: boolean;
	error_code?: string;
}

export interface IframeLoadedPayload {
	project_id: string;
	success: boolean;
	load_time_ms?: number;
}

export interface IframeRefreshedPayload {
	project_id: string;
}

// ============================================================================
// EVENT NAME CONSTANTS
// ============================================================================

/**
 * Analytics event names grouped by story.
 * Use these constants to ensure consistent event naming.
 */
export const AnalyticsEvent = {
	// Story 1: Core Engagement
	OS_BOOT_COMPLETE: "os_boot_complete",
	APP_WINDOW_OPENED: "app_window_opened",
	APP_WINDOW_CLOSED: "app_window_closed",

	// Story 2: Onboarding Funnel
	TOUR_STARTED: "tour_started",
	TOUR_STEP_COMPLETED: "tour_step_completed",
	TOUR_SKIPPED: "tour_skipped",
	TOUR_COMPLETED: "tour_completed",

	// Story 3: Content Discovery
	ABOUT_TAB_SWITCHED: "about_tab_switched",
	PROFILE_LINK_CLICKED: "profile_link_clicked",
	FILE_OPENED: "file_opened",
	EXTERNAL_PROJECT_CLICKED: "external_project_clicked",

	// Story 4: Power User
	TERMINAL_COMMAND_EXECUTED: "terminal_command_executed",
	SETTINGS_CHANGED: "settings_changed",
	CONTEXT_MENU_OPENED: "context_menu_opened",

	// Story 5: Operational Stability
	CONTACT_FORM_SUBMITTED: "contact_form_submitted",
	CONTACT_FORM_RESULT: "contact_form_result",
	IFRAME_LOADED: "iframe_loaded",
	IFRAME_REFRESHED: "iframe_refreshed",
} as const;

export type AnalyticsEventName = (typeof AnalyticsEvent)[keyof typeof AnalyticsEvent];

// ============================================================================
// EVENT PAYLOAD MAP
// ============================================================================

/**
 * Type-safe mapping of event names to their payload types.
 * Ensures compile-time validation of event payloads.
 */
export interface AnalyticsEventMap {
	// Story 1
	[AnalyticsEvent.OS_BOOT_COMPLETE]: OsBootCompletePayload;
	[AnalyticsEvent.APP_WINDOW_OPENED]: AppWindowOpenedPayload;
	[AnalyticsEvent.APP_WINDOW_CLOSED]: AppWindowClosedPayload;

	// Story 2
	[AnalyticsEvent.TOUR_STARTED]: TourStartedPayload;
	[AnalyticsEvent.TOUR_STEP_COMPLETED]: TourStepCompletedPayload;
	[AnalyticsEvent.TOUR_SKIPPED]: TourSkippedPayload;
	[AnalyticsEvent.TOUR_COMPLETED]: TourCompletedPayload;

	// Story 3
	[AnalyticsEvent.ABOUT_TAB_SWITCHED]: AboutTabSwitchedPayload;
	[AnalyticsEvent.PROFILE_LINK_CLICKED]: ProfileLinkClickedPayload;
	[AnalyticsEvent.FILE_OPENED]: FileOpenedPayload;
	[AnalyticsEvent.EXTERNAL_PROJECT_CLICKED]: ExternalProjectClickedPayload;

	// Story 4
	[AnalyticsEvent.TERMINAL_COMMAND_EXECUTED]: TerminalCommandExecutedPayload;
	[AnalyticsEvent.SETTINGS_CHANGED]: SettingsChangedPayload;
	[AnalyticsEvent.CONTEXT_MENU_OPENED]: ContextMenuOpenedPayload;

	// Story 5
	[AnalyticsEvent.CONTACT_FORM_SUBMITTED]: ContactFormSubmittedPayload;
	[AnalyticsEvent.CONTACT_FORM_RESULT]: ContactFormResultPayload;
	[AnalyticsEvent.IFRAME_LOADED]: IframeLoadedPayload;
	[AnalyticsEvent.IFRAME_REFRESHED]: IframeRefreshedPayload;
}

// ============================================================================
// TRACK FUNCTION
// ============================================================================

/**
 * Track an analytics event with type-safe payloads.
 *
 * - In development: Logs to console for debugging (debug mode)
 * - In production: Sends to Vercel Analytics
 * - Failures are silent and never block UI
 *
 * @example
 * ```ts
 * trackEvent(AnalyticsEvent.APP_WINDOW_OPENED, {
 *   app_id: AppID.Yield,
 *   launch_method: "dock",
 * });
 * ```
 */
export function trackEvent<T extends AnalyticsEventName>(
	name: T,
	payload: AnalyticsEventMap[T],
): void {
	try {
		// Development: Debug mode logging
		if (process.env.NODE_ENV === "development") {
			// eslint-disable-next-line no-console -- Debug mode for analytics
			console.debug("[Analytics]", name, payload);
		}

		// Send to Vercel Analytics (works in both dev and prod)
		// In development, this validates the call; in production, it sends data
		vercelTrack(name, payload as Record<string, string | number | boolean | null>);
	} catch {
		// Silent failure — analytics must never block UI or throw visible errors
	}
}

/**
 * Track a simple event without payload.
 * Convenience wrapper for events with empty payloads.
 *
 * @example
 * ```ts
 * trackSimpleEvent(AnalyticsEvent.CONTACT_FORM_SUBMITTED);
 * ```
 */
export function trackSimpleEvent(name: typeof AnalyticsEvent.CONTACT_FORM_SUBMITTED): void {
	trackEvent(name, {});
}

// ============================================================================
// LEGACY SUPPORT
// ============================================================================

/**
 * Legacy onboarding event names.
 * @deprecated Use AnalyticsEvent constants and trackEvent() instead.
 * Will be updated in Story 2 (Onboarding Funnel tracking).
 */
export const ONBOARDING_EVENTS = {
	SKIPPED: "onboarding_skipped",
	COMPLETED: "onboarding_completed",
	STEP_VIEWED: "onboarding_step_viewed",
} as const;

/**
 * Legacy event tracking function for backward compatibility.
 * Accepts any event name and properties without type checking.
 *
 * @deprecated Use trackEvent() with AnalyticsEvent constants for type-safe tracking.
 * @param name - Event name (snake_case)
 * @param properties - Optional event properties
 */
export function trackLegacyEvent(name: string, properties?: Record<string, unknown>): void {
	try {
		if (process.env.NODE_ENV === "development") {
			// eslint-disable-next-line no-console -- Debug mode for analytics
			console.debug("[Analytics:Legacy]", name, properties);
		}
		vercelTrack(name, properties as Record<string, string | number | boolean | null>);
	} catch {
		// Silent failure
	}
}
