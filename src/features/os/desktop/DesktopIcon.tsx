"use client";

import { motion, useAnimation } from "framer-motion";
import { Folder } from "lucide-react";
import { memo, useCallback, useRef } from "react";

import { type AppID, useSystemStore } from "@/os/store";

export interface DesktopIconProps {
	/** App ID to launch on double-click */
	appId: AppID;
	/** Display label shown under the icon */
	label: string;
	/** Folder ID for VFS lookup (passed to FolderApp) */
	folderId?: string;
	/** Whether this icon is currently selected */
	isSelected: boolean;
	/** Callback when icon is single-clicked (for selection) */
	onSelect: () => void;
	/** Callback when icon is double-clicked (to clear selection) */
	onExecute: () => void;
	/** Callback to register the button ref for intersection testing */
	onRegisterRef?: (element: HTMLButtonElement | null) => void;
}

/**
 * DesktopIcon — Clickable folder icon for the desktop.
 *
 * Interactions:
 * - Single click: Selects the icon (visual highlight)
 * - Double click: Pulse animation + launches the app
 *
 * Styled like macOS Finder icons with selection state
 * and text shadow for visibility against any wallpaper.
 */
export const DesktopIcon = memo(function DesktopIcon({
	appId,
	label,
	folderId,
	isSelected,
	onSelect,
	onExecute,
	onRegisterRef,
}: DesktopIconProps) {
	const launchApp = useSystemStore((s) => s.launchApp);

	const launchWithProps = useCallback(() => {
		launchApp(appId, folderId ? { props: { folderId } } : undefined);
	}, [appId, folderId, launchApp]);
	const controls = useAnimation();
	const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const clickCountRef = useRef(0);

	// Combined ref callback for both internal use and registration
	const buttonRefCallback = useCallback(
		(element: HTMLButtonElement | null) => {
			onRegisterRef?.(element);
		},
		[onRegisterRef],
	);

	const handleClick = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			clickCountRef.current += 1;

			if (clickCountRef.current === 1) {
				// First click: select the icon
				onSelect();

				// Set timeout to reset click count
				clickTimeoutRef.current = setTimeout(() => {
					clickCountRef.current = 0;
				}, 300);
			} else if (clickCountRef.current === 2) {
				// Double click: clear timeout and execute
				if (clickTimeoutRef.current) {
					clearTimeout(clickTimeoutRef.current);
					clickTimeoutRef.current = null;
				}
				clickCountRef.current = 0;

				// Clear selection before launching
				onExecute();

				// Play pulse animation then launch
				controls.start({
					scale: [1, 0.92, 1.02, 1],
					transition: {
						duration: 0.3,
						times: [0, 0.3, 0.7, 1],
						ease: "easeOut",
					},
				});

				// Launch app after short delay for animation feedback
				setTimeout(() => {
					launchWithProps();
				}, 100);
			}
		},
		[controls, launchWithProps, onSelect, onExecute],
	);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				// Clear selection before launching
				onExecute();
				// Keyboard activation acts as double-click
				controls.start({
					scale: [1, 0.92, 1.02, 1],
					transition: {
						duration: 0.3,
						times: [0, 0.3, 0.7, 1],
						ease: "easeOut",
					},
				});
				setTimeout(() => {
					launchWithProps();
				}, 100);
			}
		},
		[controls, launchWithProps, onExecute],
	);

	return (
		<motion.button
			ref={buttonRefCallback}
			type="button"
			onClick={handleClick}
			onKeyDown={handleKeyDown}
			animate={controls}
			whileHover={{ scale: 1.02 }}
			whileTap={{ scale: 0.98 }}
			className="pointer-events-auto group flex w-20 flex-col items-center gap-1.5 rounded-lg p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
			aria-label={`Open ${label} folder`}
			aria-pressed={isSelected}
			data-desktop-icon
		>
			{/* Folder icon */}
			<div
				className={`
					flex h-14 w-14 items-center justify-center rounded-lg
					transition-all duration-150
					${isSelected ? "bg-white/10" : "bg-transparent group-hover:bg-white/5"}
				`}
			>
				<Folder
					className={`
						h-10 w-10 transition-colors duration-150
						${isSelected ? "text-blue-400" : "text-yellow-400/80 group-hover:text-yellow-400"}
					`}
					strokeWidth={1.5}
					fill={isSelected ? "rgba(96, 165, 250, 0.15)" : "rgba(250, 204, 21, 0.1)"}
				/>
			</div>

			{/* Label with selection highlight */}
			<span
				className={`
					whitespace-nowrap rounded px-1.5 py-0.5
					font-mono text-xs transition-colors duration-150
					${isSelected ? "bg-blue-600/80 text-white" : "text-white/90"}
				`}
				style={{
					textShadow: isSelected ? "none" : "0 1px 2px rgba(0,0,0,0.8)",
				}}
			>
				{label}
			</span>
		</motion.button>
	);
});
