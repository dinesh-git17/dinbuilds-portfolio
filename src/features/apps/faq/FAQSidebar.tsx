"use client";

import clsx from "clsx";
import { motion } from "framer-motion";
import { BookOpen, CircleHelp, Code, Compass } from "lucide-react";
import { memo, useCallback } from "react";

/**
 * FAQ category identifiers.
 */
export type FAQCategoryId = "about" | "technology" | "usage";

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

export interface FAQSidebarProps {
	activeCategory: FAQCategoryId;
	onCategoryChange: (category: FAQCategoryId) => void;
	className?: string;
}

/**
 * FAQ Sidebar - Navigation panel for the System Manual.
 *
 * Features:
 * - App header with icon and tagline
 * - Category navigation with animated active indicator
 * - Consistent styling with OS design language
 */
export const FAQSidebar = memo(function FAQSidebar({
	activeCategory,
	onCategoryChange,
	className,
}: FAQSidebarProps) {
	return (
		<aside
			className={clsx(
				"flex flex-col gap-6 p-5",
				"border-b border-white/5 md:border-b-0 md:border-r",
				"bg-white/[0.02]",
				className,
			)}
		>
			{/* Header Section */}
			<div className="flex flex-col gap-2">
				<div className="flex items-center gap-3">
					<CircleHelp className="size-8 text-white/40" strokeWidth={1.25} />
					<div>
						<h1 className="text-sm font-semibold text-white">System Manual</h1>
						<p className="text-[10px] text-white/40">Documentation & Reference</p>
					</div>
				</div>
			</div>

			{/* Divider */}
			<div className="h-px w-full bg-white/5" />

			{/* Navigation */}
			<nav aria-label="FAQ categories" className="flex flex-col gap-1">
				{CATEGORIES.map((category) => (
					<CategoryButton
						key={category.id}
						category={category}
						isActive={activeCategory === category.id}
						onClick={onCategoryChange}
					/>
				))}
			</nav>
		</aside>
	);
});

interface CategoryButtonProps {
	category: CategoryConfig;
	isActive: boolean;
	onClick: (id: FAQCategoryId) => void;
}

/**
 * Individual category navigation button with animated active state.
 */
function CategoryButton({ category, isActive, onClick }: CategoryButtonProps) {
	const Icon = category.icon;

	const handleClick = useCallback(() => {
		onClick(category.id);
	}, [onClick, category.id]);

	return (
		<button
			type="button"
			onClick={handleClick}
			className={clsx(
				"relative flex items-center gap-3 rounded-md px-3 py-2.5",
				"text-left text-xs font-medium transition-colors",
				isActive ? "text-white" : "text-white/50 hover:text-white/70",
			)}
		>
			{/* Active background pill */}
			{isActive && (
				<motion.div
					layoutId="faq-category-indicator"
					className="absolute inset-0 rounded-md bg-white/10"
					transition={{
						type: "spring",
						stiffness: 500,
						damping: 35,
					}}
				/>
			)}
			<Icon className="relative z-10 size-4" strokeWidth={1.5} />
			<span className="relative z-10">{category.label}</span>
		</button>
	);
}
