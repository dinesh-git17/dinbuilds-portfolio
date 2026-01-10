"use client";

import clsx from "clsx";
import { AnimatePresence, motion, useMotionValue } from "framer-motion";
import { memo, useCallback, useRef, useState } from "react";

import { UI_REVEAL } from "@/os/boot";
import {
	DEFAULT_DOCK_CONFIG,
	DOCK_SIZE_MAP,
	type DockStackID,
	selectDockConfig,
	selectIsAnyWindowFullscreen,
	useHasHydrated,
	useSystemStore,
} from "@/os/store";
import { useReducedMotion } from "@/os/window";

import { DockIcon } from "./DockIcon";
import { DockStack } from "./DockStack";
import { DockStackIcon } from "./DockStackIcon";
import { DOCK_ITEMS, type DockStackItem, isDockStackItem, MOBILE_DOCK_ITEMS } from "./dock-config";
import { useDeviceType } from "./useDeviceType";

export interface DockProps {
	/** Whether the system is currently booting (delays entrance animation) */
	isBooting?: boolean;
}

/**
 * Handle keyboard navigation within the dock.
 * Returns new focus index, or null to indicate no change.
 */
function handleDockKeyNavigation(
	key: string,
	currentIndex: number,
	itemCount: number,
): number | null {
	switch (key) {
		case "ArrowRight":
		case "ArrowDown":
			return (currentIndex + 1) % itemCount;
		case "ArrowLeft":
		case "ArrowUp":
			return (currentIndex - 1 + itemCount) % itemCount;
		case "Home":
			return 0;
		case "End":
			return itemCount - 1;
		default:
			return null;
	}
}

/**
 * Get platform anchor class based on dock position.
 */
function getPlatformAnchorClass(position: "bottom" | "left" | "right"): string {
	if (position === "left") return "left-0";
	if (position === "right") return "right-0";
	return "";
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

	// Stack expansion state (mobile only)
	const [openStackId, setOpenStackId] = useState<DockStackID | null>(null);
	const stackAnchorRef = useRef<HTMLButtonElement | null>(null);

	// Select dock items based on device type
	const dockItems = isMobile ? MOBILE_DOCK_ITEMS : DOCK_ITEMS;

	// Find the currently open stack item (if any)
	const openStack = openStackId
		? (dockItems.find((item) => isDockStackItem(item) && item.id === openStackId) as
				| DockStackItem
				| undefined)
		: null;

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

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			// Handle Escape to close stack
			if (e.key === "Escape" && openStackId) {
				e.preventDefault();
				setOpenStackId(null);
				return;
			}

			// Handle arrow/home/end navigation
			const newIndex = handleDockKeyNavigation(e.key, focusedIndex, dockItems.length);
			if (newIndex !== null) {
				e.preventDefault();
				setFocusedIndex(newIndex);
			}
		},
		[dockItems.length, focusedIndex, openStackId],
	);

	/**
	 * Toggle a stack folder open/closed.
	 */
	const handleStackToggle = useCallback((stackId: DockStackID) => {
		setOpenStackId((current) => (current === stackId ? null : stackId));
	}, []);

	/**
	 * Close the open stack (callback for DockStack).
	 */
	const handleStackClose = useCallback(() => {
		setOpenStackId(null);
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

	// Should hide: during boot OR when fullscreen
	const shouldHide = isBooting || isFullscreen;

	// Animation config: Use mobile simplified animation or desktop reveal with backOut bounce
	const animationConfig = prefersReducedMotion
		? { duration: 0.05, ease: "linear" as const, delay: 0 }
		: isMobile
			? { ...UI_REVEAL.mobile, delay: 0 }
			: UI_REVEAL.dock;

	// Get animation variants based on position
	const { initial, animate, exit } = getAnimationVariants(position, shouldHide);

	return (
		<>
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
						duration: animationConfig.duration,
						ease: animationConfig.ease,
						// Delay entrance animation, no delay when hiding
						delay: shouldHide ? 0 : animationConfig.delay,
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
								getPlatformAnchorClass(position),
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
							{dockItems.map((item, index) =>
								isDockStackItem(item) ? (
									<DockStackIcon
										key={item.id}
										stack={item}
										isOpen={openStackId === item.id}
										onToggle={handleStackToggle}
										mousePosition={mousePosition}
										magnify={!isMobile && magnification}
										baseSize={baseSize}
										dockPosition={position}
										isFocused={focusedIndex === index}
										onFocus={() => handleIconFocus(index)}
										onClick={handleIconClick}
										setAnchorRef={(el) => {
											// Always track the stack icon ref for positioning DockStack
											if (el) stackAnchorRef.current = el;
										}}
									/>
								) : (
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
								),
							)}
						</div>
					</div>
				</motion.nav>
			</AnimatePresence>

			{/* Stack expansion overlay - rendered outside motion.nav to avoid transform containment */}
			{openStack && (
				<DockStack
					stack={openStack}
					isOpen={openStackId !== null}
					onClose={handleStackClose}
					anchorRef={stackAnchorRef}
				/>
			)}
		</>
	);
});
