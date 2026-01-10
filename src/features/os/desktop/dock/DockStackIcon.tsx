"use client";

import { type MotionValue, motion, useSpring, useTransform } from "framer-motion";
import { memo, useCallback, useEffect, useRef, useState } from "react";

import { ONBOARDING_TIMING } from "@/os/boot";
import { SPOTLIGHT_Z_INDEX } from "@/os/onboarding";
import type { DockStackID } from "@/os/store";
import { useReducedMotion } from "@/os/window";

import type { DockStackItem } from "./dock-config";

export interface DockStackIconProps {
	/** Stack configuration */
	stack: DockStackItem;
	/** Whether the stack is currently expanded */
	isOpen: boolean;
	/** Whether this stack is highlighted during onboarding */
	isHighlighted?: boolean;
	/** Callback to toggle stack open/close */
	onToggle: (stackId: DockStackID) => void;
	/** Mouse position relative to dock (motion value) */
	mousePosition: MotionValue<number>;
	/** Whether magnification is enabled */
	magnify: boolean;
	/** Base icon size in pixels */
	baseSize: number;
	/** Dock position for tooltip placement */
	dockPosition: "bottom" | "left" | "right";
	/** Whether this icon is focused for keyboard navigation */
	isFocused?: boolean;
	/** Callback when icon receives focus */
	onFocus?: () => void;
	/** Callback when icon is clicked (to clear focus state in parent) */
	onClick?: () => void;
	/** Ref callback to get the anchor element for DockStack positioning */
	setAnchorRef?: (el: HTMLButtonElement | null) => void;
}

/** Distance at which magnification reaches maximum */
const MAGNIFY_DISTANCE = 150;
/** Magnification scale factor */
const MAGNIFY_SCALE = 1.54;

/**
 * Get tooltip position classes based on dock position.
 */
function getTooltipPositionClass(dockPosition: "bottom" | "left" | "right"): string {
	switch (dockPosition) {
		case "bottom":
			return "-top-9 left-1/2";
		case "left":
			return "left-full top-1/2 ml-3";
		case "right":
			return "right-full top-1/2 mr-3";
	}
}

/**
 * Get tooltip arrow position classes based on dock position.
 */
function getTooltipArrowClass(dockPosition: "bottom" | "left" | "right"): string {
	switch (dockPosition) {
		case "bottom":
			return "-bottom-1 left-1/2 -translate-x-1/2";
		case "left":
			return "-left-1 top-1/2 -translate-y-1/2";
		case "right":
			return "-right-1 top-1/2 -translate-y-1/2";
	}
}

/**
 * Get tooltip initial animation state based on dock position.
 */
function getTooltipInitialState(dockPosition: "bottom" | "left" | "right") {
	const baseX = dockPosition === "bottom" ? "-50%" : dockPosition === "left" ? -4 : 4;
	const baseY = dockPosition === "bottom" ? 4 : "-50%";
	return { opacity: 0, x: baseX, y: baseY };
}

/**
 * Get tooltip animate state based on dock position and hover state.
 */
function getTooltipAnimateState(dockPosition: "bottom" | "left" | "right", isVisible: boolean) {
	if (dockPosition === "bottom") {
		return {
			opacity: isVisible ? 1 : 0,
			x: "-50%",
			y: isVisible ? 0 : 4,
		};
	}

	const xOffset = dockPosition === "left" ? -4 : 4;
	return {
		opacity: isVisible ? 1 : 0,
		x: isVisible ? 0 : xOffset,
		y: "-50%",
	};
}

/**
 * DockStackIcon — Folder icon for expandable dock stacks.
 *
 * Similar to DockIcon but toggles a stack overlay instead of launching an app.
 * Used on mobile to group multiple apps into a single folder.
 */
