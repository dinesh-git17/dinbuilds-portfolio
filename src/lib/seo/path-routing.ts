/**
 * Path-Based Routing Utilities — SEO-02 Story 2
 *
 * Maps clean URL paths to application state and vice versa.
 * Enables canonical URL architecture with path-based routing.
 *
 * Route Structure:
 * - / → Homepage (desktop)
 * - /about → About window
 * - /contact → Contact form
 * - /faq → System manual
 * - /resume → Resume document
 * - /projects → Projects folder
 * - /projects/yield → Yield app
 * - /projects/debate → Debate Lab app
 * - /projects/passfx → PassFX app
 * - /projects/[slug] → Project markdown files
 * - /experience → Experience folder
 * - /experience/[slug] → Experience markdown files
 */

import { type FolderId, getFileById, VFS_REGISTRY } from "@/os/filesystem/files";
import {
	AppID,
	AUTO_FULLSCREEN_APPS,
	DEFAULT_WINDOW_SIZES,
	MAXIMIZED_APPS,
	type WindowInstance,
	type WindowProps,
} from "@/os/store/types";
import type { HydrationState } from "./url-state";

/**
 * Route configuration for static paths.
 */
interface StaticRouteConfig {
	appId: AppID;
	props?: WindowProps;
}

/**
 * Static route mappings (paths without dynamic segments).
 */
const STATIC_ROUTES: Record<string, StaticRouteConfig> = {
	"/about": { appId: AppID.About },
	"/contact": { appId: AppID.Contact },
	"/faq": { appId: AppID.FAQ },
	"/resume": {
		appId: AppID.MarkdownViewer,
		props: { url: "/readmes/resume.md", title: "Resume" },
	},
	"/projects": { appId: AppID.FolderProjects, props: { folderId: "projects" } },
	"/experience": { appId: AppID.FolderExperience, props: { folderId: "experience" } },
	"/projects/yield": { appId: AppID.Yield },
	"/projects/debate": { appId: AppID.Debate },
	"/projects/passfx": { appId: AppID.PassFX },
};

/**
 * Project app slugs that map to dedicated app components (not markdown viewer).
 */
const PROJECT_APP_SLUGS = new Set(["yield", "debate", "passfx"]);

/**
 * File slug to file ID mapping for project markdown files.
 */
const PROJECT_FILE_SLUGS: Record<string, string> = {
	"imessage-wrapped": "file.imessage-wrapped",
	"holiday-exe": "file.holiday-exe",
	links: "file.links",
	// Note: yield, debate-lab, passfx are handled by dedicated apps
};

/**
 * File slug to file ID mapping for experience markdown files.
 */
const EXPERIENCE_FILE_SLUGS: Record<string, string> = {
	meridian: "file.meridian",
	"slice-labs": "file.slice-labs",
	carleton: "file.carleton",
	absa: "file.absa",
};

/**
 * Reverse mapping: AppID to canonical path.
 */
const APP_TO_PATH: Record<AppID, string> = {
	[AppID.About]: "/about",
	[AppID.Contact]: "/contact",
	[AppID.FAQ]: "/faq",
	[AppID.Yield]: "/projects/yield",
	[AppID.Debate]: "/projects/debate",
	[AppID.PassFX]: "/projects/passfx",
	[AppID.Terminal]: "/", // Terminal doesn't have a dedicated route
	[AppID.Settings]: "/", // Settings doesn't have a dedicated route
	[AppID.FolderProjects]: "/projects",
	[AppID.FolderExperience]: "/experience",
	[AppID.MarkdownViewer]: "/", // Needs file context to determine path
};

/**
 * File ID to canonical path mapping.
 */
const FILE_ID_TO_PATH: Record<string, string> = {
	// Projects
	"file.imessage-wrapped": "/projects/imessage-wrapped",
	"file.holiday-exe": "/projects/holiday-exe",
	"file.links": "/projects/links",
	// Experience
	"file.meridian": "/experience/meridian",
	"file.slice-labs": "/experience/slice-labs",
	"file.carleton": "/experience/carleton",
	"file.absa": "/experience/absa",
};

/**
 * Default viewport for SSR window positioning.
 */
const SSR_VIEWPORT = { width: 1440, height: 900 };
const SYSTEM_BAR_HEIGHT = 32;
const DOCK_HEIGHT = 80;
const MAXIMIZED_PADDING = 32;

/**
 * Calculate centered window position for SSR.
 */
function calculateSSRPosition(width: number, height: number): { x: number; y: number } {
	const availableHeight = SSR_VIEWPORT.height - SYSTEM_BAR_HEIGHT - DOCK_HEIGHT;
	return {
		x: Math.max(16, (SSR_VIEWPORT.width - width) / 2),
		y: Math.max(SYSTEM_BAR_HEIGHT + 8, SYSTEM_BAR_HEIGHT + (availableHeight - height) / 2),
	};
}

