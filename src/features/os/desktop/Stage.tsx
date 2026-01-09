"use client";

import Image from "next/image";
import { memo, useCallback, useEffect, useRef } from "react";

import { selectWallpaper, useSystemStore } from "@/os/store";
import { WindowManager } from "@/os/window";

import { DesktopIcon } from "./DesktopIcon";
import { Dock } from "./dock";
import { GridPattern } from "./GridPattern";
import { SelectionBox } from "./SelectionBox";
import { SystemBar } from "./system-bar";
import { useDesktop } from "./useDesktop";
import { useSelectionBox } from "./useSelectionBox";
import { Vignette } from "./Vignette";

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
 * 4. WindowManager (all open windows)
 * 5. SystemBar (top status bar)
 * 6. Dock (app launcher)
 * 7. Children (overlays)
 */
export const Stage = memo(function Stage({ children }: StageProps) {
	const stageRef = useRef<HTMLDivElement>(null);
	const wallpaper = useSystemStore(selectWallpaper);
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
		<div
			ref={stageRef}
			className="relative h-screen w-screen select-none overflow-hidden bg-background"
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
					quality={90}
					sizes="100vw"
					className="pointer-events-none object-cover"
					aria-hidden="true"
				/>
			) : (
				<GridPattern />
			)}
			<Vignette />

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
							folderId={item.folderId}
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

			{/* System UI */}
			<SystemBar />
			<Dock />

			{/* Additional UI layers */}
			{children && <div className="relative z-10 h-full w-full">{children}</div>}
		</div>
	);
});
