/**
 * Server-Side Content Fetching — SEO-01 Story 1
 *
 * Utilities for fetching markdown content on the server.
 * Used to pre-render content in the initial HTML response for SEO.
 *
 * These functions are server-only and use Node.js fs module directly.
 * Content is read from the /public directory at build/request time.
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";

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
