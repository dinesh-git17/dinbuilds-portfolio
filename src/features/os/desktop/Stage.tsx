"use client";

import { memo } from "react";

import { WindowManager } from "@/os/window";

import { Dock } from "./dock";
import { GridPattern } from "./GridPattern";
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
 * 5. Dock (app launcher)
 * 6. Children (overlays)
 */
export const Stage = memo(function Stage({ children }: StageProps) {
	return (
		<div className="relative h-screen w-screen overflow-hidden bg-background">
			{/* Background layers */}
			<GridPattern />
			<Vignette />

			{/* Window layer */}
			<WindowManager />

			{/* Dock */}
			<Dock />

			{/* Additional UI layers */}
			{children && <div className="relative z-10 h-full w-full">{children}</div>}
		</div>
	);
});
