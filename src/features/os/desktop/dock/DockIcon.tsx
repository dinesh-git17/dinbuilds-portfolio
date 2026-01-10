"use client";

import {
	AnimatePresence,
	type MotionValue,
	motion,
	useAnimate,
	useSpring,
	useTransform,
} from "framer-motion";
import type { LucideIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { memo, useCallback, useRef, useState } from "react";

import { APP_ID_TO_SLUG } from "@/lib/seo";
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
	const [bounceScope, animateBounce] = useAnimate<HTMLDivElement>();
	const router = useRouter();
	const launchApp = useSystemStore((s) => s.launchApp);
	// Check if app is running (has open or minimized window)
	const isRunning = useSystemStore((s) =>
		s.windows.some((w) => w.id === appId && (w.status === "open" || w.status === "minimized")),
	);
	const [isHovered, setIsHovered] = useState(false);
	const [hasPrefetched, setHasPrefetched] = useState(false);

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

	/**
	 * Speculatively prefetch the app route on hover.
	 * This preloads the JS chunk and RSC payload for instant navigation.
	 */
	const handlePrefetch = useCallback(() => {
		if (hasPrefetched) return;

		const slug = APP_ID_TO_SLUG[appId];
		if (slug) {
			router.prefetch(`/?app=${slug}`);
			setHasPrefetched(true);
		}
	}, [appId, hasPrefetched, router]);

	const handleMouseEnter = useCallback(() => {
		setIsHovered(true);
		handlePrefetch();
	}, [handlePrefetch]);

	const handleClick = useCallback(() => {
		// Reset magnification and focus BEFORE launching app to prevent stuck state
		onClick?.();
		// Clear hover state on click (fixes tooltip staying visible on touch devices)
		setIsHovered(false);
		// Blur the button to remove focus ring (fixes highlight staying on touch devices)
		ref.current?.blur();

		// Launch the app immediately (don't wait for animation)
		launchApp(appId, { launchMethod: "dock" });

		// Trigger the "happy launch" bounce animation (macOS-style instant jump)
		animateBounce(
			bounceScope.current,
			{ y: [0, -18, 0, -6, 0] },
			{ duration: 0.5, ease: [0.36, 0.07, 0.19, 0.97] },
		);
	}, [launchApp, appId, onClick, animateBounce, bounceScope]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				launchApp(appId, { launchMethod: "dock" });
				// Trigger the "happy launch" bounce animation (macOS-style instant jump)
				animateBounce(
					bounceScope.current,
					{ y: [0, -18, 0, -6, 0] },
					{ duration: 0.5, ease: [0.36, 0.07, 0.19, 0.97] },
				);
			}
		},
		[launchApp, appId, animateBounce, bounceScope],
	);

	return (
		<motion.div
			ref={bounceScope}
			className="relative flex flex-col items-center"
			style={{ width: size, height: size }}
		>
			{/* Tooltip - appears above (bottom dock), right (left dock), or left (right dock) */}
			<motion.div
				className={`pointer-events-none absolute z-50 ${getTooltipPositionClass(dockPosition)}`}
				initial={getTooltipInitialState(dockPosition)}
				animate={getTooltipAnimateState(dockPosition, isHovered)}
				transition={{ duration: 0.15 }}
			>
				<div className="whitespace-nowrap rounded-md bg-gray-800/95 px-3 py-1.5 text-sm font-medium text-white shadow-lg">
					{label}
				</div>
				{/* Tooltip arrow */}
				<div
					className={`absolute h-2 w-2 rotate-45 bg-gray-800/95 ${getTooltipArrowClass(dockPosition)}`}
				/>
			</motion.div>

			{/* Icon button */}
			<motion.button
				ref={ref}
				type="button"
				onClick={handleClick}
				onKeyDown={handleKeyDown}
				onFocus={onFocus}
				onMouseEnter={handleMouseEnter}
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

			{/* Running indicator dot (macOS style) */}
			<AnimatePresence>
				{isRunning && (
					<motion.div
						className="absolute h-1 w-1 rounded-full bg-white/80"
						style={{
							// Position based on dock orientation
							...(dockPosition === "bottom"
								? { bottom: -6, left: "50%", x: "-50%" }
								: dockPosition === "left"
									? { left: -6, top: "50%", y: "-50%" }
									: { right: -6, top: "50%", y: "-50%" }),
						}}
						initial={{ scale: 0, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						exit={{ scale: 0, opacity: 0 }}
						transition={{ duration: 0.15 }}
					/>
				)}
			</AnimatePresence>
		</motion.div>
	);
});
