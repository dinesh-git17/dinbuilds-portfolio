/**
 * Server-Side Content Fetching — SEO-01 Story 1 + Story 5
 *
 * Utilities for fetching markdown content on the server.
 * Used to pre-render content in the initial HTML response for SEO.
 *
 * These functions are server-only and use Node.js fs module directly.
 * Content is read from the /public directory at build/request time.
 *
 * Story 5 Additions:
 * - FAQ content fetching and parsing
 * - Resume semantic parsing
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { FAQEntry } from "@/lib/seo";

/**
 * Result of a server-side content fetch operation.
 */
export interface ContentFetchResult {
	/** Whether the fetch was successful */
	success: boolean;
	/** The content string if successful, undefined otherwise */
	content?: string;
	/** Error message if fetch failed */
	error?: string;
}

/**
 * Resolve a public URL path to an absolute filesystem path.
 *
 * @param publicPath - Path relative to /public (e.g., "/readmes/yield.md")
 * @returns Absolute filesystem path
 */
function resolvePublicPath(publicPath: string): string {
	// Remove leading slash if present
	const normalizedPath = publicPath.startsWith("/") ? publicPath.slice(1) : publicPath;
	return join(process.cwd(), "public", normalizedPath);
}

/**
 * Fetch markdown content from the filesystem on the server.
 *
 * This function is designed for use in Server Components to pre-load
 * content that will be rendered in the initial HTML response.
 *
 * @param contentUrl - URL path to the content file (relative to /public)
 * @returns Promise resolving to the content fetch result
 *
 * @example
 * ```ts
 * // In a Server Component
 * const result = await fetchMarkdownContent("/readmes/yield.md");
 * if (result.success) {
 *   // Pass result.content to client component via props
 * }
 * ```
 */
export async function fetchMarkdownContent(contentUrl: string): Promise<ContentFetchResult> {
	try {
		const absolutePath = resolvePublicPath(contentUrl);
		const content = await readFile(absolutePath, "utf-8");

		return {
			success: true,
			content,
		};
	} catch (error) {
		const message = error instanceof Error ? error.message : "Failed to read content file";

		return {
			success: false,
			error: message,
		};
	}
}

/**
 * Validate that a content URL is within allowed paths.
 * Prevents directory traversal attacks.
 *
 * @param contentUrl - URL path to validate
 * @returns true if the path is allowed
 */
export function isAllowedContentPath(contentUrl: string): boolean {
	// Normalize and check for traversal attempts
	const normalized = contentUrl.toLowerCase();

	// Block directory traversal
	if (normalized.includes("..") || normalized.includes("//")) {
		return false;
	}

	// Allow only specific directories
	const allowedPrefixes = ["/readmes/", "/faq/"];
	return allowedPrefixes.some((prefix) => normalized.startsWith(prefix));
}

/**
 * Safely fetch markdown content with path validation.
 *
 * Combines path validation and content fetching for use in
 * server components where user-influenced paths might be involved.
 *
 * @param contentUrl - URL path to the content file
 * @returns Promise resolving to the content fetch result
 */
export async function safeFetchMarkdownContent(contentUrl: string): Promise<ContentFetchResult> {
	if (!isAllowedContentPath(contentUrl)) {
		return {
			success: false,
			error: "Content path not allowed",
		};
	}

	return fetchMarkdownContent(contentUrl);
}

/**
 * Window props shape expected by the hydration function.
 */
interface HydrateableWindowProps {
	url?: string;
	title?: string;
	folderId?: string;
	initialTab?: string;
	ssrContent?: string;
}

/**
 * Window instance shape expected by the hydration function.
 */
interface HydrateableWindow {
	id: string;
	status: "open" | "minimized";
	position: { x: number; y: number };
	size: { width: number; height: number };
	props?: HydrateableWindowProps;
	openedAt: number;
}

/**
 * Hydration state shape expected by the hydration function.
 */
interface HydrateableState {
	windows: HydrateableWindow[];
	activeWindowId: unknown;
	fullscreenWindowId: unknown;
}

/**
 * Hydrate window content for SSR.
 *
 * Takes URL-parsed hydration state and fetches content for any
 * windows that need pre-loaded content (e.g., MarkdownViewer).
 * Returns the same type as input to preserve type information.
 *
 * @param hydrationState - Initial state from URL parsing
 * @returns Promise resolving to state with content hydrated
 *
 * @example
 * ```ts
 * // In page.tsx (Server Component)
 * const initialState = parseURLToState(params);
 * const hydratedState = await hydrateWindowContent(initialState);
 * ```
 */
export async function hydrateWindowContent<T extends HydrateableState>(
	hydrationState: T,
): Promise<T> {
	// If no windows, return as-is
	if (hydrationState.windows.length === 0) {
		return hydrationState;
	}

	// Process each window and fetch content where needed
	const hydratedWindows = await Promise.all(
		hydrationState.windows.map(async (window) => {
			// Check if this is a MarkdownViewer with a URL
			const url = window.props?.url;
			if (window.id === "app.markdown" && url) {
				const result = await safeFetchMarkdownContent(url);
				if (result.success && result.content) {
					return {
						...window,
						props: {
							...window.props,
							ssrContent: result.content,
						},
					};
				}
			}
			return window;
		}),
	);

	return {
		...hydrationState,
		windows: hydratedWindows,
	} as T;
}

