/**
 * Analytics Event Tracking
 *
 * Lightweight analytics utility for tracking user interactions.
 * Currently logs to console in development; integrate with your
 * preferred analytics provider (Vercel Analytics, Plausible, etc.)
 * by replacing the implementation below.
 */

export interface AnalyticsEvent {
	/** Event name following snake_case convention */
	name: string;
	/** Event properties/metadata */
	properties?: Record<string, unknown>;
}

/**
 * Track an analytics event.
 *
 * @example
 * ```ts
 * trackEvent('onboarding_skipped', {
 *   step: 'window_controls',
 *   timeElapsed: 3500,
 * });
 * ```
 */
export function trackEvent(name: string, properties?: Record<string, unknown>): void {
	const event: AnalyticsEvent = { name, properties };

	// Development: Log to console for debugging
	if (process.env.NODE_ENV === "development") {
		console.debug("[Analytics]", event);
	}

	// Production: Send to analytics provider
	// TODO: Integrate with Vercel Analytics, Plausible, or preferred provider
	// Example with Vercel Analytics:
	// if (typeof window !== 'undefined' && window.va) {
	//   window.va('event', { name, ...properties });
	// }
}

/**
 * Onboarding-specific event names.
 * Use these constants to ensure consistent event naming.
 */
export const ONBOARDING_EVENTS = {
	SKIPPED: "onboarding_skipped",
	COMPLETED: "onboarding_completed",
	STEP_VIEWED: "onboarding_step_viewed",
} as const;
