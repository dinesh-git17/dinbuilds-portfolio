/**
 * Content Module — Server-Side Content Utilities
 *
 * Re-exports server-side content fetching utilities.
 * These are server-only modules for use in Server Components.
 *
 * Story 5 additions:
 * - FAQ content fetching and parsing
 * - Resume semantic parsing
 */

export {
	type ContentFetchResult,
	fetchAllFAQContent,
	fetchMarkdownContent,
	fetchParsedResume,
	hydrateWindowContent,
	isAllowedContentPath,
	type ParsedResume,
	parseFAQMarkdown,
	parseResumeMarkdown,
	type ResumeSection,
	safeFetchMarkdownContent,
} from "./server";