export const DockStackIcon = memo(function DockStackIcon({
	stack,
	isOpen,
	isHighlighted = false,
	onToggle,
	mousePosition,
	magnify,
	baseSize,
	dockPosition,
	isFocused = false,
	onFocus,
	onClick,
	setAnchorRef,
}: DockStackIconProps) {
	const ref = useRef<HTMLButtonElement>(null);
	const [isHovered, setIsHovered] = useState(false);
	const prefersReducedMotion = useReducedMotion();

	// Animation duration for glow effect
	const glowDuration = prefersReducedMotion
		? ONBOARDING_TIMING.REDUCED_MOTION_DELAY / 1000
		: ONBOARDING_TIMING.GLOW_TRANSITION / 1000;

	const isVertical = dockPosition === "left" || dockPosition === "right";
	const maxSize = Math.round(baseSize * MAGNIFY_SCALE);

	// Calculate distance from mouse to icon center
	const distance = useTransform(mousePosition, (val) => {
		const bounds = ref.current?.getBoundingClientRect();
		if (!bounds) return MAGNIFY_DISTANCE;
		const iconCenter = isVertical ? bounds.y + bounds.height / 2 : bounds.x + bounds.width / 2;
		return val - iconCenter;
	});

	// Parabolic scaling based on distance
	const scale = useTransform(distance, (d) => {
		if (!magnify) return baseSize;

		const absDistance = Math.abs(d);
		if (absDistance > MAGNIFY_DISTANCE) return baseSize;

		const ratio = 1 - absDistance / MAGNIFY_DISTANCE;
		const cosValue = (1 + Math.cos(Math.PI * (1 - ratio))) / 2;
		return baseSize + (maxSize - baseSize) * cosValue;
	});

	// Smooth spring animation for the size
	const size = useSpring(scale, {
		stiffness: 400,
		damping: 28,
		mass: 0.5,
	});

	const handleClick = useCallback(() => {
		onClick?.();
		setIsHovered(false);
		ref.current?.blur();
		onToggle(stack.id);
	}, [onClick, onToggle, stack.id]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				onToggle(stack.id);
			}
		},
		[onToggle, stack.id],
	);

	// Ref for the outer container (used for positioning)
	const containerRef = useRef<HTMLDivElement>(null);

	// Combine refs for both internal use and parent anchor positioning
	const setRefs = useCallback((el: HTMLButtonElement | null) => {
		// TypeScript workaround: ref.current is readonly but we need to set it
		(ref as React.MutableRefObject<HTMLButtonElement | null>).current = el;
	}, []);

	// Set anchor ref to the container for accurate positioning
	useEffect(() => {
		if (containerRef.current) {
			setAnchorRef?.(containerRef.current as unknown as HTMLButtonElement);
		}
	}, [setAnchorRef]);

	const Icon = stack.icon;

	return (
		<motion.div
			ref={containerRef}
			data-stack-id={stack.id}
			className="relative flex flex-col items-center rounded-[22.5%]"
			style={{
				width: size,
				height: size,
				zIndex: isHighlighted ? SPOTLIGHT_Z_INDEX.highlighted : undefined,
			}}
			animate={{
				boxShadow: isHighlighted
					? "0 0 20px rgba(59, 130, 246, 0.7), 0 0 40px rgba(59, 130, 246, 0.5), 0 0 60px rgba(59, 130, 246, 0.3)"
					: "none",
			}}
			transition={{
				boxShadow: { duration: glowDuration, ease: "easeOut" },
			}}
		>
			{/* Tooltip */}
			<motion.div
				className={`pointer-events-none absolute z-50 ${getTooltipPositionClass(dockPosition)}`}
				initial={getTooltipInitialState(dockPosition)}
				animate={getTooltipAnimateState(dockPosition, isHovered && !isOpen)}
				transition={{ duration: 0.15 }}
			>
				<div className="whitespace-nowrap rounded-md bg-gray-800/95 px-3 py-1.5 text-sm font-medium text-white shadow-lg">
					{stack.label}
				</div>
				<div
					className={`absolute h-2 w-2 rotate-45 bg-gray-800/95 ${getTooltipArrowClass(dockPosition)}`}
				/>
			</motion.div>

			{/* Stack folder icon button */}
			<motion.button
				ref={setRefs}
				type="button"
				onClick={handleClick}
				onKeyDown={handleKeyDown}
				onFocus={onFocus}
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
				aria-label={`${isOpen ? "Close" : "Open"} ${stack.label} folder`}
				aria-expanded={isOpen}
				aria-haspopup="menu"
				className={`
					relative h-full w-full
					cursor-pointer
					focus:outline-none
					${isFocused ? "ring-2 ring-white/60 ring-offset-2 ring-offset-black/20" : ""}
				`}
				style={{ borderRadius: "22.5%" }}
				whileTap={{ scale: 0.92 }}
			>
				{/* Gradient background */}
				<div
					className="absolute inset-0 shadow-lg"
					style={{
						background: stack.gradient
							? `linear-gradient(145deg, ${stack.gradient[0]}, ${stack.gradient[1]})`
							: "linear-gradient(145deg, #666, #333)",
						borderRadius: "22.5%",
						boxShadow: `
							0 2px 8px rgba(0,0,0,0.3),
							0 8px 24px rgba(0,0,0,0.2),
							inset 0 1px 1px rgba(255,255,255,0.2)
						`,
					}}
				/>

				{/* Glass highlight overlay */}
				<div className="absolute inset-0 overflow-hidden" style={{ borderRadius: "22.5%" }}>
					<div
						className="absolute inset-x-0 top-0 h-1/2"
						style={{
							background:
								"linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 100%)",
						}}
					/>
				</div>

				{/* Folder icon */}
				{Icon && (
					<div className="relative flex h-full w-full items-center justify-center">
						<Icon
							className="pointer-events-none text-white drop-shadow-md"
							style={{ width: "50%", height: "50%" }}
							strokeWidth={1.75}
						/>
					</div>
				)}

				{/* Open indicator dot */}
				{isOpen && (
					<motion.div
						className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-white"
						initial={{ scale: 0 }}
						animate={{ scale: 1 }}
						exit={{ scale: 0 }}
					/>
				)}
			</motion.button>
		</motion.div>
	);
});
