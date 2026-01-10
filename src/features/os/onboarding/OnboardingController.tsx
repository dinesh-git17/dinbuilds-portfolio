"use client";

import { AnimatePresence, motion, type Variants } from "framer-motion";
import { memo, useCallback } from "react";

import { AnalyticsEvent, trackEvent } from "@/lib/analytics";
import { ONBOARDING_STEP_TIMING, ONBOARDING_TIMING } from "@/os/boot";
import { useDeviceType } from "@/os/desktop/dock/useDeviceType";
import type { OnboardingStep } from "@/os/store";
import { useReducedMotion } from "@/os/window";

import { OnboardingOverlay, SPOTLIGHT_Z_INDEX } from "./OnboardingOverlay";
import {
	type OnboardingHighlights,
	type OnboardingTooltip,
	useOnboardingOrchestrator,
} from "./useOnboardingOrchestrator";

export interface OnboardingControllerProps {
	/** Render prop to pass highlight states to children */
	children: (props: OnboardingControllerRenderProps) => React.ReactNode;
}

export interface OnboardingControllerRenderProps {
	/** Highlight states for each target */
	highlights: OnboardingHighlights;
	/** Callback for when ghost drag completes */
	onGhostDragComplete: () => void;
	/** Start the tour (call after About app animation) */
	startTour: () => void;
}

/**
 * Get position classes for tooltip based on position hint and device type.
 * Mobile positions are optimized for 375px screens to prevent clipping.
 */
function getTooltipPositionClasses(
	position: OnboardingTooltip["position"],
	isMobile: boolean,
): string {
	if (isMobile) {
		// Mobile-optimized positions centered horizontally with safe margins
		const mobilePositions = {
			// Below window controls - centered, safe distance from top
			bottom: "top-24 left-1/2 -translate-x-1/2",
			// Above dock - centered, positioned above dock with padding
			top: "bottom-28 left-1/2 -translate-x-1/2",
			// Left of desktop icons - centered vertically, pulled in from edge
			left: "right-4 top-1/3 -translate-y-1/2",
			// Right side (unused on mobile, but defined for completeness)
			right: "left-4 top-1/2 -translate-y-1/2",
			// Center of screen
			center: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
			// Above window - positioned for mobile window frame
			"above-window": "top-28 left-1/2 -translate-x-1/2",
		};
		return mobilePositions[position];
	}

	// Desktop positions - more space available
	const desktopPositions = {
		top: "bottom-24 left-1/2 -translate-x-1/2",
		bottom: "top-20 left-20",
		left: "right-28 top-[38%] -translate-y-1/2",
		right: "left-28 top-1/2 -translate-y-1/2",
		center: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
		"above-window": "top-[18%] left-1/2 -translate-x-1/2",
	};
	return desktopPositions[position];
}

/**
 * Tooltip component for onboarding steps.
 * Responsive positioning for mobile (375px) and desktop screens.
 */
const OnboardingTooltipDisplay = memo(function OnboardingTooltipDisplay({
	tooltip,
	step,
	isMobile,
}: {
	tooltip: OnboardingTooltip;
	step: string;
	isMobile: boolean;
}) {
	const reducedMotion = useReducedMotion();

	if (!tooltip.visible || step === "outro") {
		return null;
	}

	const positionClasses = getTooltipPositionClasses(tooltip.position, isMobile);

	return (
		<motion.div
			className={`fixed ${positionClasses} pointer-events-none px-4`}
			style={{ zIndex: SPOTLIGHT_Z_INDEX.highlighted + 10 }}
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -10 }}
			transition={{
				duration: reducedMotion ? 0.05 : ONBOARDING_TIMING.GLOW_TRANSITION / 1000,
				ease: "easeOut",
			}}
		>
			<div className="rounded-lg bg-black/80 px-4 py-2 backdrop-blur-sm border border-white/10 max-w-[calc(100vw-2rem)]">
				<p className="font-mono text-sm text-white/90 text-center">{tooltip.text}</p>
			</div>
		</motion.div>
	);
});

/**
 * Outro message displayed at the end of the tour.
 */
