"use client";

import { AnimatePresence, motion } from "framer-motion";
import { memo } from "react";

import { ONBOARDING_TIMING } from "@/os/boot";
import { selectIsOnboarding, useOnboardingStore } from "@/os/store";
import { useReducedMotion } from "@/os/window";

/**
 * CSS class for the spotlight glow effect.
 * Applied to highlighted elements during onboarding.
 * Uses the theme accent color (blue-500).
 */
export const SPOTLIGHT_GLOW_CLASS = "onboarding-spotlight";

/**
 * Z-index values for the spotlight system.
 * Backdrop sits below highlighted elements.
 */
export const SPOTLIGHT_Z_INDEX = {
	/** The dark overlay that dims the background */
	backdrop: 90,
	/** Highlighted elements during onboarding */
	highlighted: 100,
} as const;

export interface OnboardingOverlayProps {
	/** Optional children to render above the backdrop (e.g., tooltips) */
	children?: React.ReactNode;
}

/**
 * OnboardingOverlay — The "Dimmer" for the spotlight system.
 *
 * Renders a full-screen dark backdrop during onboarding to create
 * the "spotlight" effect. Elements with the spotlight glow class
 * are promoted to z-index 100 to appear above this backdrop.
 *
 * Structure:
 * - Backdrop: z-index 90, bg-black/60
 * - Highlighted elements: z-index 100 (applied via isHighlighted prop)
 * - Tooltips/content: rendered as children above backdrop
 *
 * Animation:
 * - Fades in when onboarding starts (idle → window_controls)
 * - Fades out on outro → complete transition
 */
export const OnboardingOverlay = memo(function OnboardingOverlay({
	children,
}: OnboardingOverlayProps) {
	const isOnboarding = useOnboardingStore(selectIsOnboarding);
	const prefersReducedMotion = useReducedMotion();

	const fadeDuration = prefersReducedMotion
		? ONBOARDING_TIMING.REDUCED_MOTION_DELAY / 1000
		: ONBOARDING_TIMING.GLOW_TRANSITION / 1000;

	return (
		<AnimatePresence>
			{isOnboarding && (
				<motion.div
					className="pointer-events-none fixed inset-0"
					style={{ zIndex: SPOTLIGHT_Z_INDEX.backdrop }}
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: fadeDuration, ease: "easeOut" }}
					aria-hidden="true"
				>
					{/* Dark backdrop */}
					<div className="absolute inset-0 bg-black/60" />

					{/* Tooltip/content layer */}
					{children}
				</motion.div>
			)}
		</AnimatePresence>
	);
});

export interface SpotlightGlowProps {
	/** Whether this element should be highlighted */
	isHighlighted: boolean;
	/** Optional custom glow color (defaults to theme blue) */
	glowColor?: string;
}

/**
 * Get inline styles for the spotlight glow effect.
 * Use this for elements that need dynamic highlight state.
 */
export function getSpotlightStyles(isHighlighted: boolean): React.CSSProperties {
	if (!isHighlighted) {
		return {};
	}

	return {
		position: "relative",
		zIndex: SPOTLIGHT_Z_INDEX.highlighted,
		boxShadow: "0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.3)",
		transition: "box-shadow 0.3s ease-out",
	};
}

/**
 * CSS custom properties for spotlight glow.
 * Can be used with Tailwind's arbitrary value syntax.
 */
export const SPOTLIGHT_GLOW_SHADOW =
	"0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.3)";
