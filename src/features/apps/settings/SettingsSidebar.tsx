"use client";

import clsx from "clsx";
import { ImageIcon, InfoIcon } from "lucide-react";
import { memo } from "react";

/**
 * Available panel identifiers for Settings navigation.
 */
export type SettingsPanelId = "about" | "wallpaper";

/**
 * Navigation item configuration.
 */
interface NavItem {
	id: SettingsPanelId;
	label: string;
	icon: typeof InfoIcon;
}

const NAV_ITEMS: NavItem[] = [
	{ id: "about", label: "About", icon: InfoIcon },
	{ id: "wallpaper", label: "Wallpaper", icon: ImageIcon },
];

export interface SettingsSidebarProps {
	activePanel: SettingsPanelId;
	onPanelChange: (panel: SettingsPanelId) => void;
}

/**
 * Settings Sidebar - Frosted glass navigation panel.
 *
 * Displays navigation items with icons and active state highlighting.
 * Uses glassmorphism styling per design system.
 */
export const SettingsSidebar = memo(function SettingsSidebar({
	activePanel,
	onPanelChange,
}: SettingsSidebarProps) {
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
							onClick={() => onPanelChange(item.id)}
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
