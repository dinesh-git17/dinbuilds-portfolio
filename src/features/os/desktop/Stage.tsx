"use client";

import { memo } from "react";

import { WindowManager } from "@/os/window";

import { Dock } from "./dock";
import { GridPattern } from "./GridPattern";
import { SystemBar } from "./system-bar";
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
	return (
		<div className="relative h-screen w-screen overflow-hidden bg-background">
			{/* Background layers */}
			<GridPattern />
			<Vignette />

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
