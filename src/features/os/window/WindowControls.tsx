"use client";

import clsx from "clsx";
import { motion } from "framer-motion";
import { memo, useCallback } from "react";

import { ONBOARDING_TIMING } from "@/os/boot";
import { SPOTLIGHT_Z_INDEX } from "@/os/onboarding";
import { type AppID, selectIsWindowFullscreen, useSystemStore } from "@/os/store";
import { useReducedMotion } from "@/os/window";

export interface WindowControlsProps {
	/** Window identifier for store actions */
	windowId: AppID;
	/** Whether controls are highlighted during onboarding */
	isHighlighted?: boolean;
}

/**
 * macOS-style window control buttons.
 * Close (red), Minimize (yellow), Fullscreen (green).
 *
 * Buttons are keyboard accessible with proper ARIA labels.
 * Supports spotlight highlighting during onboarding tour.
 */
export const WindowControls = memo(function WindowControls({
	windowId,
	isHighlighted = false,
}: WindowControlsProps) {
	const closeWindow = useSystemStore((s) => s.closeWindow);
	const minimizeWindow = useSystemStore((s) => s.minimizeWindow);
	const toggleFullscreen = useSystemStore((s) => s.toggleFullscreen);
	const isFullscreen = useSystemStore(selectIsWindowFullscreen(windowId));
	const prefersReducedMotion = useReducedMotion();

	const handleClose = useCallback(
		(e: React.MouseEvent | React.KeyboardEvent) => {
			e.stopPropagation();
			closeWindow(windowId);
		},
		[closeWindow, windowId],
	);

	const handleMinimize = useCallback(
		(e: React.MouseEvent | React.KeyboardEvent) => {
			e.stopPropagation();
			minimizeWindow(windowId);
		},
		[minimizeWindow, windowId],
	);

	const handleFullscreen = useCallback(
		(e: React.MouseEvent | React.KeyboardEvent) => {
			e.stopPropagation();
			toggleFullscreen(windowId);
		},
		[toggleFullscreen, windowId],
	);

	// Animation duration for glow effect
	const glowDuration = prefersReducedMotion
		? ONBOARDING_TIMING.REDUCED_MOTION_DELAY / 1000
		: ONBOARDING_TIMING.GLOW_TRANSITION / 1000;

	return (
		<motion.fieldset
			className={clsx(
				"flex items-center gap-2 border-none p-0 rounded-full",
				isHighlighted && "px-1.5 py-1 -mx-1.5 -my-1",
			)}
			aria-label="Window controls"
			animate={{
				boxShadow: isHighlighted
					? "0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.3)"
					: "0 0 0px rgba(59, 130, 246, 0)",
			}}
			style={{
				position: isHighlighted ? "relative" : undefined,
				zIndex: isHighlighted ? SPOTLIGHT_Z_INDEX.highlighted : undefined,
			}}
			transition={{ duration: glowDuration, ease: "easeOut" }}
		>
			{/* Close */}
			<button
				type="button"
				onClick={handleClose}
				onKeyDown={(e) => e.key === "Enter" && handleClose(e)}
				className="group relative h-3 w-3 rounded-full bg-[#ff5f57] transition-colors hover:bg-[#ff3b30] focus:outline-none focus:ring-2 focus:ring-[#ff5f57]/50"
				aria-label="Close window"
			>
				<span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-black/0 transition-colors group-hover:text-black/80">
					×
				</span>
			</button>

			{/* Minimize */}
			<button
				type="button"
				onClick={handleMinimize}
				onKeyDown={(e) => e.key === "Enter" && handleMinimize(e)}
				className="group relative h-3 w-3 rounded-full bg-[#febc2e] transition-colors hover:bg-[#f5a623] focus:outline-none focus:ring-2 focus:ring-[#febc2e]/50"
				aria-label="Minimize window"
			>
				<span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-black/0 transition-colors group-hover:text-black/80">
					−
				</span>
			</button>

			{/* Fullscreen */}
			<button
				type="button"
				onClick={handleFullscreen}
				onKeyDown={(e) => e.key === "Enter" && handleFullscreen(e)}
				className="group relative h-3 w-3 rounded-full bg-[#28c840] transition-colors hover:bg-[#1fb636] focus:outline-none focus:ring-2 focus:ring-[#28c840]/50"
				aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
			>
				<span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-black/0 transition-colors group-hover:text-black/80">
					{isFullscreen ? "−" : "+"}
				</span>
			</button>
		</motion.fieldset>
	);
});
