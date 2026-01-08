import { BarChart3, type LucideIcon, Mail, MessageSquare, Terminal, User } from "lucide-react";

import { AppID } from "@/os/store";

/**
 * Dock item configuration with visual styling.
 */
export interface DockItemConfig {
	id: AppID;
	label: string;
	icon: LucideIcon;
	/** Gradient colors [from, to] for the icon background */
	gradient: [string, string];
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
		icon: BarChart3,
		gradient: ["#34C759", "#248A3D"], // Green - like Numbers
	},
	{
		id: AppID.Debate,
		label: "Debate Lab",
		icon: MessageSquare,
		gradient: ["#FF9F0A", "#FF6B00"], // Orange - like Messages
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
