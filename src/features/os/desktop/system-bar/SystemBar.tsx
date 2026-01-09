"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { memo, useCallback } from "react";

import { BOOT_TIMING } from "@/os/boot";
import { selectIsAnyWindowFullscreen, useSystemStore } from "@/os/store";
import { useReducedMotion } from "@/os/window";

import { useDeviceType } from "../dock/useDeviceType";
import { StatusIndicators } from "./StatusIndicators";
import { SystemClock } from "./SystemClock";

export interface SystemBarProps {
	/** Optional className for additional styling */
	className?: string;
	/** Whether the system is currently booting (delays entrance animation) */
	isBooting?: boolean;
}

/**
 * SystemBar — Global status and navigation bar (macOS menu bar style).
 *
 * Provides the "ceiling" to the OS illusion with:
 * - System logo (left)
 * - Status indicators (right): Spotlight, Wifi, Battery
 * - Clock/Date display (far right)
 *
 * Features:
 * - Fixed at top, full width, above all windows (z-[60])
 * - Heavy frosted glass material (backdrop-blur-xl)
 * - Responsive height: 32px mobile, 36px desktop
 * - Mobile: Logo only, no clock/status (avoids native browser chrome conflict)
 * - Staggered entrance during boot sequence (slides in from top)
 */
export const SystemBar = memo(function SystemBar({ className, isBooting = false }: SystemBarProps) {
	const deviceType = useDeviceType();
	const isMobile = deviceType === "mobile";
	const isFullscreen = useSystemStore(selectIsAnyWindowFullscreen);
	const prefersReducedMotion = useReducedMotion();

	// Height: 32px on mobile, 36px on desktop
	const barHeight = isMobile ? 32 : 36;

	// Calculate stagger delay based on boot state and motion preference
	const staggerDelay = prefersReducedMotion ? 0 : BOOT_TIMING.UI_STAGGER_DELAY / 1000;

	// Should hide: during boot OR when fullscreen
	const shouldHide = isBooting || isFullscreen;

	// Prevent selection box from triggering when interacting with system bar
	const handlePointerDown = useCallback((e: React.PointerEvent) => {
		e.stopPropagation();
	}, []);

	return (
		<motion.header
			role="banner"
			aria-label="System status bar"
			className={`fixed top-0 left-0 z-[60] w-full ${isMobile ? "h-8" : "h-9"} ${className ?? ""}`}
			initial={{ y: -barHeight, opacity: 0 }}
			animate={{ y: shouldHide ? -barHeight : 0, opacity: shouldHide ? 0 : 1 }}
			transition={{
				type: "spring",
				stiffness: 300,
				damping: 30,
				// Stagger delay when appearing after boot, no delay when hiding
				delay: shouldHide ? 0 : staggerDelay,
			}}
			onPointerDown={handlePointerDown}
			aria-hidden={shouldHide}
		>
			{/* Glass background layer */}
			<div
				className="absolute inset-0"
				style={{
					background: "rgba(20, 20, 22, 0.72)",
					backdropFilter: "blur(12px)",
					WebkitBackdropFilter: "blur(12px)",
					borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
				}}
			/>

			{/* Content container */}
			<div
				className={`relative flex h-full items-center justify-between ${isMobile ? "px-2" : "px-3"}`}
			>
				{/* Left utility group: Logo */}
				<div className="flex items-center gap-3">
					{/* System Logo */}
					<button
						type="button"
						className="flex items-center justify-center rounded-md p-1 transition-colors hover:bg-white/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
						aria-label="Home"
					>
						<Image
							src="/assets/task_bar/task_bar_logo.png"
							alt=""
							width={28}
							height={28}
							className="h-7 w-7 object-contain"
							priority
						/>
					</button>
				</div>

				{/* Right utility group: Status indicators + Clock */}
				{!isMobile && (
					<div className="flex items-center gap-3">
						<StatusIndicators />
						<SystemClock />
					</div>
				)}
			</div>
		</motion.header>
	);
});
