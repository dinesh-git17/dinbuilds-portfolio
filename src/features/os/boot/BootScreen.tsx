"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { memo } from "react";

import { selectBootPhase, useSystemStore } from "@/os/store";
import { useReducedMotion } from "@/os/window";

import { BOOT_TIMING } from "./constants";

/**
 * BootScreen — System initialization display.
 *
 * The initial loading view shown during system boot.
 * Displays a centered logo with pulse animation and
 * a progress bar that fills during the boot sequence.
 *
 * Visibility:
 * - Shows during 'hidden' and 'booting' phases
 * - Fades out when transitioning to 'welcome' phase
 *
 * Z-Index: 50 (above everything except modals)
 */
export const BootScreen = memo(function BootScreen() {
	const bootPhase = useSystemStore(selectBootPhase);
	const prefersReducedMotion = useReducedMotion();

	// Visible during hidden and booting phases
	const isVisible = bootPhase === "hidden" || bootPhase === "booting";
	// Progress bar should animate when booting
	const isBooting = bootPhase === "booting";

	// Calculate timing based on motion preference
	const bootDuration = prefersReducedMotion
		? BOOT_TIMING.REDUCED_MOTION_DELAY
		: BOOT_TIMING.BOOT_DURATION;

	const fadeOutDuration = prefersReducedMotion
		? BOOT_TIMING.REDUCED_MOTION_DELAY / 1000
		: BOOT_TIMING.FADE_OUT_DURATION / 1000;

	return (
		<AnimatePresence>
			{isVisible && (
				<motion.div
					className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black"
					initial={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: fadeOutDuration, ease: "easeOut" }}
					aria-label="System loading"
					role="status"
				>
					{/* Logo with pulse animation */}
					<motion.div
						className="relative mb-12"
						animate={
							isBooting && !prefersReducedMotion
								? {
										scale: [1, 1.05, 1],
										opacity: [0.8, 1, 0.8],
									}
								: { scale: 1, opacity: 1 }
						}
						transition={
							isBooting && !prefersReducedMotion
								? {
										duration: 2,
										repeat: Number.POSITIVE_INFINITY,
										ease: "easeInOut",
									}
								: undefined
						}
					>
						<Image
							src="/assets/task_bar/task_bar_logo.png"
							alt="DinBuilds OS"
							width={80}
							height={80}
							className="h-20 w-auto object-contain"
							priority
						/>
					</motion.div>

					{/* Progress bar container */}
					<div className="relative h-0.5 w-48 overflow-hidden rounded-full bg-white/10">
						{/* Progress bar fill */}
						<motion.div
							className="absolute inset-y-0 left-0 bg-white"
							initial={{ width: "0%" }}
							animate={isBooting ? { width: "100%" } : { width: "0%" }}
							transition={
								isBooting
									? {
											duration: bootDuration / 1000,
											ease: "linear",
										}
									: { duration: 0 }
							}
						/>
					</div>

					{/* Screen reader status */}
					<span className="sr-only">
						{isBooting ? "Loading system..." : "Preparing to start..."}
					</span>
				</motion.div>
			)}
		</AnimatePresence>
	);
});
