"use client";

import { memo } from "react";

import type { SelectionBox as SelectionBoxCoords } from "./useSelectionBox";

export interface SelectionBoxProps {
	/** Selection box coordinates from useSelectionBox hook */
	box: SelectionBoxCoords;
}

/**
 * SelectionBox — The visual "rubber band" selection rectangle.
 *
 * Renders a subtle selection box that follows the cursor 1:1.
 * No easing or springs applied — crisp OS-native feel.
 *
 * Style: Muted fill with soft border, matching Deep Dark theme.
 * Z-Index: 0 (above background, below windows and dock).
 */
export const SelectionBox = memo(function SelectionBox({ box }: SelectionBoxProps) {
	return (
		<div
			className="pointer-events-none absolute z-0 rounded-sm border border-white/15 bg-white/5"
			style={{
				left: box.x,
				top: box.y,
				width: box.width,
				height: box.height,
			}}
			aria-hidden="true"
			data-testid="selection-box"
		/>
	);
});
