"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { memo, useEffect, useRef } from "react";
import type { FAQCategoryId } from "./FAQSidebar";
import type { QAEntry } from "./faq-content";
import { useFAQContent } from "./useFAQContent";

/**
 * Content transition variants.
 * Cross-fade with subtle vertical movement.
 */
const contentVariants = {
	initial: { opacity: 0, y: 10 },
	animate: { opacity: 1, y: 0 },
	exit: { opacity: 0, y: -10 },
};

export interface FAQContentProps {
	activeCategory: FAQCategoryId;
}

/**
 * FAQ Content Panel - Displays Q&A entries with animated transitions.
 *
 * Features:
 * - Fetches content from markdown files in public/faq/
 * - Caches content to prevent refetching on category switches
 * - Uses AnimatePresence for smooth cross-fade transitions
 * - Shows loading state while fetching
 * - Resets scroll position when switching categories
 */
export const FAQContent = memo(function FAQContent({ activeCategory }: FAQContentProps) {
	const { entries, isLoading } = useFAQContent(activeCategory);
	const scrollContainerRef = useRef<HTMLDivElement>(null);

	// Reset scroll position when category changes
	// biome-ignore lint/correctness/useExhaustiveDependencies: Intentionally trigger on category change
	useEffect(() => {
		scrollContainerRef.current?.scrollTo({ top: 0 });
	}, [activeCategory]);

	return (
		<div ref={scrollContainerRef} className="flex-1 overflow-auto p-5">
			<AnimatePresence mode="wait">
				{isLoading ? (
					<motion.div
						key="loading"
						variants={contentVariants}
						initial="initial"
						animate="animate"
						exit="exit"
						transition={{ duration: 0.15, ease: "easeOut" }}
						className="flex h-32 items-center justify-center"
					>
						<Loader2 className="size-5 animate-spin text-white/30" />
					</motion.div>
				) : entries.length === 0 ? (
					<motion.div
						key="empty"
						variants={contentVariants}
						initial="initial"
						animate="animate"
						exit="exit"
						transition={{ duration: 0.15, ease: "easeOut" }}
						className="flex h-32 items-center justify-center"
					>
						<p className="text-sm text-white/30">No content available.</p>
					</motion.div>
				) : (
					<motion.div
						key={activeCategory}
						variants={contentVariants}
						initial="initial"
						animate="animate"
						exit="exit"
						transition={{ duration: 0.15, ease: "easeOut" }}
						className="space-y-6"
					>
						{entries.map((entry) => (
							<QAItem key={entry.question} entry={entry} />
						))}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
});

interface QAItemProps {
	entry: QAEntry;
}

/**
 * Individual Q&A item with question and answer.
 *
 * Visuals:
 * - Question: Bold, slightly larger, white text
 * - Answer: Grey/secondary text, relaxed line-height
 * - Spacing: Generous padding between pairs (handled by parent space-y-6)
 */
function QAItem({ entry }: QAItemProps) {
	return (
		<div className="space-y-2">
			<h3 className="text-sm font-medium text-white">{entry.question}</h3>
			<p className="text-sm leading-relaxed text-white/50">{entry.answer}</p>
		</div>
	);
}
