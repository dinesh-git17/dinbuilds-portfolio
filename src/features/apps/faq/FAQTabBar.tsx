"use client";

import clsx from "clsx";
import { motion } from "framer-motion";
import { BookOpen, Code, Compass } from "lucide-react";
import { memo, useCallback } from "react";

import type { FAQCategoryId } from "./FAQSidebar";

/**
 * Category configuration with display metadata.
 */
interface CategoryConfig {
	id: FAQCategoryId;
	label: string;
	icon: typeof BookOpen;
}

const CATEGORIES: CategoryConfig[] = [
	{ id: "about", label: "About", icon: BookOpen },
	{ id: "technology", label: "Technology", icon: Code },
	{ id: "usage", label: "Usage", icon: Compass },
];

export interface FAQTabBarProps {
	activeCategory: FAQCategoryId;
	onCategoryChange: (category: FAQCategoryId) => void;
}

/**
 * FAQ Tab Bar - Horizontal scrollable pill tabs for mobile navigation.
 *
 * Features:
 * - Horizontal scroll for overflow on narrow screens
 * - Pill-style active indicator with spring animation
 * - Icons + labels for each category
 */
export const FAQTabBar = memo(function FAQTabBar({
	activeCategory,
	onCategoryChange,
}: FAQTabBarProps) {
	return (
		<div
			role="tablist"
			aria-label="FAQ categories"
			className="flex gap-2 overflow-x-auto border-b border-white/5 px-4 py-3 scrollbar-none"
		>
			{CATEGORIES.map((category) => (
				<TabPill
					key={category.id}
					category={category}
					isActive={activeCategory === category.id}
					onClick={onCategoryChange}
				/>
			))}
		</div>
	);
});

interface TabPillProps {
	category: CategoryConfig;
	isActive: boolean;
	onClick: (id: FAQCategoryId) => void;
}

/**
 * Individual tab pill with icon and label.
 */
function TabPill({ category, isActive, onClick }: TabPillProps) {
	const Icon = category.icon;

	const handleClick = useCallback(() => {
		onClick(category.id);
	}, [onClick, category.id]);

	return (
		<button
			type="button"
			role="tab"
			aria-selected={isActive}
			onClick={handleClick}
			className={clsx(
				"relative flex shrink-0 items-center gap-2 rounded-full px-4 py-2",
				"text-xs font-medium transition-colors",
				isActive ? "text-white" : "text-white/50",
			)}
		>
			{/* Active background pill */}
			{isActive && (
				<motion.div
					layoutId="faq-tab-pill"
					className="absolute inset-0 rounded-full bg-white/10"
					transition={{
						type: "spring",
						stiffness: 500,
						damping: 35,
					}}
				/>
			)}
			<Icon className="relative z-10 size-3.5" strokeWidth={1.5} />
			<span className="relative z-10">{category.label}</span>
		</button>
	);
}
