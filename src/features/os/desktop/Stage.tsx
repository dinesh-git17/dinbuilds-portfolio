"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { memo, useCallback, useEffect, useRef } from "react";

import { BOOT_TIMING, ONBOARDING_TIMING, UI_REVEAL } from "@/os/boot";
import { OnboardingController, SPOTLIGHT_Z_INDEX } from "@/os/onboarding";
import {
	AppID,
	selectBootPhase,
	selectWallpaper,
	useOnboardingStore,
	useSystemStore,
} from "@/os/store";
import { useReducedMotion, WindowManager } from "@/os/window";

import { DesktopIcon } from "./DesktopIcon";
import { Dock } from "./dock";
import { useDeviceType } from "./dock/useDeviceType";
import { GridPattern } from "./GridPattern";
import { SelectionBox } from "./SelectionBox";
import { SystemBar } from "./system-bar";
import { useDesktop } from "./useDesktop";
import { useSelectionBox } from "./useSelectionBox";
import { useWallpaperSync } from "./useWallpaperSync";
import { Vignette } from "./Vignette";
import { getAnyWallpaperConfig } from "./wallpapers";
import { WeatherWidget } from "./weather";

export interface StageProps {
	/** Content rendered above the background layers (windows, dock, etc.) */
	children?: React.ReactNode;
}

/**
 * Desktop Stage — The main spatial environment container.
 *
 * Establishes the "Deep Dark" workspace aesthetic with layered
 * background effects. All windows and UI render as children.
 *
 * Structure (bottom to top):
 * 1. Solid background color
 * 2. Grid pattern overlay
 * 3. Vignette overlay
 * 4. WeatherWidget (desktop only, top-left)
 * 5. Desktop icons (folders, files)
 * 6. WindowManager (all open windows)
 * 7. SystemBar (top status bar)
 * 8. Dock (app launcher)
 * 9. Children (overlays)
 *
 * Boot Sequence:
 * - Renders "behind" the BootScreen (opacity 0) during boot
 * - Fades in when boot phase transitions to 'welcome'
 * - During 'welcome': Only wallpaper visible, functional UI hidden
 * - SystemBar and Dock animate in when phase transitions to 'complete'
 */
