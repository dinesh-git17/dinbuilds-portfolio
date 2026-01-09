"use client";

import clsx from "clsx";
import { AnimatePresence, motion, useMotionValue } from "framer-motion";
import { memo, useCallback, useRef, useState } from "react";

import { BOOT_TIMING } from "@/os/boot";
import {
	DEFAULT_DOCK_CONFIG,
	DOCK_SIZE_MAP,
	selectDockConfig,
	selectIsAnyWindowFullscreen,
	useHasHydrated,
	useSystemStore,
} from "@/os/store";
import { useReducedMotion } from "@/os/window";

import { DockIcon } from "./DockIcon";
import { DOCK_ITEMS } from "./dock-config";
import { useDeviceType } from "./useDeviceType";

export interface DockProps {
	/** Whether the system is currently booting (delays entrance animation) */
	isBooting?: boolean;
}

/**
 * Position-based CSS classes for dock placement.
 * Note: Centering transforms are handled by Framer Motion to avoid
 * transform override conflicts between CSS and motion animations.
 */
const POSITION_CLASSES = {
	bottom: "bottom-3 left-1/2",
	left: "left-3 top-1/2",
	right: "right-3 top-1/2",
} as const;

/**
 * Animation variants for dock show/hide based on position.
 * Includes centering transforms to prevent CSS/motion transform conflicts.
 * Exit animations slide the dock out in the direction of its edge.
 * Note: Opacity is not animated to prevent backdrop-blur glitching.
 */
const getAnimationVariants = (position: "bottom" | "left" | "right", shouldHide: boolean) => {
	const hiddenOffset = 120;

	switch (position) {
		case "left":
			return {
				// y: "-50%" provides vertical centering (replaces CSS -translate-y-1/2)
				initial: { x: -hiddenOffset, y: "-50%" },
				animate: { x: shouldHide ? -hiddenOffset : 0, y: "-50%" },
				exit: { x: -hiddenOffset, y: "-50%" },
			};
		case "right":
			return {
				// y: "-50%" provides vertical centering (replaces CSS -translate-y-1/2)
				initial: { x: hiddenOffset, y: "-50%" },
				animate: { x: shouldHide ? hiddenOffset : 0, y: "-50%" },
				exit: { x: hiddenOffset, y: "-50%" },
			};
		default:
			// "bottom" position - x: "-50%" provides horizontal centering
			return {
				initial: { x: "-50%", y: hiddenOffset },
				animate: { x: "-50%", y: shouldHide ? hiddenOffset : 0 },
				exit: { x: "-50%", y: hiddenOffset },
			};
	}
};

/**
 * The Dock — macOS-style app launcher with magnification effect.
 *
 * Desktop: Configurable position (bottom/left/right) with parabolic magnification on hover.
 * Mobile: Compact pill navigation with static icons.
 *
 * Features:
 * - Framer Motion magnification based on mouse proximity
 * - Icons appear to sit on a frosted glass platform
 * - Platform naturally expands as icons magnify
 * - Keyboard navigation via arrow keys (WCAG AA)
 * - Persisted configuration (position, size, magnification)
 * - Staggered entrance during boot sequence
 */