/**
 * FAQ category file mappings (Story 5).
 * Maps category IDs to their markdown file paths.
 */
const FAQ_FILES: Record<string, string> = {
	about: "/faq/about.md",
	technology: "/faq/projects-tech.md",
	usage: "/faq/using-this-portfolio.md",
};

/**
 * Parse markdown content into FAQ entries.
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
 * @returns Array of FAQ entries
 */
export function parseFAQMarkdown(markdown: string): FAQEntry[] {
	const entries: FAQEntry[] = [];

	// Pattern: **Question?** followed by answer text
	const questionPattern = /\*\*([^*]+\??)\*\*\s*\n?([\s\S]*?)(?=\n\*\*[^*]+\*\*|\n##|$)/g;

	const matches = markdown.matchAll(questionPattern);

	for (const match of matches) {
		const questionMatch = match[1];
		const answerMatch = match[2];

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
 * Fetch all FAQ content from the server (Story 5).
 *
 * Reads all FAQ markdown files and parses them into structured entries.
 * Used for SSR content projection and FAQPage schema generation.
 *
 * @returns Promise resolving to array of all FAQ entries
 */
export async function fetchAllFAQContent(): Promise<FAQEntry[]> {
	const allEntries: FAQEntry[] = [];

	for (const [_category, filePath] of Object.entries(FAQ_FILES)) {
		try {
			const result = await fetchMarkdownContent(filePath);
			if (result.success && result.content) {
				const entries = parseFAQMarkdown(result.content);
				allEntries.push(...entries);
			}
		} catch {
			// Continue with other files if one fails
		}
	}

	return allEntries;
}

/**
 * Resume section structure for semantic parsing (Story 5).
 */
export interface ResumeSection {
	title: string;
	items: string[];
}

/**
 * Parsed resume structure for semantic rendering (Story 5).
 */
export interface ParsedResume {
	name: string;
	title: string;
	summary: string;
	skills: Record<string, string>;
	projects: ResumeSection[];
	experience: ResumeSection[];
}

/**
 * Parse resume markdown into semantic sections (Story 5).
 *
 * Extracts structured data from resume.md for semantic HTML rendering.
 * Enables crawlers to understand resume structure and content hierarchy.
 *
 * @param markdown - Raw resume markdown content
 * @returns Parsed resume structure
 */
export function parseResumeMarkdown(markdown: string): ParsedResume {
	const lines = markdown.split("\n");

	const result: ParsedResume = {
		name: "",
		title: "",
		summary: "",
		skills: {},
		projects: [],
		experience: [],
	};

	// Extract name from first heading
	const nameMatch = markdown.match(/^#\s+(.+)/m);
	if (nameMatch?.[1]) {
		result.name = nameMatch[1].trim();
	}

	// Extract title from bold text after name
	const titleMatch = markdown.match(/\*\*([^*]+)\*\*/);
	if (titleMatch?.[1]) {
		result.title = titleMatch[1].trim();
	}

	// Extract summary section
	const summaryMatch = markdown.match(/## Summary\s*\n+([\s\S]*?)(?=\n---|\n##)/);
	if (summaryMatch?.[1]) {
		result.summary = summaryMatch[1].trim();
	}

	// Extract skills section
	const skillsMatch = markdown.match(/## Technical Skills\s*\n+([\s\S]*?)(?=\n---|\n##)/);
	if (skillsMatch?.[1]) {
		const skillLines = skillsMatch[1].split("\n").filter((l) => l.trim());
		let currentCategory = "";

		for (const line of skillLines) {
			const categoryMatch = line.match(/^\*\*([^*]+)\*\*\s*$/);
			if (categoryMatch?.[1]) {
				currentCategory = categoryMatch[1].trim();
			} else if (currentCategory && line.trim()) {
				result.skills[currentCategory] = line.trim();
			}
		}
	}

	// Extract projects and experience sections using similar pattern
	let currentSection = "";
	let currentItem: ResumeSection | null = null;

	for (const line of lines) {
		if (line.startsWith("## Featured Engineering Projects")) {
			currentSection = "projects";
			continue;
		}
		if (line.startsWith("## Professional Experience")) {
			currentSection = "experience";
			continue;
		}
		if (line.startsWith("## ") && currentSection) {
			currentSection = "";
			continue;
		}

		if (currentSection && line.startsWith("### ")) {
			// Save previous item if exists
			if (currentItem) {
				if (currentSection === "projects") {
					result.projects.push(currentItem);
				} else {
					result.experience.push(currentItem);
				}
			}
			currentItem = {
				title: line.replace("### ", "").trim(),
				items: [],
			};
			continue;
		}

		if (currentItem && line.startsWith("- ")) {
			currentItem.items.push(line.replace("- ", "").trim());
		}
	}

	// Don't forget the last item
	if (currentItem) {
		if (currentSection === "projects") {
			result.projects.push(currentItem);
		} else if (currentSection === "experience") {
			result.experience.push(currentItem);
		}
	}

	return result;
}

/**
 * Fetch and parse resume content (Story 5).
 *
 * @returns Promise resolving to parsed resume or null on failure
 */
export async function fetchParsedResume(): Promise<ParsedResume | null> {
	const result = await fetchMarkdownContent("/readmes/resume.md");
	if (!result.success || !result.content) {
		return null;
	}
	return parseResumeMarkdown(result.content);
}
