"use client";

import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { memo, useCallback, useRef, useState } from "react";

import { useReducedMotion } from "@/os/window";

import type { NotificationInstance } from "../store/types";

export interface NotificationPillProps {
	/** The notification to display */
	notification: NotificationInstance;
	/** Callback when the notification is dismissed (via close button, swipe, or timeout) */
	onDismiss: () => void;
	/** Whether we're on mobile (passed from parent for SSR consistency) */
	isMobile: boolean;
}

/**
 * Desktop spring configuration for slide-in animation.
 * High stiffness for snappy feel, moderate damping to prevent overshoot.
 */
const DESKTOP_SPRING = {
	type: "spring" as const,
	stiffness: 300,
	damping: 28,
};

/**
 * Mobile spring configuration for slide-down animation.
 * Slightly softer for a more playful feel.
 */
const MOBILE_SPRING = {
	type: "spring" as const,
	stiffness: 280,
	damping: 26,
};

/**
 * Swipe offset threshold to trigger dismiss on mobile.
 * Negative because swipe up = negative y offset.
 */
const SWIPE_OFFSET_THRESHOLD = -30;

/**
 * NotificationPill — Glass Pill Notification Component
 *
 * A premium, glassmorphic notification that adapts to device type:
 *
 * Desktop:
 * - Slides in from the right
 * - Hover reveals a circular close button (macOS style)
 * - Top-right positioning (handled by parent)
 *
 * Mobile:
 * - Slides down from the top (Dynamic Island style)
 * - Swipe up to dismiss with elastic physics
 * - Top-center positioning (handled by parent)
 *
 * Respects prefers-reduced-motion by disabling animations.
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Component manages desktop/mobile variants with distinct animation and interaction patterns
export const NotificationPill = memo(function NotificationPill({
	notification,
	onDismiss,
	isMobile,
}: NotificationPillProps) {
	const prefersReducedMotion = useReducedMotion();

	// Desktop: track hover state for close button reveal
	const [isHovered, setIsHovered] = useState(false);

	// Track if we've already triggered dismiss to prevent double-firing
	const isDismissingRef = useRef(false);

	// Mobile: detect swipe-up gesture during drag and dismiss immediately
	const handleDrag = useCallback(
		(_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
			// If swiped up past threshold, dismiss immediately
			if (info.offset.y < SWIPE_OFFSET_THRESHOLD && !isDismissingRef.current) {
				isDismissingRef.current = true;
				onDismiss();
			}
		},
		[onDismiss],
	);

	// Animation variants based on device type
	const variants = {
		initial: prefersReducedMotion
			? { opacity: 0 }
			: isMobile
				? { y: -80, opacity: 0 }
				: { x: 100, opacity: 0 },
		animate: prefersReducedMotion
			? { opacity: 1 }
			: isMobile
				? { y: 0, opacity: 1 }
				: { x: 0, opacity: 1 },
		exit: prefersReducedMotion
			? { opacity: 0 }
			: isMobile
				? { y: -80, opacity: 0 }
				: { x: 100, opacity: 0 },
	};

	const springConfig = isMobile ? MOBILE_SPRING : DESKTOP_SPRING;

	return (
		<motion.div
			role="alert"
			aria-live="polite"
			className={`
				relative flex items-start gap-3
				rounded-2xl border border-white/15 bg-black/60 backdrop-blur-xl
				shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.05)]
				${isMobile ? "mx-4 w-[calc(100%-32px)] max-w-md px-4 py-3" : "min-w-[280px] max-w-sm px-4 py-3"}
			`}
			variants={variants}
			initial="initial"
			animate="animate"
			exit="exit"
			transition={springConfig}
			// Mobile: enable drag to detect swipe gesture, dismiss on threshold
			drag={isMobile ? "y" : false}
			dragConstraints={{ top: 0, bottom: 0 }}
			dragElastic={0.5}
			onDrag={isMobile ? handleDrag : undefined}
			// Desktop: track hover for close button
			onHoverStart={() => !isMobile && setIsHovered(true)}
			onHoverEnd={() => !isMobile && setIsHovered(false)}
		>
			{/* Content */}
			<div className="flex-1 min-w-0">
				<p className="font-medium text-sm text-white/90 leading-tight">
					{notification.content.title}
				</p>
				{notification.content.message && (
					<p className="mt-0.5 text-xs text-white/50 leading-snug">
						{notification.content.message}
					</p>
				)}
			</div>

			{/* Desktop: Hover-reveal close button (macOS style) */}
			{!isMobile && (
				<AnimatePresence>
					{isHovered && (
						<motion.button
							type="button"
							onClick={onDismiss}
							className={`
								absolute -top-1.5 -left-1.5 flex h-5 w-5 items-center justify-center
								rounded-full bg-white/10 border border-white/20
								text-white/60 hover:bg-white/20 hover:text-white/90
								transition-colors duration-150
							`}
							initial={{ opacity: 0, scale: 0.8 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.8 }}
							transition={{ duration: 0.15, ease: "easeOut" }}
							aria-label="Dismiss notification"
						>
							<svg
								width="10"
								height="10"
								viewBox="0 0 10 10"
								fill="none"
								stroke="currentColor"
								strokeWidth="1.5"
								strokeLinecap="round"
								aria-hidden="true"
							>
								<path d="M2 2l6 6M8 2l-6 6" />
							</svg>
						</motion.button>
					)}
				</AnimatePresence>
			)}

			{/* Mobile: Swipe indicator pill */}
			{isMobile && (
				<div className="absolute top-1 left-1/2 -translate-x-1/2">
					<div className="h-1 w-8 rounded-full bg-white/20" aria-hidden="true" />
				</div>
			)}
		</motion.div>
	);
});
