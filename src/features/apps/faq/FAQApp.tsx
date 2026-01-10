"use client";

import { memo, useState } from "react";

import { FAQContent } from "./FAQContent";
import { FAQHeader } from "./FAQHeader";
import { type FAQCategoryId, FAQSidebar } from "./FAQSidebar";
import { FAQTabBar } from "./FAQTabBar";

/**
 * FAQ App - System Manual
 *
 * Provides documentation and reference for the portfolio OS.
 *
 * Desktop layout (md+):
 * - Left: Navigation sidebar with category selection
 * - Right: Scrollable Q&A content area
 *
 * Mobile layout:
 * - Top: Compact header with icon and title
 * - Middle: Horizontal scrollable tab bar (pills)
 * - Bottom: Scrollable Q&A content area
 */
export const FAQApp = memo(function FAQApp() {
	const [activeCategory, setActiveCategory] = useState<FAQCategoryId>("about");

	return (
		<div className="flex h-full flex-col md:flex-row">
			{/* Desktop: Left Sidebar - Navigation (hidden on mobile) */}
			<FAQSidebar
				activeCategory={activeCategory}
				onCategoryChange={setActiveCategory}
				className="hidden w-48 shrink-0 md:flex"
			/>

			{/* Mobile: Header + Tab Bar (hidden on desktop) */}
			<div className="flex flex-col md:hidden">
				<FAQHeader />
				<FAQTabBar activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
			</div>

			{/* Content Area - Always visible */}
			<main className="flex flex-1 flex-col overflow-hidden">
				<FAQContent activeCategory={activeCategory} />
			</main>
		</div>
	);
});
