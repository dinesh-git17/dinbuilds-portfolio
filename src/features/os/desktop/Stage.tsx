"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { memo, useCallback, useEffect, useRef } from "react";

import { BOOT_TIMING } from "@/os/boot";
import { selectBootPhase, selectWallpaper, useSystemStore } from "@/os/store";
import { useReducedMotion, WindowManager } from "@/os/window";

import { DesktopIcon } from "./DesktopIcon";
import { Dock } from "./dock";
import { GridPattern } from "./GridPattern";
import { SelectionBox } from "./SelectionBox";
import { SystemBar } from "./system-bar";
import { useDesktop } from "./useDesktop";
import { useSelectionBox } from "./useSelectionBox";
import { Vignette } from "./Vignette";
import { getWallpaperConfig } from "./wallpapers";
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
 * - Fades in when boot phase transitions to 'desktop_enter'
 * - SystemBar and Dock have staggered entrance (200ms after wallpaper)
 */
export const Stage = memo(function Stage({ children }: StageProps) {
	const stageRef = useRef<HTMLDivElement>(null);
	const wallpaper = useSystemStore(selectWallpaper);
	const wallpaperConfig = wallpaper ? getWallpaperConfig(wallpaper) : undefined;
	const bootPhase = useSystemStore(selectBootPhase);
	const prefersReducedMotion = useReducedMotion();
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

	// Stage is visible once boot enters desktop phase
	const isDesktopVisible = bootPhase === "desktop_enter" || bootPhase === "complete";

	// Calculate animation duration based on motion preference
	const stageFadeDuration = prefersReducedMotion
		? BOOT_TIMING.REDUCED_MOTION_DELAY / 1000
		: BOOT_TIMING.STAGE_FADE_DURATION / 1000;

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

			{/* Weather widget layer (desktop only, top-left) */}
			<div className="absolute top-14 left-6 z-[1] hidden lg:block">
				<WeatherWidget />
			</div>

			{/* Desktop icons layer (above background, below windows) */}
			<section
				className="pointer-events-none absolute inset-0 z-[1] pt-12 pr-4"
				aria-label="Desktop"
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
						/>
					))}
				</div>
			</section>

			{/* Selection box layer (z-0, above background, below windows) */}
			{isSelecting && selectionBox && <SelectionBox box={selectionBox} />}

			{/* Window layer */}
			<WindowManager />

			{/* System UI - staggered entrance during boot */}
			<SystemBar isBooting={!isDesktopVisible} />
			<Dock isBooting={!isDesktopVisible} />

			{/* Additional UI layers */}
			{children && <div className="relative z-10 h-full w-full">{children}</div>}
		</motion.div>
	);
});
