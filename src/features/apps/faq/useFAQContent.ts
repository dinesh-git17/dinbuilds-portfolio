"use client";

import { useEffect, useState } from "react";
import type { FAQCategoryId } from "./FAQSidebar";
import {
	fetchDocumentContent,
	fetchFAQContent,
	isDocumentCategory,
	type QAEntry,
} from "./faq-content";

/**
 * Content cache to prevent refetching on category switches.
 * Persists across component re-renders within the same session.
 */
const contentCache = new Map<FAQCategoryId, QAEntry[]>();

/**
 * Document cache for full markdown content.
 */
const documentCache = new Map<FAQCategoryId, string>();

/**
 * Hook state for FAQ content loading.
 */
interface FAQContentState {
	entries: QAEntry[];
	document: string | null;
	isLoading: boolean;
	error: string | null;
}

/**
 * Hook to fetch and cache FAQ content for a category.
 *
 * Features:
 * - Caches content to prevent refetching on category switches
 * - Returns loading state for UI feedback
 * - Handles errors gracefully
 * - Supports both Q&A format and full document categories
 *
 * @param category - The FAQ category to load
 * @returns Object with entries (for Q&A), document (for full docs), loading state, and error
 */
export function useFAQContent(category: FAQCategoryId): FAQContentState {
	const isDocument = isDocumentCategory(category);

	const [state, setState] = useState<FAQContentState>(() => {
		// Check appropriate cache on initial render
		if (isDocument) {
			const cached = documentCache.get(category);
			return {
				entries: [],
				document: cached ?? null,
				isLoading: !cached,
				error: null,
			};
		}

		const cached = contentCache.get(category);
		return {
			entries: cached ?? [],
			document: null,
			isLoading: !cached,
			error: null,
		};
	});

	useEffect(() => {
		let cancelled = false;

		if (isDocument) {
			// Handle document categories
			const cached = documentCache.get(category);
			if (cached) {
				setState({ entries: [], document: cached, isLoading: false, error: null });
				return;
			}

			setState((prev) => ({ ...prev, isLoading: true, error: null }));

			fetchDocumentContent(category)
				.then((content) => {
					if (cancelled) return;

					documentCache.set(category, content);
					setState({ entries: [], document: content, isLoading: false, error: null });
				})
				.catch((err: unknown) => {
					if (cancelled) return;

					const message = err instanceof Error ? err.message : "Failed to load content";
					setState({ entries: [], document: null, isLoading: false, error: message });
				});
		} else {
			// Handle Q&A categories
			const cached = contentCache.get(category);
			if (cached) {
				setState({ entries: cached, document: null, isLoading: false, error: null });
				return;
			}

			setState((prev) => ({ ...prev, isLoading: true, error: null }));

			fetchFAQContent(category)
				.then((entries) => {
					if (cancelled) return;

					contentCache.set(category, entries);
					setState({ entries, document: null, isLoading: false, error: null });
				})
				.catch((err: unknown) => {
					if (cancelled) return;

					const message = err instanceof Error ? err.message : "Failed to load content";
					setState({ entries: [], document: null, isLoading: false, error: message });
				});
		}

		return () => {
			cancelled = true;
		};
	}, [category, isDocument]);

	return state;
}
