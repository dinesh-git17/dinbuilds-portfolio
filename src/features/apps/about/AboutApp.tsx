"use client";

import { memo, useState } from "react";

import { ProfileSidebar } from "./ProfileSidebar";
import { TabContent } from "./TabContent";
import { type AboutTabId, TabNavigation } from "./TabNavigation";

/**
 * About App - Identity Module
 *
 * Two-column layout:
 * - Left: Profile sidebar ("Player Card") with identity info
 * - Right: Tabbed content area (Overview, Stack, Experience)
 */
export const AboutApp = memo(function AboutApp() {
	const [activeTab, setActiveTab] = useState<AboutTabId>("overview");

	return (
		<div className="flex h-full">
			{/* Left Column - Player Card */}
			<ProfileSidebar className="w-44 shrink-0" />

			{/* Right Column - Tabbed Content Area */}
			<main className="flex flex-1 flex-col overflow-hidden">
				<TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
				<TabContent activeTab={activeTab} />
			</main>
		</div>
	);
});
