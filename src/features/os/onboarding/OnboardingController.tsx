"use client";

import { AnimatePresence, motion } from "framer-motion";
import { memo } from "react";

import { ONBOARDING_STEP_TIMING, ONBOARDING_TIMING } from "@/os/boot";
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
 * Tooltip component for onboarding steps.
 */
const OnboardingTooltipDisplay = memo(function OnboardingTooltipDisplay({
	tooltip,
	step,
}: {
	tooltip: OnboardingTooltip;
	step: string;
}) {
	const reducedMotion = useReducedMotion();

	if (!tooltip.visible || step === "outro") {
		return null;
	}

	// Position classes based on tooltip.position
	const positionClasses = {
		top: "bottom-24 left-1/2 -translate-x-1/2",
		bottom: "top-20 left-20",
		left: "right-28 top-1/2 -translate-y-1/2",
		right: "left-28 top-1/2 -translate-y-1/2",
		center: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
		"above-window": "top-[18%] left-1/2 -translate-x-1/2",
	};

	return (
		<motion.div
			className={`fixed ${positionClasses[tooltip.position]} pointer-events-none`}
			style={{ zIndex: SPOTLIGHT_Z_INDEX.highlighted + 10 }}
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -10 }}
			transition={{
				duration: reducedMotion ? 0.05 : ONBOARDING_TIMING.GLOW_TRANSITION / 1000,
				ease: "easeOut",
			}}
		>
			<div className="rounded-lg bg-black/80 px-4 py-2 backdrop-blur-sm border border-white/10">
				<p className="font-mono text-sm text-white/90">{tooltip.text}</p>
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
					className="fixed bottom-6 right-6 rounded-full bg-white/10 px-4 py-2 font-mono text-xs text-white/60 backdrop-blur-sm border border-white/10 hover:bg-white/20 hover:text-white/80 transition-colors pointer-events-auto"
					style={{ zIndex: SPOTLIGHT_Z_INDEX.highlighted + 10 }}
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: 20 }}
					transition={{
						duration: reducedMotion ? 0.05 : 0.3,
						ease: "easeOut",
					}}
					aria-label="Skip onboarding tour"
				>
					Skip tour
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
					<OnboardingTooltipDisplay key={currentStep} tooltip={tooltip} step={currentStep} />
				)}
			</AnimatePresence>

			{/* Outro message */}
			<OnboardingOutro visible={currentStep === "outro"} />

			{/* Skip button */}
			<SkipButton visible={showSkipButton} onSkip={skipTour} />
		</>
	);
});
