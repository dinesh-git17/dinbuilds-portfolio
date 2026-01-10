"use client";

import { AnimatePresence, motion } from "framer-motion";
import { memo } from "react";

import { ONBOARDING_STEP_TIMING, ONBOARDING_TIMING } from "@/os/boot";
import { useDeviceType } from "@/os/desktop/dock/useDeviceType";
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
 * Skip button to dismiss the tour early.
 * Positioned in the top-right corner near the SystemBar for subtle presence.
 */
const SkipButton = memo(function SkipButton({
	visible,
	onSkip,
}: {
	visible: boolean;
	onSkip: () => void;
}) {
	const reducedMotion = useReducedMotion();

	return (
		<AnimatePresence>
			{visible && (
				<motion.button
					type="button"
					onClick={onSkip}
					className="fixed top-1.5 right-2 rounded px-2 py-1 font-mono text-[10px] text-white/40 hover:text-white/70 transition-colors pointer-events-auto"
					style={{ zIndex: SPOTLIGHT_Z_INDEX.highlighted + 10 }}
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{
						duration: reducedMotion ? 0.05 : 0.3,
						ease: "easeOut",
					}}
					aria-label="Skip onboarding tour"
				>
					Skip
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
	const { isActive, currentStep, highlights, tooltip, skipTour, startTour, onGhostDragComplete } =
		useOnboardingOrchestrator();

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

			{/* Skip button */}
			<SkipButton visible={showSkipButton} onSkip={skipTour} />
		</>
	);
});
