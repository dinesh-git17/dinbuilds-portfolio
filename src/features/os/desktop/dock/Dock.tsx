"use client";

import clsx from "clsx";
import { motion, useMotionValue } from "framer-motion";
import { memo, useCallback, useRef, useState } from "react";

import {
	DEFAULT_DOCK_CONFIG,
	DOCK_SIZE_MAP,
	selectDockConfig,
	selectIsAnyWindowFullscreen,
	useHasHydrated,
	useSystemStore,
} from "@/os/store";

import { DockIcon } from "./DockIcon";
import { DOCK_ITEMS } from "./dock-config";
import { useDeviceType } from "./useDeviceType";

/**
 * Position-based CSS classes for dock placement.
 */
const POSITION_CLASSES = {
	bottom: "bottom-3 left-1/2 -translate-x-1/2",
	left: "left-3 top-1/2 -translate-y-1/2",
	right: "right-3 top-1/2 -translate-y-1/2",
} as const;

/**
 * Animation variants for dock show/hide based on position.
 */
const getAnimationVariants = (position: "bottom" | "left" | "right", isFullscreen: boolean) => {
	const hiddenOffset = 120;

	switch (position) {
		case "left":
			return {
				initial: { x: -hiddenOffset, opacity: 0 },
				animate: { x: isFullscreen ? -hiddenOffset : 0, opacity: isFullscreen ? 0 : 1 },
			};
		case "right":
			return {
				initial: { x: hiddenOffset, opacity: 0 },
				animate: { x: isFullscreen ? hiddenOffset : 0, opacity: isFullscreen ? 0 : 1 },
			};
		default:
			// "bottom" position
			return {
				initial: { y: hiddenOffset, opacity: 0 },
				animate: { y: isFullscreen ? hiddenOffset : 0, opacity: isFullscreen ? 0 : 1 },
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
 */
export const Dock = memo(function Dock() {
	const deviceType = useDeviceType();
	const isMobile = deviceType === "mobile";
	const isFullscreen = useSystemStore(selectIsAnyWindowFullscreen);
	const hasHydrated = useHasHydrated();

	// Get dock config from store, use defaults during SSR/hydration
	const storedConfig = useSystemStore(selectDockConfig);
	const dockConfig = hasHydrated ? storedConfig : DEFAULT_DOCK_CONFIG;

	const { position, size, magnification } = dockConfig;
	const isVertical = position === "left" || position === "right";
	const baseSize = DOCK_SIZE_MAP[size];

	const dockRef = useRef<HTMLElement>(null);
	// Track mouse X for horizontal, Y for vertical
	const mousePosition = useMotionValue(Infinity);

	// Keyboard navigation state
	const [focusedIndex, setFocusedIndex] = useState<number>(-1);

	const handleMouseMove = useCallback(
		(e: React.MouseEvent) => {
			if (isMobile || !magnification) return;
			// Use clientY for vertical dock, clientX for horizontal
			mousePosition.set(isVertical ? e.clientY : e.clientX);
		},
		[isMobile, magnification, isVertical, mousePosition],
	);

	const handleMouseLeave = useCallback(() => {
		mousePosition.set(Infinity);
		setFocusedIndex(-1);
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
	}, []);

	// Prevent selection box from triggering when interacting with dock
	const handlePointerDown = useCallback((e: React.PointerEvent) => {
		e.stopPropagation();
	}, []);

	// Platform thickness stays fixed (doesn't grow with magnification)
	// Icons grow outward from the edge, platform stays anchored
	const gap = isMobile ? 8 : 12;
	const padding = isMobile ? 8 : 12;
	const magnifyScale = 1.54; // Must match DockIcon's MAGNIFY_SCALE
	const maxIconSize = Math.round(baseSize * magnifyScale);
	const platformThickness = baseSize + padding * 2;

	// Get animation variants based on position
	const { initial, animate } = getAnimationVariants(position, isFullscreen);

	return (
		<motion.nav
			ref={dockRef}
			role="navigation"
			aria-label="Application dock"
			className={clsx("fixed z-50", POSITION_CLASSES[position])}
			initial={initial}
			animate={animate}
			transition={{
				type: "spring",
				stiffness: 300,
				damping: 30,
				delay: isFullscreen ? 0 : 0.2,
			}}
			onPointerDown={handlePointerDown}
			aria-hidden={isFullscreen}
		>
			{/* Dock platform container */}
			<div
				role="toolbar"
				aria-label="Application shortcuts"
				className="relative"
				onMouseMove={handleMouseMove}
				onMouseLeave={handleMouseLeave}
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
						// Use max icon size when magnification is enabled to prevent platform resize
						...(isVertical
							? { width: magnification ? maxIconSize + padding * 2 : platformThickness }
							: { height: platformThickness }),
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
	);
});
