"use client";

import { useCallback, useRef, useState } from "react";

import { AppID } from "@/os/store";

/**
 * Desktop item configuration.
 * Each item represents a folder icon on the desktop.
 */
export interface DesktopItem {
	/** Unique identifier for the item */
	id: string;
	/** Display label shown under the icon */
	label: string;
	/** App ID to launch when double-clicked */
	appId: AppID;
}

/**
 * Selection box coordinates for intersection testing.
 */
export interface SelectionRect {
	x: number;
	y: number;
	width: number;
	height: number;
}

/**
 * Initial desktop items configuration.
 * Two folders: Projects and Experience.
 */
export const DESKTOP_ITEMS: DesktopItem[] = [
	{
		id: "projects",
		label: "Projects",
		appId: AppID.FolderProjects,
	},
	{
		id: "experience",
		label: "Experience",
		appId: AppID.FolderExperience,
	},
];

/**
 * Check if two rectangles intersect.
 */
function rectsIntersect(a: SelectionRect, b: SelectionRect): boolean {
	return !(
		a.x + a.width < b.x ||
		b.x + b.width < a.x ||
		a.y + a.height < b.y ||
		b.y + b.height < a.y
	);
}

/**
 * useDesktop — Manages desktop icon selection state.
 *
 * Provides:
 * - Multi-selection state for desktop items
 * - Select handler for individual icons
 * - Clear selection handler (for clicking on empty space)
 * - Icon ref registry for rubber-band selection
 */
export function useDesktop() {
	const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
	const iconRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

	const selectItem = useCallback((itemId: string) => {
		setSelectedItemIds(new Set([itemId]));
	}, []);

	const clearSelection = useCallback(() => {
		setSelectedItemIds(new Set());
	}, []);

	/**
	 * Register an icon element for intersection testing.
	 */
	const registerIconRef = useCallback((itemId: string, element: HTMLButtonElement | null) => {
		if (element) {
			iconRefs.current.set(itemId, element);
		} else {
			iconRefs.current.delete(itemId);
		}
	}, []);

	/**
	 * Update selection based on rubber-band selection box.
	 * Selects all icons that intersect with the box.
	 */
	const updateSelectionFromBox = useCallback(
		(selectionBox: SelectionRect, containerRect: DOMRect) => {
			const newSelection = new Set<string>();

			for (const item of DESKTOP_ITEMS) {
				const element = iconRefs.current.get(item.id);
				if (!element) continue;

				const iconRect = element.getBoundingClientRect();

				// Convert icon rect to container-relative coordinates
				const relativeIconRect: SelectionRect = {
					x: iconRect.left - containerRect.left,
					y: iconRect.top - containerRect.top,
					width: iconRect.width,
					height: iconRect.height,
				};

				if (rectsIntersect(selectionBox, relativeIconRect)) {
					newSelection.add(item.id);
				}
			}

			setSelectedItemIds(newSelection);
		},
		[],
	);

	return {
		/** Array of desktop items */
		items: DESKTOP_ITEMS,
		/** Set of currently selected item IDs */
		selectedItemIds,
		/** Select a specific item by ID (single select) */
		selectItem,
		/** Clear the current selection */
		clearSelection,
		/** Register an icon element ref */
		registerIconRef,
		/** Update selection based on rubber-band box */
		updateSelectionFromBox,
	};
}
