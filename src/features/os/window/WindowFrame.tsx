"use client";

import clsx from "clsx";
import { motion, type PanInfo, useDragControls, useMotionValue } from "framer-motion";
import { memo, useCallback, useEffect, useRef, useState } from "react";

import { ONBOARDING_TIMING } from "@/os/boot";
import { useDeviceType } from "@/os/desktop/dock/useDeviceType";
import { SPOTLIGHT_Z_INDEX } from "@/os/onboarding";
import {
	FULL_HEIGHT_MOBILE_APPS,
	MOBILE_MAXIMIZED_APPS,
	selectIsWindowActive,
	selectIsWindowFullscreen,
	useSystemStore,
	type WindowInstance,
} from "@/os/store";

import { useGhostDrag } from "./useGhostDrag";
import { WindowControls } from "./WindowControls";

export interface WindowFrameProps {
	/** Window instance data from the store */
	window: WindowInstance;
	/** Window title displayed in the header */
	title: string;
	/** Content rendered inside the window */
	children: React.ReactNode;
	/** Whether to respect reduced motion preferences */
	reducedMotion?: boolean;
	/** Whether window controls should be highlighted (onboarding) */
	isControlsHighlighted?: boolean;
	/** Whether the header/drag area should be highlighted (onboarding) */
	isHeaderHighlighted?: boolean;
	/** Callback to trigger ghost drag animation externally */
	onGhostDragRequest?: () => void;
	/** Whether to run ghost drag animation */
	shouldGhostDrag?: boolean;
	/** Callback when ghost drag animation completes */
	onGhostDragComplete?: () => void;
}

/**
 * Draggable window container with glassmorphism styling.
 *
 * Features:
 * - Drag via header bar only (useDragControls pattern)
 * - Click anywhere to focus (z-index promotion)
 * - Smooth scale + fade animations on mount/unmount
 * - Constrained to viewport bounds
 * - Mobile: viewport-constrained sizing with touch drag support
 */
