"use client";

import { memo, useCallback } from "react";

import { type AppID, selectIsWindowFullscreen, useSystemStore } from "@/os/store";

export interface WindowControlsProps {
	/** Window identifier for store actions */
	windowId: AppID;
}

/**
 * macOS-style window control buttons.
 * Close (red), Minimize (yellow), Fullscreen (green).
 *
 * Buttons are keyboard accessible with proper ARIA labels.
 */
export const WindowControls = memo(function WindowControls({ windowId }: WindowControlsProps) {
	const closeWindow = useSystemStore((s) => s.closeWindow);
	const minimizeWindow = useSystemStore((s) => s.minimizeWindow);
	const toggleFullscreen = useSystemStore((s) => s.toggleFullscreen);
	const isFullscreen = useSystemStore(selectIsWindowFullscreen(windowId));

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

	return (
		<fieldset className="flex items-center gap-2 border-none p-0" aria-label="Window controls">
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
		</fieldset>
	);
});
