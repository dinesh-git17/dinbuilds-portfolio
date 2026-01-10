/**
 * Onboarding Module
 *
 * Desktop tour system for first-time users.
 * Import via '@/os/onboarding'.
 */

export {
	OnboardingController,
	type OnboardingControllerProps,
	type OnboardingControllerRenderProps,
} from "./OnboardingController";
export {
	getSpotlightStyles,
	OnboardingOverlay,
	type OnboardingOverlayProps,
	SPOTLIGHT_GLOW_CLASS,
	SPOTLIGHT_GLOW_SHADOW,
	SPOTLIGHT_Z_INDEX,
	type SpotlightGlowProps,
} from "./OnboardingOverlay";
export {
	type OnboardingHighlights,
	type OnboardingTooltip,
	type UseOnboardingOrchestratorReturn,
	useOnboardingOrchestrator,
} from "./useOnboardingOrchestrator";
