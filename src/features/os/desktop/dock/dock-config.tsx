import { Folder, type LucideIcon } from "lucide-react";

import { AppID, DockStackID } from "@/os/store";

/**
 * Shared visual styling for dock icons.
 * Supports either a Lucide icon with gradient or a custom image.
 */
interface DockIconStyle {
	/** Lucide icon component (mutually exclusive with iconSrc) */
	icon?: LucideIcon;
	/** Custom image path for apps with branded icons (mutually exclusive with icon) */
	iconSrc?: string;
	/** Gradient colors [from, to] for the icon background (only used with icon) */
	gradient?: [string, string];
	/** Solid background color for custom image icons */
	backgroundColor?: string;
	/** Padding around the icon image (e.g., "4px" or "8%") */
	iconPadding?: string;
}

/**
 * App item - launches an application directly when clicked.
 * Used on both desktop and mobile.
 */
export interface DockAppItem extends DockIconStyle {
	type: "app";
	id: AppID;
	label: string;
}

/**
 * Stack item - expandable folder containing multiple apps.
 * Used on mobile to group related apps (e.g., Projects).
 * Opens a floating menu when tapped, revealing contained apps.
 */
export interface DockStackItem extends DockIconStyle {
	type: "stack";
	id: DockStackID;
	label: string;
	/** App IDs contained within this stack */
	contents: AppID[];
}

/**
 * Discriminated union for all dock item types.
 * Use `isDockStackItem` type guard to narrow the type.
 */
export type DockItem = DockAppItem | DockStackItem;

/**
 * Type guard to check if a dock item is a stack (folder).
 */
export function isDockStackItem(item: DockItem): item is DockStackItem {
	return item.type === "stack";
}

/**
 * Type guard to check if a dock item is an app launcher.
 */
export function isDockAppItem(item: DockItem): item is DockAppItem {
	return item.type === "app";
}

/**
 * @deprecated Use DockItem instead. Kept for backward compatibility.
 */
export type DockItemConfig = DockAppItem;

/**
 * Desktop dock items displayed in order.
 * Each has a unique gradient inspired by macOS app icons.
 * On desktop, all apps are shown individually (no stacks).
 */
export const DOCK_ITEMS: DockAppItem[] = [
	{
		type: "app",
		id: AppID.About,
		label: "About",
		iconSrc: "/assets/dock/about.png",
		backgroundColor: "#007AFF",
	},
	{
		type: "app",
		id: AppID.Yield,
		label: "Yield",
		iconSrc: "/assets/apps/yield.png",
		backgroundColor: "#1E1B4B",
	},
	{
		type: "app",
		id: AppID.Debate,
		label: "Debate Lab",
		iconSrc: "/assets/apps/debate_lab.png",
		backgroundColor: "#F5F5F4", // Off-white
		iconPadding: "6px",
	},
	{
		type: "app",
		id: AppID.PassFX,
		label: "PassFX",
		iconSrc: "/assets/apps/passfx.png",
		backgroundColor: "#000000",
	},
	{
		type: "app",
		id: AppID.Terminal,
		label: "Terminal",
		iconSrc: "/assets/dock/terminal.png",
		backgroundColor: "#000000",
	},
	{
		type: "app",
		id: AppID.Contact,
		label: "Contact",
		iconSrc: "/assets/dock/contact.png",
		backgroundColor: "#5AC8FA",
	},
	{
		type: "app",
		id: AppID.Settings,
		label: "Settings",
		iconSrc: "/assets/dock/settings.png",
		backgroundColor: "#636366",
	},
];

/**
 * Projects stack definition containing work portfolio apps.
 * Displayed as a single folder icon on mobile that expands to reveal contents.
 */
export const PROJECTS_STACK: DockStackItem = {
	type: "stack",
	id: DockStackID.Projects,
	label: "Projects",
	icon: Folder,
	gradient: ["#5AC8FA", "#007AFF"],
	contents: [AppID.Yield, AppID.Debate, AppID.PassFX],
};

/**
 * Mobile dock items with project apps grouped into a stack.
 * Optimizes horizontal space on narrow screens.
 * Order: About, Projects (stack), Terminal, Contact, Settings
 */
export const MOBILE_DOCK_ITEMS: DockItem[] = [
	{
		type: "app",
		id: AppID.About,
		label: "About",
		iconSrc: "/assets/dock/about.png",
		backgroundColor: "#007AFF",
	},
	PROJECTS_STACK,
	{
		type: "app",
		id: AppID.Terminal,
		label: "Terminal",
		iconSrc: "/assets/dock/terminal.png",
		backgroundColor: "#000000",
	},
	{
		type: "app",
		id: AppID.Contact,
		label: "Contact",
		iconSrc: "/assets/dock/contact.png",
		backgroundColor: "#5AC8FA",
	},
	{
		type: "app",
		id: AppID.Settings,
		label: "Settings",
		iconSrc: "/assets/dock/settings.png",
		backgroundColor: "#636366",
	},
];

/**
 * Lookup map for app configurations by AppID.
 * Used by DockStack to resolve full item config for contained apps.
 */
export const APP_CONFIG_MAP: Record<AppID, DockAppItem | undefined> = DOCK_ITEMS.reduce(
	(acc, item) => {
		acc[item.id] = item;
		return acc;
	},
	{} as Record<AppID, DockAppItem | undefined>,
);
