"use client";

import { memo, useState } from "react";

import { AboutPanel } from "./panels/AboutPanel";
import { WallpaperPanel } from "./panels/WallpaperPanel";
import { type SettingsPanelId, SettingsSidebar } from "./SettingsSidebar";

/**
 * Settings App - System Preferences
 *
 * Two-column layout:
 * - Left: Frosted glass sidebar with navigation icons
 * - Right: Active panel content (About or Wallpaper)
 */
export const SettingsApp = memo(function SettingsApp() {
	const [activePanel, setActivePanel] = useState<SettingsPanelId>("about");

	return (
		<div className="flex h-full">
			{/* Left Column - Navigation Sidebar */}
			<SettingsSidebar activePanel={activePanel} onPanelChange={setActivePanel} />

			{/* Right Column - Panel Content */}
			<main className="flex-1 overflow-y-auto p-6">
				{activePanel === "about" && <AboutPanel />}
				{activePanel === "wallpaper" && <WallpaperPanel />}
			</main>
		</div>
	);
});