/**
 * Calculate maximized window size for SSR.
 */
function calculateSSRMaximizedSize(): { width: number; height: number } {
	return {
		width: SSR_VIEWPORT.width - MAXIMIZED_PADDING * 2,
		height: SSR_VIEWPORT.height - SYSTEM_BAR_HEIGHT - DOCK_HEIGHT - MAXIMIZED_PADDING,
	};
}

/**
 * Create a window instance for a given app and props.
 */
function createWindowForState(appId: AppID, props?: WindowProps): WindowInstance {
	const isMaximized = MAXIMIZED_APPS.has(appId);
	const defaultSize = DEFAULT_WINDOW_SIZES[appId];
	const size = isMaximized ? calculateSSRMaximizedSize() : defaultSize;

	const position = isMaximized
		? { x: MAXIMIZED_PADDING, y: SYSTEM_BAR_HEIGHT + MAXIMIZED_PADDING / 2 }
		: calculateSSRPosition(size.width, size.height);

	return {
		id: appId,
		status: "open",
		position,
		size,
		props,
		openedAt: Date.now(),
	};
}

/**
 * Parse a URL pathname into hydration state.
 *
 * @param pathname - The URL pathname (e.g., "/projects/yield")
 * @returns HydrationState for store initialization
 */
export function parsePathToState(pathname: string): HydrationState {
	const emptyState: HydrationState = {
		windows: [],
		activeWindowId: null,
		fullscreenWindowId: null,
	};

	// Normalize pathname
	const normalizedPath = pathname.toLowerCase().replace(/\/$/, "") || "/";

	// Check static routes first
	if (normalizedPath === "/") {
		return emptyState;
	}

	const staticRoute = STATIC_ROUTES[normalizedPath];
	if (staticRoute) {
		const window = createWindowForState(staticRoute.appId, staticRoute.props);
		const shouldAutoFullscreen = AUTO_FULLSCREEN_APPS.has(staticRoute.appId);

		return {
			windows: [window],
			activeWindowId: staticRoute.appId,
			fullscreenWindowId: shouldAutoFullscreen ? staticRoute.appId : null,
		};
	}

	// Check dynamic routes
	const segments = normalizedPath.split("/").filter(Boolean);

	// /projects/[slug] route
	if (segments[0] === "projects" && segments.length === 2) {
		const slug = segments[1];

		// Skip if it's a project app (handled by static routes)
		if (slug && PROJECT_APP_SLUGS.has(slug)) {
			return emptyState; // Should have been caught by static routes
		}

		// Look up file by slug
		if (slug) {
			const fileId = PROJECT_FILE_SLUGS[slug];
			if (fileId) {
				const file = getFileById(fileId);
				if (file) {
					const window = createWindowForState(AppID.MarkdownViewer, {
						url: file.contentUrl,
						title: file.name,
					});
					return {
						windows: [window],
						activeWindowId: AppID.MarkdownViewer,
						fullscreenWindowId: AUTO_FULLSCREEN_APPS.has(AppID.MarkdownViewer)
							? AppID.MarkdownViewer
							: null,
					};
				}
			}
		}
	}

	// /experience/[slug] route
	if (segments[0] === "experience" && segments.length === 2) {
		const slug = segments[1];

		if (slug) {
			const fileId = EXPERIENCE_FILE_SLUGS[slug];
			if (fileId) {
				const file = getFileById(fileId);
				if (file) {
					const window = createWindowForState(AppID.MarkdownViewer, {
						url: file.contentUrl,
						title: file.name,
					});
					return {
						windows: [window],
						activeWindowId: AppID.MarkdownViewer,
						fullscreenWindowId: AUTO_FULLSCREEN_APPS.has(AppID.MarkdownViewer)
							? AppID.MarkdownViewer
							: null,
					};
				}
			}
		}
	}

	// No matching route - return empty state
	return emptyState;
}

/**
 * Get the canonical URL path for an app and optional window props.
 *
 * @param appId - The application ID
 * @param props - Optional window props (for file-based apps)
 * @returns The canonical URL path
 */
export function getCanonicalPath(appId: AppID | null, props?: WindowProps): string {
	if (!appId) {
		return "/";
	}

	// For MarkdownViewer, determine path from file URL
	if (appId === AppID.MarkdownViewer && props?.url) {
		// Extract file ID from URL
		const url = props.url;

		// Check for resume special case
		if (url === "/readmes/resume.md") {
			return "/resume";
		}

		// Find matching file ID from URL
		for (const [folderId, files] of Object.entries(VFS_REGISTRY)) {
			for (const file of files) {
				if (file.contentUrl === url) {
					const path = FILE_ID_TO_PATH[file.id];
					if (path) {
						return path;
					}
					// Fallback: construct path from folder and file slug
					const slug = file.id.replace("file.", "");
					return `/${folderId}/${slug}`;
				}
			}
		}

		// Unknown file - return home
		return "/";
	}

	return APP_TO_PATH[appId] ?? "/";
}

