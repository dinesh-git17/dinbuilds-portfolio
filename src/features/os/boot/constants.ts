/**
 * Boot Sequence Timing Configuration
 *
 * Shared timing constants for boot sequence orchestration.
 * All values in milliseconds.
 */
export const BOOT_TIMING = {
	/** Delay before boot sequence starts (allows initial render) */
	START_DELAY: 100,
	/** Duration of the boot screen (progress bar animation) */
	BOOT_DURATION: 2500,
	/** Duration for desktop entrance animations */
	DESKTOP_ENTER_DURATION: 1000,
	/** Reduced motion timing (instant transitions) */
	REDUCED_MOTION_DELAY: 50,
	/** Duration of the fade-out animation */
	FADE_OUT_DURATION: 400,
	/** Delay for UI chrome (Dock/SystemBar) entrance after wallpaper visible */
	UI_STAGGER_DELAY: 200,
	/** Duration for Stage fade-in animation */
	STAGE_FADE_DURATION: 600,
	/** Duration welcome overlay persists before auto-dismiss */
	WELCOME_DISPLAY_DURATION: 2500,
	/** Delay before opening About window after welcome dismisses */
	ABOUT_LAUNCH_DELAY: 1000,
	/** Delay before subtext fades in after main text */
	WELCOME_SUBTEXT_DELAY: 400,
	/** Duration for welcome exit animation */
	WELCOME_EXIT_DURATION: 600,
} as const;

/**
 * Spring animation configuration for "Spotify Wrapped" bounce effect.
 * High stiffness + moderate damping = snappy elastic feel.
 */
export const WELCOME_SPRING = {
	stiffness: 300,
	damping: 20,
} as const;

/**
 * Session storage key for tracking boot sequence completion.
 * Used to skip boot animation on page refresh within same session.
 */
export const SESSION_BOOT_KEY = "dinbuilds-booted";
