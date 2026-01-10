"use client";

import { useEffect, useState } from "react";
import type { FAQCategoryId } from "./FAQSidebar";
import { fetchFAQContent, type QAEntry } from "./faq-content";

/**
 * Content cache to prevent refetching on category switches.
 * Persists across component re-renders within the same session.
 */
const contentCache = new Map<FAQCategoryId, QAEntry[]>();

/**
 * Hook state for FAQ content loading.
 */
interface FAQContentState {
	entries: QAEntry[];
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
 *
 * @param category - The FAQ category to load
 * @returns Object with entries, loading state, and error
 */
export function useFAQContent(category: FAQCategoryId): FAQContentState {
	const [state, setState] = useState<FAQContentState>(() => {
		// Check cache on initial render
		const cached = contentCache.get(category);
		return {
			entries: cached ?? [],
			isLoading: !cached,
			error: null,
		};
	});

	useEffect(() => {
		// Check cache first
		const cached = contentCache.get(category);
		if (cached) {
			setState({ entries: cached, isLoading: false, error: null });
			return;
		}

		// Fetch content
		let cancelled = false;

		setState((prev) => ({ ...prev, isLoading: true, error: null }));

		fetchFAQContent(category)
			.then((entries) => {
				if (cancelled) return;

				// Cache the result
				contentCache.set(category, entries);
				setState({ entries, isLoading: false, error: null });
			})
			.catch((err: unknown) => {
				if (cancelled) return;

				const message = err instanceof Error ? err.message : "Failed to load content";
				setState({ entries: [], isLoading: false, error: message });
			});

		return () => {
			cancelled = true;
		};
	}, [category]);

	return state;
}