export const Stage = memo(function Stage({ children }: StageProps) {
	const stageRef = useRef<HTMLDivElement>(null);
	const wallpaper = useSystemStore(selectWallpaper);
	const wallpaperConfig = wallpaper ? getAnyWallpaperConfig(wallpaper) : undefined;

	// Sync wallpaper with device type (mobile vs desktop)
	useWallpaperSync();
	const bootPhase = useSystemStore(selectBootPhase);
	const prefersReducedMotion = useReducedMotion();
	const deviceType = useDeviceType();
	const isMobile = deviceType === "mobile";
	const { isSelecting, selectionBox, handlePointerDown, handlePointerMove, handlePointerUp } =
		useSelectionBox(stageRef);
	const {
		items,
		selectedItemIds,
		selectItem,
		clearSelection,
		registerIconRef,
		updateSelectionFromBox,
	} = useDesktop();

	// Check if About window is open (for triggering onboarding)
	const windows = useSystemStore((s) => s.windows);
	const isAboutOpen = windows.some((w) => w.id === AppID.About && w.status === "open");
	const hasCompletedTour = useOnboardingStore((s) => s.hasCompletedTour);

	// Stage is visible once boot enters welcome phase (wallpaper shows)
	const isDesktopVisible = bootPhase === "welcome" || bootPhase === "complete";

	// Functional UI (Dock, SystemBar, Icons, Windows) only visible after welcome
	// During 'welcome' phase: only wallpaper + vignette visible for "zero-distraction" effect
	const isUIVisible = bootPhase === "complete";

	// Track if we've started the tour to prevent re-triggering
	const tourStartedRef = useRef(false);

	// Calculate animation duration based on motion preference
	const stageFadeDuration = prefersReducedMotion
		? BOOT_TIMING.REDUCED_MOTION_DELAY / 1000
		: BOOT_TIMING.STAGE_FADE_DURATION / 1000;

	// Content reveal animation config (Desktop Icons, WeatherWidget)
	const contentAnimation = prefersReducedMotion
		? { duration: 0.05, ease: "linear" as const, delay: 0 }
		: UI_REVEAL.content;

	// Wrap the original pointer down to also clear desktop selection
	const handleStagePointerDown = useCallback(
		(e: React.PointerEvent<HTMLDivElement>) => {
			// Only clear selection if clicking directly on the stage (not on icons)
			const target = e.target as HTMLElement;
			if (!target.closest("[data-desktop-icon]")) {
				clearSelection();
			}
			handlePointerDown(e);
		},
		[clearSelection, handlePointerDown],
	);

	// Update selection when rubber-band box changes
	useEffect(() => {
		if (isSelecting && selectionBox && stageRef.current) {
			const containerRect = stageRef.current.getBoundingClientRect();
			updateSelectionFromBox(selectionBox, containerRect);
		}
	}, [isSelecting, selectionBox, updateSelectionFromBox]);

	return (
		<OnboardingController>
			{/* biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Stage orchestrates multiple UI layers */}
			{({ highlights, onGhostDragComplete, startTour }) => {
				// Trigger onboarding tour after About window opens (desktop only)
				// This runs inside the render to access startTour from the controller
				if (
					isAboutOpen &&
					!isMobile &&
					!hasCompletedTour &&
					!tourStartedRef.current &&
					bootPhase === "complete"
				) {
					tourStartedRef.current = true;
					// Delay to let the About window animation complete
					const delay = prefersReducedMotion
						? ONBOARDING_TIMING.REDUCED_MOTION_DELAY
						: ONBOARDING_TIMING.START_DELAY;
					setTimeout(() => {
						startTour();
					}, delay);
				}

				return (
					<motion.div
						ref={stageRef}
						className="relative h-screen w-screen select-none overflow-hidden bg-background"
						initial={{ opacity: 0 }}
						animate={{ opacity: isDesktopVisible ? 1 : 0 }}
						transition={{ duration: stageFadeDuration, ease: "easeOut" }}
						onPointerDown={handleStagePointerDown}
						onPointerMove={handlePointerMove}
						onPointerUp={handlePointerUp}
						onPointerCancel={handlePointerUp}
					>
						{/* Background layers */}
						{wallpaper ? (
							<Image
								src={wallpaper}
								alt=""
								fill
								priority
								quality={85}
								sizes="100vw"
								className="pointer-events-none object-cover"
								aria-hidden="true"
								placeholder={wallpaperConfig?.blurDataURL ? "blur" : "empty"}
								blurDataURL={wallpaperConfig?.blurDataURL}
							/>
						) : (
							<GridPattern />
						)}
						<Vignette />

						{/* Weather widget layer (desktop only, top-left) — animated entrance */}
						{isUIVisible && (
							<motion.div
								className="absolute top-14 left-6 z-[1] hidden lg:block"
								initial={{
									opacity: 0,
									scale: contentAnimation === UI_REVEAL.content ? UI_REVEAL.content.scale.from : 1,
								}}
								animate={{ opacity: 1, scale: 1 }}
								transition={{
									duration: contentAnimation.duration,
									ease: contentAnimation.ease,
									delay: contentAnimation.delay,
								}}
							>
								<WeatherWidget />
							</motion.div>
						)}

						{/* Desktop icons layer (above background, below windows) — animated entrance */}
						{isUIVisible && (
							<motion.section
								className="pointer-events-none absolute inset-0 pt-12 pr-4"
								aria-label="Desktop"
								style={{
									zIndex: highlights.desktopIcons ? SPOTLIGHT_Z_INDEX.highlighted : 1,
								}}
								initial={{
									opacity: 0,
									scale: contentAnimation === UI_REVEAL.content ? UI_REVEAL.content.scale.from : 1,
								}}
								animate={{ opacity: 1, scale: 1 }}
								transition={{
									duration: contentAnimation.duration,
									ease: contentAnimation.ease,
									delay: contentAnimation.delay,
								}}
							>
								<div className="ml-auto flex flex-col items-end gap-2">
									{items.map((item) => (
										<DesktopIcon
											key={item.id}
											appId={item.appId}
											label={item.label}
											iconType={item.iconType}
											folderId={item.folderId}
											contentUrl={item.contentUrl}
											title={item.title}
											isSelected={selectedItemIds.has(item.id)}
											onSelect={() => selectItem(item.id)}
											onExecute={clearSelection}
											onRegisterRef={(el) => registerIconRef(item.id, el)}
											isHighlighted={highlights.desktopIcons}
										/>
									))}
								</div>
							</motion.section>
						)}

						{/* Selection box layer — hidden during welcome */}
						{isUIVisible && isSelecting && selectionBox && <SelectionBox box={selectionBox} />}

						{/* Window layer — hidden during welcome */}
						{isUIVisible && (
							<WindowManager
								onboardingHighlights={highlights}
								onGhostDragComplete={onGhostDragComplete}
							/>
						)}

						{/* System UI — hidden during welcome, animated entrance on complete */}
						<SystemBar isBooting={!isUIVisible} />
						<Dock isBooting={!isUIVisible} isHighlighted={highlights.dock} />

						{/* Additional UI layers */}
						{children && <div className="relative z-10 h-full w-full">{children}</div>}
					</motion.div>
				);
			}}
		</OnboardingController>
	);
});
