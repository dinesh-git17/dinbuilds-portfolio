"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { memo, useEffect, useRef } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { FAQCategoryId } from "./FAQSidebar";
import { isDocumentCategory, type QAEntry } from "./faq-content";
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
 * FAQ Content Panel - Displays Q&A entries or documents with animated transitions.
 *
 * Features:
 * - Fetches content from markdown files in public/faq/
 * - Caches content to prevent refetching on category switches
 * - Uses AnimatePresence for smooth cross-fade transitions
 * - Shows loading state while fetching
 * - Resets scroll position when switching categories
 * - Supports both Q&A format and full document rendering
 */
export const FAQContent = memo(function FAQContent({ activeCategory }: FAQContentProps) {
	const { entries, document, isLoading } = useFAQContent(activeCategory);
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const isDocument = isDocumentCategory(activeCategory);

	// Reset scroll position when category changes
	// biome-ignore lint/correctness/useExhaustiveDependencies: Intentionally trigger on category change
	useEffect(() => {
		scrollContainerRef.current?.scrollTo({ top: 0 });
	}, [activeCategory]);

	const hasContent = isDocument ? !!document : entries.length > 0;

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
				) : !hasContent ? (
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
				) : isDocument && document ? (
					<motion.div
						key={activeCategory}
						variants={contentVariants}
						initial="initial"
						animate="animate"
						exit="exit"
						transition={{ duration: 0.15, ease: "easeOut" }}
						className="prose prose-invert prose-sm max-w-none"
					>
						<Markdown
							remarkPlugins={[remarkGfm]}
							components={{
								h1: ({ children }) => (
									<h1 className="mb-4 text-lg font-semibold text-white">{children}</h1>
								),
								h2: ({ children }) => (
									<h2 className="mb-3 mt-6 text-base font-semibold text-white">{children}</h2>
								),
								h3: ({ children }) => (
									<h3 className="mb-2 mt-4 text-sm font-medium text-white">{children}</h3>
								),
								p: ({ children }) => (
									<p className="mb-3 text-sm leading-relaxed text-white/60">{children}</p>
								),
								ul: ({ children }) => (
									<ul className="mb-3 list-disc space-y-1 pl-4 text-sm text-white/60">
										{children}
									</ul>
								),
								li: ({ children }) => <li className="leading-relaxed">{children}</li>,
								strong: ({ children }) => (
									<strong className="font-medium text-white/80">{children}</strong>
								),
								hr: () => <hr className="my-6 border-white/10" />,
								a: ({ href, children }) => (
									<a
										href={href}
										className="text-white/70 underline underline-offset-2 hover:text-white"
									>
										{children}
									</a>
								),
							}}
						>
							{document}
						</Markdown>
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
