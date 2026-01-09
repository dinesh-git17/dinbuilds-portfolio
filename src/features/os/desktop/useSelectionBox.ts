"use client";

import { useCallback, useRef, useState } from "react";

/**
 * System bar height - selection box cannot extend above this.
 * Matches the desktop SystemBar height (36px).
 */
const SYSTEM_BAR_HEIGHT = 36;

/**
 * Coordinates for a selection rectangle
 */
export interface SelectionBox {
	x: number;
	y: number;
	width: number;
	height: number;
}

/**
 * Internal state for tracking drag start position
 */
interface DragOrigin {
	x: number;
	y: number;
}

/**
 * Return type for the useSelectionBox hook
 */
export interface UseSelectionBoxReturn {
	/** Whether a selection drag is currently in progress */
	isSelecting: boolean;
	/** Current selection box coordinates, null when not selecting */
	selectionBox: SelectionBox | null;
	/** Handler for pointer down events on the container */
	handlePointerDown: (e: React.PointerEvent<HTMLElement>) => void;
	/** Handler for pointer move events on the container */
	handlePointerMove: (e: React.PointerEvent<HTMLElement>) => void;
	/** Handler for pointer up events on the container */
	handlePointerUp: () => void;
}

/**
 * useSelectionBox — Tracks rubber-band selection box coordinates
 *
 * Manages the state for a desktop-style drag-to-select box.
 * Handles the math for "reverse dragging" (bottom-right to top-left)
 * by computing the correct x, y, width, height regardless of drag direction.
 *
 * @param containerRef - Ref to the container element for coordinate calculation
 * @returns Selection state and pointer event handlers
 *
 * @example
 * ```tsx
 * const containerRef = useRef<HTMLDivElement>(null);
 * const { isSelecting, selectionBox, handlePointerDown, handlePointerMove, handlePointerUp } =
 *   useSelectionBox(containerRef);
 * ```
 */
export function useSelectionBox(
	containerRef: React.RefObject<HTMLElement | null>,
): UseSelectionBoxReturn {
	const [isSelecting, setIsSelecting] = useState(false);
	const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);

	// Use ref for drag origin to avoid state updates during drag
	const dragOrigin = useRef<DragOrigin | null>(null);

	/**
	 * Calculates the selection box from start and current positions.
	 * Handles negative coordinates (reverse dragging) by using Math.min/abs.
	 * Clamps the box to not extend above the system bar.
	 */
	const calculateSelectionBox = useCallback(
		(startX: number, startY: number, currentX: number, currentY: number): SelectionBox => {
			const rawY = Math.min(startY, currentY);
			const rawHeight = Math.abs(currentY - startY);

			// Clamp Y to not go above system bar
			const clampedY = Math.max(rawY, SYSTEM_BAR_HEIGHT);
			// Adjust height if we clamped Y
			const heightAdjustment = clampedY - rawY;
			const clampedHeight = Math.max(0, rawHeight - heightAdjustment);

			return {
				x: Math.min(startX, currentX),
				y: clampedY,
				width: Math.abs(currentX - startX),
				height: clampedHeight,
			};
		},
		[],
	);

	/**
	 * Converts page coordinates to container-relative coordinates
	 */
	const getRelativeCoordinates = useCallback(
		(pageX: number, pageY: number): { x: number; y: number } | null => {
			const container = containerRef.current;
			if (!container) return null;

			const rect = container.getBoundingClientRect();
			return {
				x: pageX - rect.left,
				y: pageY - rect.top,
			};
		},
		[containerRef],
	);

	const handlePointerDown = useCallback(
		(e: React.PointerEvent<HTMLElement>) => {
			// Only handle primary button (left click)
			if (e.button !== 0) return;

			// Only start selection if clicking directly on the container (Stage)
			// This prevents selection when clicking on windows, dock, etc.
			if (e.target !== e.currentTarget) return;

			const coords = getRelativeCoordinates(e.clientX, e.clientY);
			if (!coords) return;

			// Don't start selection if clicking in system bar area
			if (coords.y < SYSTEM_BAR_HEIGHT) return;

			dragOrigin.current = coords;
			setIsSelecting(true);
			setSelectionBox({
				x: coords.x,
				y: coords.y,
				width: 0,
				height: 0,
			});

			// Capture pointer to receive events even if cursor leaves the element
			e.currentTarget.setPointerCapture(e.pointerId);
		},
		[getRelativeCoordinates],
	);

	const handlePointerMove = useCallback(
		(e: React.PointerEvent<HTMLElement>) => {
			if (!isSelecting || !dragOrigin.current) return;

			const coords = getRelativeCoordinates(e.clientX, e.clientY);
			if (!coords) return;

			const newBox = calculateSelectionBox(
				dragOrigin.current.x,
				dragOrigin.current.y,
				coords.x,
				coords.y,
			);

			setSelectionBox(newBox);
		},
		[isSelecting, getRelativeCoordinates, calculateSelectionBox],
	);

	const handlePointerUp = useCallback(() => {
		setIsSelecting(false);
		setSelectionBox(null);
		dragOrigin.current = null;
	}, []);

	return {
		isSelecting,
		selectionBox,
		handlePointerDown,
		handlePointerMove,
		handlePointerUp,
	};
}