export const Dock = memo(function Dock({ isBooting = false }: DockProps) {
	const deviceType = useDeviceType();
	const isMobile = deviceType === "mobile";
	const isFullscreen = useSystemStore(selectIsAnyWindowFullscreen);
	const hasHydrated = useHasHydrated();
	const prefersReducedMotion = useReducedMotion();

	// Get dock config from store, use defaults during SSR/hydration
	const storedConfig = useSystemStore(selectDockConfig);
	const dockConfig = hasHydrated ? storedConfig : DEFAULT_DOCK_CONFIG;

	const { position, size, magnification } = dockConfig;
	const isVertical = position === "left" || position === "right";
	const baseSize = DOCK_SIZE_MAP[size];

	const dockRef = useRef<HTMLElement>(null);
	// Track mouse X for horizontal, Y for vertical
	const mousePosition = useMotionValue(Infinity);
	// Suspend mouse tracking after click until mouse leaves dock
	const isTrackingSuspended = useRef(false);

	// Keyboard navigation state
	const [focusedIndex, setFocusedIndex] = useState<number>(-1);

	const handleMouseMove = useCallback(
		(e: React.MouseEvent) => {
			if (isMobile || !magnification || isTrackingSuspended.current) return;
			// Use clientY for vertical dock, clientX for horizontal
			mousePosition.set(isVertical ? e.clientY : e.clientX);
		},
		[isMobile, magnification, isVertical, mousePosition],
	);

	const handleMouseLeave = useCallback(() => {
		mousePosition.set(Infinity);
		setFocusedIndex(-1);
		// Re-enable tracking when mouse leaves
		isTrackingSuspended.current = false;
	}, [mousePosition]);

	const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
		const itemCount = DOCK_ITEMS.length;

		switch (e.key) {
			case "ArrowRight":
			case "ArrowDown":
				e.preventDefault();
				setFocusedIndex((prev) => (prev + 1) % itemCount);
				break;
			case "ArrowLeft":
			case "ArrowUp":
				e.preventDefault();
				setFocusedIndex((prev) => (prev - 1 + itemCount) % itemCount);
				break;
			case "Home":
				e.preventDefault();
				setFocusedIndex(0);
				break;
			case "End":
				e.preventDefault();
				setFocusedIndex(itemCount - 1);
				break;
		}
	}, []);

	const handleIconFocus = useCallback((index: number) => {
		setFocusedIndex(index);
	}, []);

	const handleIconClick = useCallback(() => {
		setFocusedIndex(-1);
		// Reset magnification and suspend tracking until mouse leaves
		mousePosition.set(Infinity);
		isTrackingSuspended.current = true;
	}, [mousePosition]);

	// Prevent selection box from triggering when interacting with dock
	const handlePointerDown = useCallback((e: React.PointerEvent) => {
		e.stopPropagation();
	}, []);

	// Reset magnification after any pointer up to catch edge cases
	const handlePointerUp = useCallback(() => {
		mousePosition.set(Infinity);
	}, [mousePosition]);

	// Platform thickness stays fixed (doesn't grow with magnification)
	// Icons grow outward from the edge, platform stays anchored
	const gap = isMobile ? 8 : 12;
	const padding = isMobile ? 8 : 12;
	const magnifyScale = 1.54; // Must match DockIcon's MAGNIFY_SCALE
	const maxIconSize = Math.round(baseSize * magnifyScale);
	const platformThickness = baseSize + padding * 2;

	// Calculate stagger delay based on boot state and motion preference
	const staggerDelay = prefersReducedMotion ? 0 : BOOT_TIMING.UI_STAGGER_DELAY / 1000;

	// Should hide: during boot OR when fullscreen
	const shouldHide = isBooting || isFullscreen;

	// Get animation variants based on position
	const { initial, animate, exit } = getAnimationVariants(position, shouldHide);

	return (
		<AnimatePresence mode="wait">
			<motion.nav
				key={position}
				ref={dockRef}
				role="navigation"
				aria-label="Application dock"
				className={clsx("fixed z-50", POSITION_CLASSES[position])}
				initial={initial}
				animate={animate}
				exit={exit}
				transition={{
					type: "spring",
					stiffness: 500,
					damping: 35,
					// Stagger delay when appearing after boot, no delay when hiding
					delay: shouldHide ? 0 : staggerDelay,
				}}
				onPointerDown={handlePointerDown}
				aria-hidden={shouldHide}
			>
				{/* Dock platform container */}
				<div
					role="toolbar"
					aria-label="Application shortcuts"
					className="relative"
					onMouseMove={handleMouseMove}
					onMouseLeave={handleMouseLeave}
					onPointerUp={handlePointerUp}
					onKeyDown={handleKeyDown}
				>
					{/* Glass platform background - anchored to edge, fills container */}
					<div
						className={clsx(
							"absolute rounded-2xl",
							isVertical ? "inset-y-0" : "inset-x-0 bottom-0",
							// For left dock, anchor to left; for right dock, anchor to right
							position === "left" && "left-0",
							position === "right" && "right-0",
						)}
						style={{
							// Fixed thickness perpendicular to the dock edge
							// Icons grow outward beyond the platform during magnification
							...(isVertical ? { width: platformThickness } : { height: platformThickness }),
							background: "rgba(50, 50, 50, 0.65)",
							backdropFilter: "blur(20px)",
							WebkitBackdropFilter: "blur(20px)",
							boxShadow: `
							0 0 0 0.5px rgba(255, 255, 255, 0.15),
							0 8px 40px rgba(0, 0, 0, 0.55),
							inset 0 0.5px 0 rgba(255, 255, 255, 0.1)
						`,
						}}
					/>

					{/* Icons container - icons grow outward from edge during magnification */}
					<div
						className={clsx(
							"relative flex",
							isVertical ? "flex-col" : "flex-row",
							// Alignment: icons anchor to the dock edge, grow outward
							// Bottom dock: items-end (icons align bottom, grow up)
							// Left dock: items-start (icons align left, grow right)
							// Right dock: items-end (icons align right, grow left)
							position === "left" ? "items-start" : "items-end",
						)}
						style={{
							gap: `${gap}px`,
							padding: `${padding}px`,
							// Fixed width for vertical docks prevents container resize during magnification
							...(isVertical &&
								magnification && {
									width: maxIconSize + padding * 2,
								}),
						}}
					>
						{DOCK_ITEMS.map((item, index) => (
							<DockIcon
								key={item.id}
								appId={item.id}
								label={item.label}
								icon={item.icon}
								iconSrc={item.iconSrc}
								gradient={item.gradient}
								backgroundColor={item.backgroundColor}
								iconPadding={item.iconPadding}
								mousePosition={mousePosition}
								magnify={!isMobile && magnification}
								baseSize={baseSize}
								dockPosition={position}
								isFocused={focusedIndex === index}
								onFocus={() => handleIconFocus(index)}
								onClick={handleIconClick}
							/>
						))}
					</div>
				</div>
			</motion.nav>
		</AnimatePresence>
	);
});
