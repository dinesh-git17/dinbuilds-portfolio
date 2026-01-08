"use client";

import clsx from "clsx";
import { motion } from "framer-motion";
import { memo, useCallback } from "react";

/**
 * Available tab identifiers for the About app.
 */
export type AboutTabId = "overview" | "stack" | "experience";

/**
 * Tab configuration with display label.
 */
interface TabConfig {
	id: AboutTabId;
	label: string;
}

const TABS: TabConfig[] = [
	{ id: "overview", label: "Overview" },
	{ id: "stack", label: "Stack" },
	{ id: "experience", label: "Experience" },
];

export interface TabNavigationProps {
	activeTab: AboutTabId;
	onTabChange: (tab: AboutTabId) => void;
}

/**
 * Tab navigation with animated sliding indicator.
 *
 * Uses Framer Motion `layoutId` to smoothly animate the active
 * indicator between tabs.
 */
export const TabNavigation = memo(function TabNavigation({
	activeTab,
	onTabChange,
}: TabNavigationProps) {
	return (
		<div
			role="tablist"
			aria-label="About sections"
			className="flex gap-1 border-b border-white/5 px-5"
		>
			{TABS.map((tab) => (
				<TabButton key={tab.id} tab={tab} isActive={activeTab === tab.id} onClick={onTabChange} />
			))}
		</div>
	);
});

interface TabButtonProps {
	tab: TabConfig;
	isActive: boolean;
	onClick: (id: AboutTabId) => void;
}

function TabButton({ tab, isActive, onClick }: TabButtonProps) {
	const handleClick = useCallback(() => {
		onClick(tab.id);
	}, [onClick, tab.id]);

	return (
		<button
			type="button"
			role="tab"
			aria-selected={isActive}
			aria-controls={`panel-${tab.id}`}
			id={`tab-${tab.id}`}
			onClick={handleClick}
			className={clsx(
				"relative px-4 py-3 text-xs font-medium transition-colors",
				isActive ? "text-white" : "text-white/40 hover:text-white/60",
			)}
		>
			{tab.label}
			{isActive && (
				<motion.div
					layoutId="about-tab-indicator"
					className="absolute inset-x-0 -bottom-px h-px bg-white/60"
					transition={{
						type: "spring",
						stiffness: 500,
						damping: 35,
					}}
				/>
			)}
		</button>
	);
}