// Viewport padding constants
const MOBILE_PADDING = 8;
const DESKTOP_PADDING = 16;
const SYSTEM_BAR_HEIGHT_MOBILE = 32;
const SYSTEM_BAR_HEIGHT_DESKTOP = 36;
const DOCK_HEIGHT = 80;

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: WindowFrame manages drag, resize, and fullscreen states
export const WindowFrame = memo(function WindowFrame({
	window,
	title,
	children,
	reducedMotion = false,
	isControlsHighlighted = false,
	isHeaderHighlighted = false,
	shouldGhostDrag = false,
	onGhostDragComplete,
}: WindowFrameProps) {
	const { id, position, size } = window;

	const deviceType = useDeviceType();
	const isMobile = deviceType === "mobile";

	const isActive = useSystemStore(selectIsWindowActive(id));
	const isFullscreen = useSystemStore(selectIsWindowFullscreen(id));
	const focusWindow = useSystemStore((s) => s.focusWindow);
	const updateWindowPosition = useSystemStore((s) => s.updateWindowPosition);

	const constraintsRef = useRef<HTMLDivElement>(null);
	const dragControls = useDragControls();

	// Animation duration for glow effect
	const glowDuration = reducedMotion
		? ONBOARDING_TIMING.REDUCED_MOTION_DELAY / 1000
		: ONBOARDING_TIMING.GLOW_TRANSITION / 1000;

	// Track viewport dimensions with state (updates on mount and resize)
	const [viewport, setViewport] = useState({ width: 375, height: 667 });

	useEffect(() => {
		const updateViewport = () => {
			setViewport({
				width: globalThis.window.innerWidth,
				height: globalThis.window.innerHeight,
			});
		};

		// Set initial viewport
		updateViewport();

		// Update on resize
		globalThis.window.addEventListener("resize", updateViewport);
		return () => globalThis.window.removeEventListener("resize", updateViewport);
	}, []);

	// Check if this app should be full-height on mobile (edge-to-edge, no padding)
	const isFullHeightMobile = isMobile && FULL_HEIGHT_MOBILE_APPS.has(id);

	// Calculate responsive layout based on device type, viewport, and fullscreen state
	const responsiveLayout = (() => {
		// Fullscreen mode: cover entire viewport
		if (isFullscreen) {
			return {
				width: viewport.width,
				height: viewport.height,
				x: 0,
				y: 0,
			};
		}

		if (!isMobile) {
			return {
				width: size.width,
				height: size.height,
				x: position.x,
				y: position.y,
			};
		}

		// Full-height mobile apps: edge-to-edge with no padding
		if (isFullHeightMobile) {
			return {
				width: viewport.width,
				height: viewport.height - SYSTEM_BAR_HEIGHT_MOBILE - DOCK_HEIGHT,
				x: 0,
				y: SYSTEM_BAR_HEIGHT_MOBILE,
			};
		}

		// On mobile: constrain to viewport with padding
		const maxWidth = viewport.width - MOBILE_PADDING * 2;
		const maxHeight = viewport.height - SYSTEM_BAR_HEIGHT_MOBILE - DOCK_HEIGHT - MOBILE_PADDING * 2;

		// Apps in MOBILE_MAXIMIZED_APPS fill the available space
		const shouldMaximize = MOBILE_MAXIMIZED_APPS.has(id);
		const constrainedWidth = shouldMaximize ? maxWidth : Math.min(size.width, maxWidth);
		const constrainedHeight = shouldMaximize ? maxHeight : Math.min(size.height, maxHeight);

		// Center horizontally, position below SystemBar
		const centeredX = (viewport.width - constrainedWidth) / 2;
		const centeredY = SYSTEM_BAR_HEIGHT_MOBILE + MOBILE_PADDING;

		return {
			width: constrainedWidth,
			height: constrainedHeight,
			x: centeredX,
			y: centeredY,
		};
	})();

	// Motion values for smooth position updates
	const x = useMotionValue(position.x);
	const y = useMotionValue(position.y);

	// Update motion values when responsive layout changes (especially on mobile)
	useEffect(() => {
		x.set(responsiveLayout.x);
		y.set(responsiveLayout.y);
	}, [responsiveLayout.x, responsiveLayout.y, x, y]);

	// Ghost drag animation for onboarding
	const { trigger: triggerGhostDrag } = useGhostDrag({
		x,
		distance: 60,
		disabled: reducedMotion || isFullscreen || isFullHeightMobile,
		onComplete: onGhostDragComplete,
	});

	// Trigger ghost drag when requested
	const ghostDragTriggeredRef = useRef(false);
	useEffect(() => {
		if (shouldGhostDrag && !ghostDragTriggeredRef.current) {
			ghostDragTriggeredRef.current = true;
			triggerGhostDrag();
		} else if (!shouldGhostDrag) {
			ghostDragTriggeredRef.current = false;
		}
	}, [shouldGhostDrag, triggerGhostDrag]);

	// Determine if any onboarding highlight is active
	const isOnboardingHighlighted = isControlsHighlighted || isHeaderHighlighted;

	const handleFocus = useCallback(
		(e: React.PointerEvent) => {
			// Prevent selection box from triggering when clicking on window
			e.stopPropagation();

			if (!isActive) {
				focusWindow(id);
			}
		},
		[focusWindow, id, isActive],
	);

	const handleDragEnd = useCallback(
		(_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
			const newX = position.x + info.offset.x;
			const newY = position.y + info.offset.y;

			// Calculate valid bounds accounting for window size
			const padding = isMobile ? MOBILE_PADDING : DESKTOP_PADDING;
			const topBound = isMobile
				? SYSTEM_BAR_HEIGHT_MOBILE
				: SYSTEM_BAR_HEIGHT_DESKTOP + padding / 2;
			const bottomBound = isMobile ? DOCK_HEIGHT : padding;

			const minX = padding;
			const maxX = viewport.width - responsiveLayout.width - padding;
			const minY = topBound;
			const maxY = viewport.height - responsiveLayout.height - bottomBound;

			// Clamp position to valid bounds
			updateWindowPosition(id, {
				x: Math.max(minX, Math.min(maxX, newX)),
				y: Math.max(minY, Math.min(maxY, newY)),
			});
		},
		[id, position.x, position.y, updateWindowPosition, viewport, responsiveLayout, isMobile],
	);

	// Start drag when pointer down on header
	const handleHeaderPointerDown = useCallback(
		(e: React.PointerEvent) => {
			// Don't start drag if clicking on controls
			if ((e.target as HTMLElement).closest("fieldset")) {
				return;
			}
			dragControls.start(e);
		},
		[dragControls],
	);

	// Animation variants
	// Note: We avoid animating opacity on elements with backdrop-blur
	// as it causes a visual "flash" when the blur effect kicks in.
	// Exit animation is disabled - a partial scale without opacity looks jarring.
	const variants = {
		initial: reducedMotion ? {} : { scale: 0.96 },
		animate: reducedMotion ? {} : { scale: 1 },
		exit: {},
	};

	// Drag constraints - respect system bar at top and keep window in viewport
	const dragConstraintStyle = isMobile
		? {
				top: SYSTEM_BAR_HEIGHT_MOBILE,
				left: MOBILE_PADDING,
				right: MOBILE_PADDING,
				bottom: DOCK_HEIGHT,
			}
		: {
				top: SYSTEM_BAR_HEIGHT_DESKTOP + DESKTOP_PADDING / 2,
				left: DESKTOP_PADDING,
				right: DESKTOP_PADDING,
				bottom: DESKTOP_PADDING,
			};

	return (
		<>
			{/* Invisible constraints boundary */}
			<div ref={constraintsRef} className="pointer-events-none fixed" style={dragConstraintStyle} />

			<motion.div
				role="dialog"
				aria-label={`${title} window`}
				aria-modal="false"
				tabIndex={-1}
				className="fixed select-none touch-none"
				style={{
					x,
					y,
					width: responsiveLayout.width,
					height: responsiveLayout.height,
					// During onboarding, promote to spotlight z-index
					zIndex: isOnboardingHighlighted
						? SPOTLIGHT_Z_INDEX.highlighted
						: isFullscreen
							? 100
							: isActive
								? 50
								: 10,
				}}
				drag={!isFullscreen && !isFullHeightMobile}
				dragControls={dragControls}
				dragListener={false}
				dragConstraints={constraintsRef}
				dragElastic={0}
				dragMomentum={false}
				onDragEnd={handleDragEnd}
				initial="initial"
				animate="animate"
				exit="exit"
				variants={variants}
				transition={{
					type: "spring",
					stiffness: 400,
					damping: 30,
				}}
				onPointerDown={handleFocus}
			>
				{/* Window chrome */}
				<div
					className={`
						flex h-full flex-col overflow-hidden
						border bg-black/60 backdrop-blur-xl
						transition-[border-color,box-shadow,border-radius] duration-200
						${isFullscreen ? "rounded-none border-transparent" : ""}
						${!isFullscreen && isFullHeightMobile ? "rounded-t-xl rounded-b-none border-x-0 border-b-0 shadow-none" : ""}
						${!isFullscreen && !isFullHeightMobile ? "rounded-xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)]" : ""}
						${!isFullscreen && isActive ? "border-white/20 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.1)]" : ""}
						${!isFullscreen && !isActive ? "border-white/10" : ""}
						${isFullHeightMobile ? "border-t-white/10" : ""}
					`}
				>
					{/* Header / Drag Handle */}
					<header
						className={clsx(
							"flex h-11 shrink-0 items-center gap-3 border-b border-white/5 px-4",
							isFullscreen || isFullHeightMobile
								? "cursor-default"
								: "cursor-grab active:cursor-grabbing",
							isHeaderHighlighted && "rounded-t-xl",
						)}
						onPointerDown={isFullscreen || isFullHeightMobile ? undefined : handleHeaderPointerDown}
						style={{
							touchAction: "none",
							boxShadow: isHeaderHighlighted
								? "0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.3)"
								: "none",
							transition: `box-shadow ${glowDuration}s ease-out`,
						}}
					>
						<WindowControls windowId={id} isHighlighted={isControlsHighlighted} />

						<h2 className="flex-1 truncate text-center font-mono text-xs text-white/50">{title}</h2>

						{/* Spacer for centering title */}
						<div className="w-[52px]" aria-hidden="true" />
					</header>

					{/* Content area */}
					<article className="flex-1 overflow-auto">{children}</article>
				</div>
			</motion.div>
		</>
	);
});