const OnboardingOutro = memo(function OnboardingOutro({ visible }: { visible: boolean }) {
	const reducedMotion = useReducedMotion();

	const timing = ONBOARDING_STEP_TIMING.outro;
	const fadeInDuration = reducedMotion ? 0.05 : timing.fadeInDuration / 1000;

	return (
		<AnimatePresence>
			{visible && (
				<motion.div
					className="fixed inset-0 flex items-center justify-center pointer-events-none"
					style={{ zIndex: SPOTLIGHT_Z_INDEX.highlighted + 10 }}
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0, filter: "blur(8px)" }}
					transition={{ duration: fadeInDuration, ease: "easeOut" }}
				>
					<motion.h1
						className="font-mono text-3xl md:text-4xl text-white/90 text-center"
						initial={{ scale: 0.9, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						exit={{ scale: 1.1, opacity: 0, filter: "blur(8px)" }}
						transition={{
							duration: fadeInDuration,
							ease: "easeOut",
						}}
					>
						Have fun exploring.
					</motion.h1>
				</motion.div>
			)}
		</AnimatePresence>
	);
});

/**
 * Z-index for skip button: above spotlight backdrop and highlighted elements.
 */
const SKIP_BUTTON_Z_INDEX = 101;

/**
 * Props for the SkipTourCapsule component.
 */
interface SkipTourCapsuleProps {
	/** Whether the button is visible */
	visible: boolean;
	/** Current onboarding step (for analytics) */
	currentStep: OnboardingStep;
	/** Current step index in the tour sequence */
	currentStepIndex: number;
	/** Tour start timestamp (for elapsed time calculation) */
	tourStartTime: number | null;
	/** Whether this is a mobile device */
	isMobile: boolean;
	/** Callback when user clicks skip */
	onSkip: () => void;
}

/**
 * Animation variants for the Skip Tour capsule.
 * Full motion: fade + slide down entrance, scale on hover/tap.
 */
const skipButtonVariants: Variants = {
	initial: { opacity: 0, y: -10 },
	animate: {
		opacity: 1,
		y: 0,
		transition: { delay: 0.2, duration: 0.3, ease: "easeOut" },
	},
	exit: {
		opacity: 0,
		y: -10,
		transition: { duration: 0.2, ease: "easeOut" },
	},
	hover: {
		scale: 1.05,
		backgroundColor: "rgba(255, 255, 255, 0.2)",
		borderColor: "rgba(255, 255, 255, 0.5)",
		transition: { duration: 0.15, ease: "easeOut" },
	},
	tap: {
		scale: 0.95,
		transition: { duration: 0.1, ease: "easeOut" },
	},
};

/**
 * Animation variants for reduced motion preference.
 * Instant state changes without animations.
 */
const skipButtonReducedVariants: Variants = {
	initial: { opacity: 1, y: 0 },
	animate: { opacity: 1, y: 0 },
	exit: { opacity: 0 },
	hover: {},
	tap: {},
};

/**
 * SkipTourCapsule — Glassmorphic "Skip Tour" button.
 *
 * A prominent, accessible skip button that empowers users to exit
 * the onboarding tour at any time. Designed to be immediately
 * recognizable as interactive.
 *
 * Visual Design:
 * - Pill/capsule shape with glassmorphic styling
 * - Positioned top-right, above all onboarding elements
 * - Clear "Skip Tour" text (not just an icon)
 *
 * Motion:
 * - Entrance: Fade + slide down with 200ms delay
 * - Hover: Scale up 1.05, brighter border/background
 * - Tap: Scale down 0.95
 *
 * Accessibility:
 * - Respects prefers-reduced-motion
 * - Keyboard focusable with visible ring
 * - ARIA label for screen readers
 * - 44px min-height on mobile for touch targets
 */
