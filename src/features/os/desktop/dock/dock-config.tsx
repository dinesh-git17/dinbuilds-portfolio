import { type LucideIcon, Mail, Terminal, User } from "lucide-react";

import { AppID } from "@/os/store";

/**
 * Dock item configuration with visual styling.
 * Supports either a Lucide icon with gradient or a custom image.
 */
export interface DockItemConfig {
	id: AppID;
	label: string;
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
 * Apps displayed in the dock, in order.
 * Each has a unique gradient inspired by macOS app icons.
 */
export const DOCK_ITEMS: DockItemConfig[] = [
	{
		id: AppID.About,
		label: "About",
		icon: User,
		gradient: ["#5AC8FA", "#007AFF"], // Blue - like Finder
	},
	{
		id: AppID.Yield,
		label: "Yield",
		iconSrc: "/assets/apps/yield.png",
		backgroundColor: "#1E1B4B",
	},
	{
		id: AppID.Debate,
		label: "Debate Lab",
		iconSrc: "/assets/apps/debate_lab.png",
		backgroundColor: "#F5F5F4", // Off-white
		iconPadding: "6px",
	},
	{
		id: AppID.Terminal,
		label: "Terminal",
		icon: Terminal,
		gradient: ["#1C1C1E", "#000000"], // Dark - like Terminal
	},
	{
		id: AppID.Contact,
		label: "Contact",
		icon: Mail,
		gradient: ["#64D2FF", "#0A84FF"], // Light blue - like Mail
	},
];
