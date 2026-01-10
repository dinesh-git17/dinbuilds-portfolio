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
	/**
	 * Delay before opening About window after welcome dismisses.
	 * Tuned to 800ms to ensure UI reveal animations complete first:
	 * - Dock settles at ~700ms (0.1s delay + 0.6s duration)
	 * - 800ms provides 100ms buffer after all UI is stable
	 */
	ABOUT_LAUNCH_DELAY: 800,
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
 * UI Reveal Animation Configuration
 *
 * Choreographed entrance animations for the "curtain up" moment
 * when transitioning from 'welcome' to 'complete' phase.
 */
export const UI_REVEAL = {
	/** SystemBar: Slide down from top with circOut easing */
	systemBar: {
		duration: 0.5,
		ease: "circOut" as const,
		delay: 0,
	},
	/** Dock: Slide up from bottom with backOut bounce */
	dock: {
		duration: 0.6,
		ease: "backOut" as const,
		delay: 0.1,
	},
	/** Desktop Icons & Weather: Fade in with scale */
	content: {
		duration: 0.4,
		ease: "easeOut" as const,
		delay: 0.3,
		scale: { from: 0.95, to: 1 },
	},
	/** Mobile: Simplified fade for performance */
	mobile: {
		duration: 0.3,
		ease: "easeOut" as const,
	},
	/**
	 * About app launch: Opens after UI reveal is fully settled.
	 * Delay calculated as: max(dock, content) + buffer = 0.7s + 0.1s = 0.8s
	 */
	aboutLaunch: {
		delay: 0.8,
	},
} as const;

/**
 * Session storage key for tracking boot sequence completion.
 * Used to skip boot animation on page refresh within same session.
 */
export const SESSION_BOOT_KEY = "dinbuilds-booted";

/**
 * Check if user has already seen boot sequence this session.
 */
export function hasBootedThisSession(): boolean {
	if (typeof window === "undefined") return false;
	try {
		return sessionStorage.getItem(SESSION_BOOT_KEY) === "true";
	} catch {
		// sessionStorage may be unavailable (private browsing, etc.)
		return false;
	}
}

/**
 * Mark boot sequence as completed for this session.
 */
export function markBootComplete(): void {
	if (typeof window === "undefined") return;
	try {
		sessionStorage.setItem(SESSION_BOOT_KEY, "true");
	} catch {
		// Silently fail if sessionStorage unavailable
	}
}

/**
 * Onboarding Tour Timing Configuration
 *
 * Timing constants for the "Ghost in the Machine" desktop onboarding tour.
 * All values in milliseconds unless otherwise noted.
 */
export const ONBOARDING_TIMING = {
	/** Delay after About app opens before starting tour */
	START_DELAY: 1500,
	/** Duration for tooltip display at each step */
	TOOLTIP_DURATION: 2000,
	/** Duration for glow transition between targets */
	GLOW_TRANSITION: 300,
	/** Duration for the ghost drag demonstration */
	GHOST_DRAG_DURATION: 1400,
	/** Hold time for "Have fun exploring" message */
	OUTRO_HOLD: 1500,
	/** Fade out duration for outro */
	OUTRO_FADE: 600,
	/** Reduced motion timing (instant transitions) */
	REDUCED_MOTION_DELAY: 50,
} as const;

/**
 * Onboarding animation configuration for spring physics.
 * Matches WindowFrame spring config for consistency.
 */
export const ONBOARDING_SPRING = {
	/** Standard spring for glow/highlight transitions */
	highlight: {
		stiffness: 300,
		damping: 25,
	},
	/** Bouncy spring for ghost drag return */
	ghostDrag: {
		stiffness: 200,
		damping: 15,
	},
} as const;

/**
 * Step-specific timing overrides.
 * Allows fine-tuning individual step durations.
 */
export const ONBOARDING_STEP_TIMING = {
	window_controls: {
		glowDuration: 2000,
		tooltipDuration: 2000,
	},
	window_drag: {
		glowDuration: 1000,
		dragDuration: 1400,
		tooltipDuration: 2000,
	},
	dock: {
		glowDuration: 2500,
		rippleDuration: 800,
		tooltipDuration: 2000,
	},
	/** Mobile-only step: highlights the Projects stack in the dock */
	dock_projects_stack: {
		glowDuration: 2500,
		tooltipDuration: 2000,
	},
	desktop_icons: {
		glowDuration: 2000,
		tooltipDuration: 2000,
	},
	outro: {
		fadeInDuration: 400,
		holdDuration: 1500,
		fadeOutDuration: 600,
	},
} as const;
