"use client";

import { useCallback, useRef, useState } from "react";

import { AppID } from "@/os/store";

/**
 * Icon type for desktop items.
 * "folder" renders a folder icon, "file" renders a document icon.
 */
export type DesktopIconType = "folder" | "file";

/**
 * Desktop item configuration.
 * Supports both folder icons and file icons on the desktop.
 */
export interface DesktopItem {
	/** Unique identifier for the item */
	id: string;
	/** Display label shown under the icon */
	label: string;
	/** App ID to launch when double-clicked */
	appId: AppID;
	/** Icon type: folder or file */
	iconType: DesktopIconType;
	/** Folder ID for VFS lookup (used by FolderApp) */
	folderId?: string;
	/** Content URL for file items (used by MarkdownViewer) */
	contentUrl?: string;
	/** Title override for file items */
	title?: string;
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
 * Two folders (Projects, Experience) and a resume file.
 */
export const DESKTOP_ITEMS: DesktopItem[] = [
	{
		id: "projects",
		label: "Projects",
		appId: AppID.FolderProjects,
		iconType: "folder",
		folderId: "projects",
	},
	{
		id: "experience",
		label: "Experience",
		appId: AppID.FolderExperience,
		iconType: "folder",
		folderId: "experience",
	},
	{
		id: "resume",
		label: "Resume",
		appId: AppID.MarkdownViewer,
		iconType: "file",
		contentUrl: "/readmes/resume.md",
		title: "Resume",
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
