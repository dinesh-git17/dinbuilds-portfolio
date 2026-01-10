"use client";

import type { PanInfo, Transition, useAnimation } from "framer-motion";
import { useCallback, useEffect, useRef } from "react";

import { useReducedMotion } from "@/os/window";

import { ELASTIC_DRAG_CONFIG } from "./motion";

export interface ElasticDragConfig {
	stiffness: number;
	damping: number;
}

/** Type for the animation controls returned by useAnimation() */
type AnimationControls = ReturnType<typeof useAnimation>;

export interface UseElasticDragOptions {
	/** Animation controls from useAnimation() */
	controls: AnimationControls;
	/** Whether drag is enabled (e.g., disabled on mobile) */
	enabled: boolean;
	/** Spring configuration (defaults to icon config) */
	springConfig?: ElasticDragConfig;
}

export interface UseElasticDragReturn {
	/** Whether the element is currently being dragged */
	isDraggingRef: React.RefObject<boolean>;
	/** Whether a significant drag occurred (blocks click) */
	hasDraggedRef: React.RefObject<boolean>;
	/** Transition config for snap-back animation */
	snapBackTransition: Transition;
	/** Handler for drag start */
	handleDragStart: () => void;
	/** Handler for drag end */
	handleDragEnd: (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => void;
	/** Handler for context menu (suppresses during drag) */
	handleContextMenu: (e: React.MouseEvent) => void;
	/** Check if click should be blocked (call at start of click handler) */
	shouldBlockClick: () => boolean;
}

/**
 * Hook for elastic drag-and-snap-back behavior.
 *
 * Provides all necessary handlers and state for implementing
 * tethered drag interactions where elements spring back to origin.
 *
 * Features:
 * - Distinguishes between clicks and drags (5px threshold)
 * - Instant snap-back on window blur
 * - Respects prefers-reduced-motion
 * - Suppresses context menu during drag
 */
export function useElasticDrag({
	controls,
	enabled,
	springConfig = ELASTIC_DRAG_CONFIG.icon,
}: UseElasticDragOptions): UseElasticDragReturn {
	const prefersReducedMotion = useReducedMotion();

	// Drag state tracking
	const isDraggingRef = useRef(false);
	const hasDraggedRef = useRef(false);

	// Spring configuration for snap-back animation
	const snapBackTransition: Transition = prefersReducedMotion
		? { type: "tween", duration: 0 }
		: {
				type: "spring",
				stiffness: springConfig.stiffness,
				damping: springConfig.damping,
			};

	// Handle window blur: instant snap-back without animation
	useEffect(() => {
		if (!enabled) return;

		const handleBlur = () => {
			if (isDraggingRef.current) {
				// Force instant reset on window blur
				controls.set({ x: 0, y: 0 });
				isDraggingRef.current = false;
				hasDraggedRef.current = false;
			}
		};

		window.addEventListener("blur", handleBlur);
		return () => window.removeEventListener("blur", handleBlur);
	}, [controls, enabled]);

	const handleDragStart = useCallback(() => {
		isDraggingRef.current = true;
		hasDraggedRef.current = false;
	}, []);

	const handleDragEnd = useCallback(
		(_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
			isDraggingRef.current = false;

			// Calculate total movement distance
			const distance = Math.sqrt(info.offset.x ** 2 + info.offset.y ** 2);

			// If movement exceeded threshold, mark as dragged (not a click)
			if (distance > ELASTIC_DRAG_CONFIG.dragThreshold) {
				hasDraggedRef.current = true;
			}
		},
		[],
	);

	// Suppress context menu during drag
	const handleContextMenu = useCallback((e: React.MouseEvent) => {
		if (isDraggingRef.current) {
			e.preventDefault();
			e.stopPropagation();
		}
	}, []);

	// Check if click should be blocked and reset flag
	const shouldBlockClick = useCallback(() => {
		if (hasDraggedRef.current) {
			hasDraggedRef.current = false;
			return true;
		}
		return false;
	}, []);

	return {
		isDraggingRef,
		hasDraggedRef,
		snapBackTransition,
		handleDragStart,
		handleDragEnd,
		handleContextMenu,
		shouldBlockClick,
	};
}
