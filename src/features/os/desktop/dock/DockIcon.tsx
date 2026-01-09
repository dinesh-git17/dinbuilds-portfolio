"use client";

import { type MotionValue, motion, useSpring, useTransform } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import Image from "next/image";
import { memo, useCallback, useRef, useState } from "react";

import { type AppID, useSystemStore } from "@/os/store";

export interface DockIconProps {
	/** App identifier */
	appId: AppID;
	/** Display label for accessibility */
	label: string;
	/** Lucide icon component (mutually exclusive with iconSrc) */
	icon?: LucideIcon;
	/** Custom image path for apps with branded icons (mutually exclusive with icon) */
	iconSrc?: string;
	/** Background gradient colors [from, to] (only used with icon) */
	gradient?: [string, string];
	/** Solid background color for custom image icons */
	backgroundColor?: string;
	/** Padding around the icon image */
	iconPadding?: string;
	/** Mouse position relative to dock (motion value) - X for horizontal, Y for vertical */
	mousePosition: MotionValue<number>;
	/** Whether magnification is enabled */
	magnify: boolean;
	/** Base icon size in pixels (controlled by dock config) */
	baseSize: number;
	/** Dock position for tooltip placement */
	dockPosition: "bottom" | "left" | "right";
	/** Whether this icon is focused for keyboard navigation */
	isFocused?: boolean;
	/** Callback when icon receives focus */
	onFocus?: () => void;
	/** Callback when icon is clicked (to clear focus state in parent) */
	onClick?: () => void;
}

/** Distance at which magnification reaches maximum */
const MAGNIFY_DISTANCE = 150;
/** Magnification scale factor (max size = base size * this factor) */
const MAGNIFY_SCALE = 1.54;

/**
 * Individual dock icon with parabolic magnification effect.
 *
 * Styled like macOS Big Sur app icons with gradient backgrounds
 * and squircle (superellipse) corners.
 */
export const DockIcon = memo(function DockIcon({
	appId,
	label,
	icon: Icon,
	iconSrc,
	gradient,
	backgroundColor,
	iconPadding,
	mousePosition,
	magnify,
	baseSize,
	dockPosition,
	isFocused = false,
	onFocus,
	onClick,
}: DockIconProps) {
	const ref = useRef<HTMLButtonElement>(null);
	const launchApp = useSystemStore((s) => s.launchApp);
	const [isHovered, setIsHovered] = useState(false);

	const isVertical = dockPosition === "left" || dockPosition === "right";

	// Calculate max size based on base size
	const maxSize = Math.round(baseSize * MAGNIFY_SCALE);

	// Calculate distance from mouse to icon center
	const distance = useTransform(mousePosition, (val) => {
		const bounds = ref.current?.getBoundingClientRect();
		if (!bounds) return MAGNIFY_DISTANCE;
		// Use Y center for vertical dock, X center for horizontal
		const iconCenter = isVertical ? bounds.y + bounds.height / 2 : bounds.x + bounds.width / 2;
		return val - iconCenter;
	});

	// Parabolic scaling based on distance
	const scale = useTransform(distance, (d) => {
		if (!magnify) return baseSize;

		const absDistance = Math.abs(d);
		if (absDistance > MAGNIFY_DISTANCE) return baseSize;

		// Cosine interpolation for smooth magnification curve
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
		launchApp(appId);
		// Clear hover state on click (fixes tooltip staying visible on touch devices)
		setIsHovered(false);
		// Blur the button to remove focus ring (fixes highlight staying on touch devices)
		ref.current?.blur();
		// Notify parent to clear focus index
		onClick?.();
	}, [launchApp, appId, onClick]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				launchApp(appId);
			}
		},
		[launchApp, appId],
	);

	return (
		<motion.div
			className="relative flex flex-col items-center"
			style={{ width: size, height: size }}
		>
			{/* Tooltip - appears above (bottom dock), right (left dock), or left (right dock) */}
			<motion.div
				className={`pointer-events-none absolute z-50 ${
					dockPosition === "bottom"
						? "-top-9 left-1/2"
						: dockPosition === "left"
							? "left-full top-1/2 ml-3"
							: "right-full top-1/2 mr-3"
				}`}
				initial={{
					opacity: 0,
					x: dockPosition === "bottom" ? "-50%" : dockPosition === "left" ? -4 : 4,
					y: dockPosition === "bottom" ? 4 : "-50%",
				}}
				animate={{
					opacity: isHovered ? 1 : 0,
					x:
						dockPosition === "bottom"
							? "-50%"
							: dockPosition === "left"
								? isHovered
									? 0
									: -4
								: isHovered
									? 0
									: 4,
					y: dockPosition === "bottom" ? (isHovered ? 0 : 4) : "-50%",
				}}
				transition={{ duration: 0.15 }}
			>
				<div className="whitespace-nowrap rounded-md bg-gray-800/95 px-3 py-1.5 text-sm font-medium text-white shadow-lg">
					{label}
				</div>
				{/* Tooltip arrow */}
				<div
					className={`absolute h-2 w-2 rotate-45 bg-gray-800/95 ${
						dockPosition === "bottom"
							? "-bottom-1 left-1/2 -translate-x-1/2"
							: dockPosition === "left"
								? "-left-1 top-1/2 -translate-y-1/2"
								: "-right-1 top-1/2 -translate-y-1/2"
					}`}
				/>
			</motion.div>

			{/* Icon button */}
			<motion.button
				ref={ref}
				type="button"
				onClick={handleClick}
				onKeyDown={handleKeyDown}
				onFocus={onFocus}
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
				aria-label={`Open ${label}`}
				className={`
					relative h-full w-full
					cursor-pointer
					focus:outline-none
					${isFocused ? "ring-2 ring-white/60 ring-offset-2 ring-offset-black/20" : ""}
				`}
				style={{
					// macOS squircle shape using CSS mask
					borderRadius: "22.5%",
				}}
				whileTap={{ scale: 0.92 }}
			>
				{iconSrc ? (
					<>
						{/* Custom image icon */}
						<div
							className="absolute inset-0 overflow-hidden"
							style={{
								borderRadius: "22.5%",
								backgroundColor: backgroundColor ?? "#000",
								boxShadow: `
									0 2px 8px rgba(0,0,0,0.3),
									0 8px 24px rgba(0,0,0,0.2),
									inset 0 1px 1px rgba(255,255,255,0.1)
								`,
								padding: iconPadding,
							}}
						>
							<Image
								src={iconSrc}
								alt={label}
								fill
								className="object-contain"
								sizes="80px"
								priority
								style={{ padding: iconPadding }}
							/>
						</div>
					</>
				) : (
					<>
						{/* Gradient background */}
						<div
							className="absolute inset-0 shadow-lg"
							style={{
								background: gradient
									? `linear-gradient(145deg, ${gradient[0]}, ${gradient[1]})`
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

						{/* Lucide Icon */}
						{Icon && (
							<div className="relative flex h-full w-full items-center justify-center">
								<Icon
									className="pointer-events-none text-white drop-shadow-md"
									style={{
										width: "50%",
										height: "50%",
									}}
									strokeWidth={1.75}
								/>
							</div>
						)}
					</>
				)}
			</motion.button>
		</motion.div>
	);
});
