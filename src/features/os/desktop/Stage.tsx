"use client";

import { memo, useRef } from "react";

import { WindowManager } from "@/os/window";

import { Dock } from "./dock";
import { GridPattern } from "./GridPattern";
import { SelectionBox } from "./SelectionBox";
import { SystemBar } from "./system-bar";
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
	const { isSelecting, selectionBox, handlePointerDown, handlePointerMove, handlePointerUp } =
		useSelectionBox(stageRef);

	return (
		<div
			ref={stageRef}
			className="relative h-screen w-screen overflow-hidden bg-background"
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerUp}
			onPointerCancel={handlePointerUp}
		>
			{/* Background layers */}
			<GridPattern />
			<Vignette />

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
