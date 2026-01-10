"use client";

import { memo, useCallback, useState } from "react";

import { AnalyticsEvent, trackEvent } from "@/lib/analytics";

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

	const handleTabChange = useCallback(
		(newTab: AboutTabId) => {
			if (newTab !== activeTab) {
				trackEvent(AnalyticsEvent.ABOUT_TAB_SWITCHED, {
					from_tab: activeTab,
					to_tab: newTab,
				});
			}
			setActiveTab(newTab);
		},
		[activeTab],
	);

	return (
		<div className="flex h-full flex-col md:flex-row">
			{/* Top (Mobile) / Left (Desktop) - Player Card */}
			<ProfileSidebar className="w-full shrink-0 md:w-44" />

			{/* Right Column - Tabbed Content Area */}
			<main className="flex flex-1 flex-col overflow-hidden">
				<TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />
				<TabContent activeTab={activeTab} />
			</main>
		</div>
	);
});
