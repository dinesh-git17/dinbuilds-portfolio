import type { FAQCategoryId } from "./FAQSidebar";

/**
 * Single Q&A entry structure.
 */
export interface QAEntry {
	question: string;
	answer: string;
}

/**
 * Configuration mapping categories to their markdown file paths.
 * Files are located in public/faq/ and fetched at runtime.
 */
export const FAQ_FILE_MAP: Record<FAQCategoryId, string> = {
	about: "/faq/about.md",
	technology: "/faq/projects-tech.md",
	usage: "/faq/using-this-portfolio.md",
};

/**
 * Parse markdown content into Q&A entries.
 *
 * Expected format:
 * ```
 * ## Section Header (ignored)
 *
 * **Question text?**
 * Answer text spanning one or more lines.
 *
 * **Next question?**
 * Next answer.
 * ```
 *
 * @param markdown - Raw markdown content
 * @returns Array of Q&A entries
 */
export function parseFAQMarkdown(markdown: string): QAEntry[] {
	const entries: QAEntry[] = [];

	// Split by bold question markers
	// Pattern: **Question?** followed by answer text
	const questionPattern = /\*\*([^*]+\??)\*\*\s*\n?([\s\S]*?)(?=\n\*\*[^*]+\*\*|\n##|$)/g;

	// Use matchAll for cleaner iteration
	const matches = markdown.matchAll(questionPattern);

	for (const match of matches) {
		const questionMatch = match[1];
		const answerMatch = match[2];

		// Skip if capture groups are missing
		if (!questionMatch || !answerMatch) {
			continue;
		}

		const question = questionMatch.trim();
		const answer = answerMatch.trim();

		// Skip empty answers or section headers
		if (answer && !answer.startsWith("##")) {
			entries.push({ question, answer });
		}
	}

	return entries;
}

/**
 * Fetch and parse FAQ content for a category.
 *
 * @param category - The FAQ category to fetch
 * @returns Promise resolving to array of Q&A entries
 */
export async function fetchFAQContent(category: FAQCategoryId): Promise<QAEntry[]> {
	const filePath = FAQ_FILE_MAP[category];

	try {
		const response = await fetch(filePath);
		if (!response.ok) {
			throw new Error(`Failed to fetch FAQ content: ${response.status}`);
		}

		const markdown = await response.text();
		return parseFAQMarkdown(markdown);
	} catch {
		// Return empty array on error - UI will show fallback
		return [];
	}
}
