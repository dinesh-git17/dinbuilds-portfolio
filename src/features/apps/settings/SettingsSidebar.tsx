"use client";

import clsx from "clsx";
import { ChevronRight, ImageIcon, InfoIcon, LayoutGridIcon } from "lucide-react";
import { memo } from "react";

import { useDeviceType } from "@/os/desktop/dock/useDeviceType";

/**
 * Available panel identifiers for Settings navigation.
 */
export type SettingsPanelId = "about" | "wallpaper" | "dock";

/**
 * Navigation item configuration with Finder-style metadata.
 */
interface NavItem {
	id: SettingsPanelId;
	label: string;
	description: string;
	icon: typeof InfoIcon;
	iconBg: string;
}

const NAV_ITEMS: NavItem[] = [
	{
		id: "about",
		label: "About",
		description: "System information and version",
		icon: InfoIcon,
		iconBg: "bg-blue-500",
	},
	{
		id: "wallpaper",
		label: "Wallpaper",
		description: "Change your background",
		icon: ImageIcon,
		iconBg: "bg-purple-500",
	},
	{
		id: "dock",
		label: "Dock",
		description: "Position, size, and behavior",
		icon: LayoutGridIcon,
		iconBg: "bg-orange-500",
	},
];

export interface SettingsSidebarProps {
	activePanel: SettingsPanelId;
	/** Callback triggered when user selects a navigation item. Handles both panel selection and view transitions. */
	onNavigate: (panel: SettingsPanelId) => void;
}

/**
 * Settings Sidebar - Frosted glass navigation panel.
 *
 * Desktop: Narrow sidebar with compact items.
 * Mobile: Finder-style cards with icons, titles, and descriptions.
 */
export const SettingsSidebar = memo(function SettingsSidebar({
	activePanel,
	onNavigate,
}: SettingsSidebarProps) {
	const deviceType = useDeviceType();
	const isMobile = deviceType === "mobile";

	if (isMobile) {
		return (
			<aside className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
				{NAV_ITEMS.map((item) => {
					const Icon = item.icon;
					const isActive = activePanel === item.id;

					return (
						<button
							key={item.id}
							type="button"
							onClick={() => onNavigate(item.id)}
							className={clsx(
								"flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-all",
								"outline-none select-none [-webkit-tap-highlight-color:transparent]",
								"focus-visible:ring-2 focus-visible:ring-blue-500",
								"active:scale-[0.98]",
								"bg-white/5 hover:bg-white/10",
							)}
							aria-current={isActive ? "page" : undefined}
						>
							<span
								className={clsx(
									"flex size-12 shrink-0 items-center justify-center rounded-xl shadow-lg",
									item.iconBg,
								)}
							>
								<Icon className="size-6 text-white" aria-hidden="true" />
							</span>
							<div className="flex min-w-0 flex-1 flex-col gap-0.5">
								<span className="text-[16px] font-semibold text-white">{item.label}</span>
								<span className="text-[13px] text-white/50">{item.description}</span>
							</div>
							<ChevronRight className="size-5 shrink-0 text-white/30" aria-hidden="true" />
						</button>
					);
				})}
			</aside>
		);
	}

	return (
		<aside className="flex w-48 shrink-0 flex-col border-r border-white/10 bg-white/5 backdrop-blur-md">
			<nav className="flex flex-col gap-1 p-3">
				{NAV_ITEMS.map((item) => {
					const Icon = item.icon;
					const isActive = activePanel === item.id;

					return (
						<button
							key={item.id}
							type="button"
							onClick={() => onNavigate(item.id)}
							className={clsx(
								"flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
								"hover:bg-white/10",
								isActive ? "bg-white/15 text-white" : "text-white/60 hover:text-white/80",
							)}
							aria-current={isActive ? "page" : undefined}
						>
							<Icon className="size-4 shrink-0" aria-hidden="true" />
							<span>{item.label}</span>
						</button>
					);
				})}
			</nav>
		</aside>
	);
});
