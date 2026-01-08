"use client";

import { type MotionValue, motion, useSpring, useTransform } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { memo, useCallback, useRef, useState } from "react";

import { type AppID, useSystemStore } from "@/os/store";

export interface DockIconProps {
	/** App identifier */
	appId: AppID;
	/** Display label for accessibility */
	label: string;
	/** Icon component */
	icon: LucideIcon;
	/** Background gradient colors [from, to] */
	gradient: [string, string];
	/** Mouse X position relative to dock (motion value) */
	mouseX: MotionValue<number>;
	/** Whether magnification is enabled (desktop only) */
	magnify: boolean;
	/** Whether this icon is focused for keyboard navigation */
	isFocused?: boolean;
	/** Callback when icon receives focus */
	onFocus?: () => void;
	/** Callback when icon is clicked (to clear focus state in parent) */
	onClick?: () => void;
}

/** Base icon size in pixels */
const BASE_SIZE = 52;
/** Maximum magnified size */
const MAX_SIZE = 80;
/** Distance at which magnification reaches maximum */
const MAGNIFY_DISTANCE = 150;

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
	gradient,
	mouseX,
	magnify,
	isFocused = false,
	onFocus,
	onClick,
}: DockIconProps) {
	const ref = useRef<HTMLButtonElement>(null);
	const launchApp = useSystemStore((s) => s.launchApp);
	const [isHovered, setIsHovered] = useState(false);

	// Calculate distance from mouse to icon center
	const distance = useTransform(mouseX, (val) => {
		const bounds = ref.current?.getBoundingClientRect();
		if (!bounds) return MAGNIFY_DISTANCE;
		const iconCenter = bounds.x + bounds.width / 2;
		return val - iconCenter;
	});

	// Parabolic scaling based on distance
	const scale = useTransform(distance, (d) => {
		if (!magnify) return BASE_SIZE;

		const absDistance = Math.abs(d);
		if (absDistance > MAGNIFY_DISTANCE) return BASE_SIZE;

		// Cosine interpolation for smooth magnification curve
		const ratio = 1 - absDistance / MAGNIFY_DISTANCE;
		const cosValue = (1 + Math.cos(Math.PI * (1 - ratio))) / 2;
		return BASE_SIZE + (MAX_SIZE - BASE_SIZE) * cosValue;
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
			{/* Tooltip - appears above icon on hover */}
			<motion.div
				className="pointer-events-none absolute -top-9 left-1/2 z-50"
				initial={{ opacity: 0, y: 4, x: "-50%" }}
				animate={{
					opacity: isHovered ? 1 : 0,
					y: isHovered ? 0 : 4,
					x: "-50%",
				}}
				transition={{ duration: 0.15 }}
			>
				<div className="whitespace-nowrap rounded-md bg-gray-800/95 px-3 py-1.5 text-sm font-medium text-white shadow-lg">
					{label}
				</div>
				{/* Tooltip arrow */}
				<div className="absolute left-1/2 -bottom-1 h-2 w-2 -translate-x-1/2 rotate-45 bg-gray-800/95" />
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
				{/* Gradient background */}
				<div
					className="absolute inset-0 shadow-lg"
					style={{
						background: `linear-gradient(145deg, ${gradient[0]}, ${gradient[1]})`,
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

				{/* Icon */}
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
			</motion.button>
		</motion.div>
	);
});