const SkipTourCapsule = memo(function SkipTourCapsule({
	visible,
	currentStep,
	currentStepIndex,
	tourStartTime,
	isMobile,
	onSkip,
}: SkipTourCapsuleProps) {
	const reducedMotion = useReducedMotion();

	const handleSkip = useCallback(() => {
		// Calculate elapsed time since tour started
		const elapsedMs = tourStartTime ? Date.now() - tourStartTime : 0;

		// Fire analytics event
		trackEvent(AnalyticsEvent.TOUR_SKIPPED, {
			skipped_at_step: currentStep,
			step_index: currentStepIndex,
			elapsed_ms: elapsedMs,
		});

		// Execute skip action
		onSkip();
	}, [currentStep, currentStepIndex, tourStartTime, onSkip]);

	const variants = reducedMotion ? skipButtonReducedVariants : skipButtonVariants;

	// Position classes: safe from notch on mobile
	const positionClasses = isMobile
		? "fixed top-14 right-4" // Below status bar/notch area
		: "fixed top-6 right-6";

	// Size classes: 44px min-height on mobile for touch targets
	const sizeClasses = isMobile ? "min-h-[44px] px-4 py-2.5" : "px-4 py-2";

	return (
		<AnimatePresence>
			{visible && (
				<motion.button
					type="button"
					onClick={handleSkip}
					className={`
						${positionClasses}
						${sizeClasses}
						rounded-full
						bg-white/10 backdrop-blur-md
						border border-white/20
						text-sm text-white/80
						font-sans
						pointer-events-auto
						focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50
					`}
					style={{ zIndex: SKIP_BUTTON_Z_INDEX }}
					variants={variants}
					initial="initial"
					animate="animate"
					exit="exit"
					whileHover={reducedMotion ? undefined : "hover"}
					whileTap={reducedMotion ? undefined : "tap"}
					aria-label="Skip onboarding tour"
				>
					Skip Tour
				</motion.button>
			)}
		</AnimatePresence>
	);
});

/**
 * OnboardingController — Orchestrates the desktop onboarding tour.
 *
 * This component manages the entire "Ghost in the Machine" onboarding experience:
 * - Renders the backdrop overlay
 * - Displays tooltips for each step
 * - Shows the outro message
 * - Provides highlight states to child components via render prop
 *
 * @example
 * ```tsx
 * <OnboardingController>
 *   {({ highlights, onGhostDragComplete, startTour }) => (
 *     <>
 *       <WindowFrame
 *         isControlsHighlighted={highlights.windowControls}
 *         isHeaderHighlighted={highlights.windowHeader}
 *         shouldGhostDrag={highlights.shouldGhostDrag}
 *         onGhostDragComplete={onGhostDragComplete}
 *       />
 *       <Dock isHighlighted={highlights.dock} />
 *       <DesktopIcon isHighlighted={highlights.desktopIcons} />
 *     </>
 *   )}
 * </OnboardingController>
 * ```
 */
export const OnboardingController = memo(function OnboardingController({
	children,
}: OnboardingControllerProps) {
	const {
		isActive,
		currentStep,
		currentStepIndex,
		tourStartTime,
		highlights,
		tooltip,
		skipTour,
		startTour,
		onGhostDragComplete,
	} = useOnboardingOrchestrator();

	const deviceType = useDeviceType();
	const isMobile = deviceType === "mobile";

	// Show skip button during active steps (not during outro)
	const showSkipButton = isActive && currentStep !== "outro";

	return (
		<>
			{/* Render children with highlight states */}
			{children({ highlights, onGhostDragComplete, startTour })}

			{/* Dark backdrop overlay */}
			<OnboardingOverlay />

			{/* Tooltip - rendered outside overlay to escape its stacking context */}
			<AnimatePresence mode="wait">
				{isActive && currentStep !== "outro" && (
					<OnboardingTooltipDisplay
						key={currentStep}
						tooltip={tooltip}
						step={currentStep}
						isMobile={isMobile}
					/>
				)}
			</AnimatePresence>

			{/* Outro message */}
			<OnboardingOutro visible={currentStep === "outro"} />

			{/* Skip Tour capsule */}
			<SkipTourCapsule
				visible={showSkipButton}
				currentStep={currentStep}
				currentStepIndex={currentStepIndex}
				tourStartTime={tourStartTime}
				isMobile={isMobile}
				onSkip={skipTour}
			/>
		</>
	);
});