/**
 * Convert a window state to a canonical URL path.
 * Used by URL sync to update browser URL when window state changes.
 *
 * @param window - The window instance
 * @returns The canonical URL path
 */
export function windowToPath(window: WindowInstance | null): string {
	if (!window) {
		return "/";
	}
	return getCanonicalPath(window.id, window.props);
}

/**
 * Get the legacy redirect path for query-parameter URLs.
 * Returns null if the legacy URL is invalid.
 *
 * @param appSlug - The app slug from ?app= param
 * @param fileSlug - The file slug from ?file= param
 * @returns The canonical path or null
 */
export function getLegacyRedirectPath(appSlug: string, fileSlug?: string): string | null {
	const normalizedApp = appSlug.toLowerCase();
	const normalizedFile = fileSlug?.toLowerCase();

	// Direct app mappings
	const appMappings: Record<string, string> = {
		about: "/about",
		contact: "/contact",
		faq: "/faq",
		help: "/faq",
		resume: "/resume",
		yield: "/projects/yield",
		debate: "/projects/debate",
		"debate-lab": "/projects/debate",
		passfx: "/projects/passfx",
		terminal: "/", // No dedicated route
		settings: "/", // No dedicated route
		projects: "/projects",
		experience: "/experience",
		// Legacy folder app IDs
		"folder-projects": "/projects",
		"folder-experience": "/experience",
	};

	// Handle markdown viewer with file param
	if (normalizedApp === "markdown" && normalizedFile) {
		// Check project files
		if (PROJECT_FILE_SLUGS[normalizedFile]) {
			return `/projects/${normalizedFile}`;
		}
		// Check experience files
		if (EXPERIENCE_FILE_SLUGS[normalizedFile]) {
			return `/experience/${normalizedFile}`;
		}
		// Check special files
		if (normalizedFile === "resume") {
			return "/resume";
		}
		// Unknown file
		return null;
	}

	return appMappings[normalizedApp] ?? null;
}

/**
 * Get all valid project file slugs for dynamic route generation.
 */
export function getProjectFileSlugs(): string[] {
	return Object.keys(PROJECT_FILE_SLUGS);
}

/**
 * Get all valid experience file slugs for dynamic route generation.
 */
export function getExperienceFileSlugs(): string[] {
	return Object.keys(EXPERIENCE_FILE_SLUGS);
}

/**
 * Check if a project slug is valid (either an app or a file).
 */
export function isValidProjectSlug(slug: string): boolean {
	return PROJECT_APP_SLUGS.has(slug) || slug in PROJECT_FILE_SLUGS;
}

/**
 * Check if an experience slug is valid.
 */
export function isValidExperienceSlug(slug: string): boolean {
	return slug in EXPERIENCE_FILE_SLUGS;
}

/**
 * Get file metadata for a project slug.
 * Returns null for project app slugs (yield, debate, passfx).
 */
export function getProjectFileBySlug(
	slug: string,
): { fileId: string; contentUrl: string; title: string } | null {
	const fileId = PROJECT_FILE_SLUGS[slug];
	if (!fileId) return null;

	const file = getFileById(fileId);
	if (!file) return null;

	return {
		fileId,
		contentUrl: file.contentUrl,
		title: file.name,
	};
}

/**
 * Get file metadata for an experience slug.
 */
export function getExperienceFileBySlug(
	slug: string,
): { fileId: string; contentUrl: string; title: string } | null {
	const fileId = EXPERIENCE_FILE_SLUGS[slug];
	if (!fileId) return null;

	const file = getFileById(fileId);
	if (!file) return null;

	return {
		fileId,
		contentUrl: file.contentUrl,
		title: file.name,
	};
}

/**
 * Get all indexable paths for sitemap generation.
 */
export function getAllCanonicalPaths(): string[] {
	const paths: string[] = [
		"/",
		"/about",
		"/contact",
		"/faq",
		"/resume",
		"/projects",
		"/projects/yield",
		"/projects/debate",
		"/projects/passfx",
		"/experience",
	];

	// Add project file paths
	for (const slug of Object.keys(PROJECT_FILE_SLUGS)) {
		paths.push(`/projects/${slug}`);
	}

	// Add experience file paths
	for (const slug of Object.keys(EXPERIENCE_FILE_SLUGS)) {
		paths.push(`/experience/${slug}`);
	}

	return paths;
}

/**
 * Determine the folder type from a pathname.
 */
export function getFolderFromPath(pathname: string): FolderId | null {
	const segments = pathname.toLowerCase().split("/").filter(Boolean);
	if (segments[0] === "projects") return "projects";
	if (segments[0] === "experience") return "experience";
	return null;
}
