"use client";

/**
 * WeatherWidget — Live Atmospheric Desktop Widget
 *
 * A glassmorphic widget displaying real-time weather for Toronto.
 * Positioned in the top-right quadrant of the desktop stage.
 *
 * Features:
 * - Dynamic gradient backgrounds based on weather conditions
 * - Large decorative icon with artistic crop/bleed effect
 * - Skeleton loading state during initial fetch
 * - Graceful offline/error state
 * - Elastic drag-and-snap-back behavior (desktop only)
 */

import clsx from "clsx";
import { AnimatePresence, motion, useAnimation } from "framer-motion";
import { memo, useEffect } from "react";

import { ELASTIC_DRAG_CONFIG, useElasticDrag } from "@/os/config";
import { useReducedMotion } from "@/os/window";

import { useDeviceType } from "../dock/useDeviceType";
import { WEATHER_LOCATION } from "./types";
import { useWeather } from "./use-weather";
import { getWeatherDescription, getWeatherThemeConfig } from "./weather-mapper";

export interface WeatherWidgetProps {
	/** Optional className for positioning overrides */
	className?: string;
}

/**
 * Skeleton loader for the widget during initial fetch.
 * Mimics the final layout with pulsing placeholders.
 */
function WeatherSkeleton() {
	return (
		<div className="flex h-full w-full items-center justify-between px-6">
			{/* Text skeleton */}
			<div className="flex flex-col gap-2">
				<div className="h-14 w-24 animate-pulse rounded-lg bg-white/10" />
				<div className="h-4 w-16 animate-pulse rounded bg-white/10" />
			</div>
			{/* Icon skeleton */}
			<div className="h-20 w-20 animate-pulse rounded-full bg-white/10" />
		</div>
	);
}

/**
 * Offline/Error state display.
 * Shows a subtle indicator without being intrusive.
 */
function WeatherOffline() {
	return (
		<div className="flex h-full w-full items-center justify-center px-6">
			<span className="font-sans text-sm text-white/40">Weather unavailable</span>
		</div>
	);
}

/**
 * Main weather content with temperature and conditions.
 */
interface WeatherContentProps {
	temp: number;
	code: number;
	isDay: boolean;
}

function WeatherContent({ temp, code, isDay }: WeatherContentProps) {
	const theme = getWeatherThemeConfig(code, isDay);
	const description = getWeatherDescription(code);
	const Icon = theme.icon;

	return (
		<>
			{/* Dynamic gradient overlay based on conditions */}
			<div
				className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} transition-colors duration-1000`}
				aria-hidden="true"
			/>

			{/* Content layer */}
			<div className="relative flex h-full w-full items-center justify-between px-6">
				{/* Temperature and location */}
				<div className="flex flex-col">
					<span
						className="font-sans text-6xl font-thin tracking-tight text-white"
						aria-hidden="true"
					>
						{temp}°
					</span>
					<span className="font-sans text-sm text-white/60">{WEATHER_LOCATION.city}</span>
				</div>

				{/* Decorative icon - large with artistic bleed */}
				<div
					className="relative -mr-4 flex h-24 w-24 items-center justify-center"
					aria-hidden="true"
				>
					<Icon className="h-20 w-20 text-white/30" strokeWidth={1} />
				</div>
			</div>

			{/* Screen reader description */}
			<span className="sr-only">
				{description}, {temp} degrees Celsius in {WEATHER_LOCATION.city}
			</span>
		</>
	);
}

/**
 * WeatherWidget — The main exported component.
 *
 * Renders a glassmorphic weather display for the desktop stage.
 * Hidden on mobile/tablet screens (< 1024px).
 * Supports elastic drag-and-snap-back on desktop.
 */
export const WeatherWidget = memo(function WeatherWidget({ className }: WeatherWidgetProps) {
	const { data, isLoading, error } = useWeather();
	const prefersReducedMotion = useReducedMotion();
	const deviceType = useDeviceType();
	const controls = useAnimation();

	// Enable drag only on desktop to avoid mobile scroll conflicts
	const isDraggable = deviceType === "desktop";

	// Elastic drag behavior with heavier spring (widget feels more massive)
	const { snapBackTransition, handleDragStart, handleDragEnd, handleContextMenu } = useElasticDrag({
		controls,
		enabled: isDraggable,
		springConfig: ELASTIC_DRAG_CONFIG.widget,
	});

	// Trigger initial reveal animation via controls
	useEffect(() => {
		controls.start({
			opacity: 1,
			y: 0,
			transition: {
				duration: prefersReducedMotion ? 0 : 0.5,
				ease: "easeOut",
				delay: prefersReducedMotion ? 0 : 0.3,
			},
		});
	}, [controls, prefersReducedMotion]);

	// Determine content to render
	const showSkeleton = isLoading && !data;
	const showError = !isLoading && (error || !data);
	const showContent = data && !error;

	return (
		<motion.aside
			className={clsx(
				"relative h-36 w-80 overflow-hidden rounded-2xl",
				"border border-white/10 bg-black/40 shadow-2xl backdrop-blur-2xl",
				isDraggable ? "pointer-events-auto" : "pointer-events-none",
				className,
			)}
			initial={{ opacity: 0, y: prefersReducedMotion ? 0 : -10 }}
			animate={controls}
			// Elastic drag behavior (desktop only)
			drag={isDraggable}
			dragSnapToOrigin={isDraggable}
			dragElastic={0}
			dragMomentum={false}
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
			onContextMenu={handleContextMenu}
			whileDrag={
				isDraggable
					? {
							scale: ELASTIC_DRAG_CONFIG.liftScale,
							boxShadow: ELASTIC_DRAG_CONFIG.liftShadow,
							zIndex: 100,
						}
					: undefined
			}
			transition={snapBackTransition}
			role="region"
			aria-label="Weather widget"
		>
			<AnimatePresence mode="wait">
				{showSkeleton && (
					<motion.div
						key="skeleton"
						className="absolute inset-0"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
					>
						<WeatherSkeleton />
					</motion.div>
				)}

				{showError && (
					<motion.div
						key="error"
						className="absolute inset-0"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
					>
						<WeatherOffline />
					</motion.div>
				)}

				{showContent && (
					<motion.div
						key="content"
						className="absolute inset-0"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.3 }}
					>
						<WeatherContent temp={data.temp} code={data.code} isDay={data.isDay} />
					</motion.div>
				)}
			</AnimatePresence>
		</motion.aside>
	);
});
