/**
 * SiteIndex — SEO-04 Story 4
 *
 * Hidden navigation component for crawler discovery.
 * Provides accessible links to all major routes while remaining
 * visually hidden from users (sr-only).
 *
 * This enables search engine bots to discover all internal pages
 * via standard anchor tags, complementing the sitemap.xml.
 */

import { getAllCanonicalPaths } from "./path-routing";

/**
 * Human-readable labels for canonical paths.
 */
const PATH_LABELS: Record<string, string> = {
	"/": "Homepage",
	"/about": "About Dinesh Dawonauth",
	"/contact": "Contact",
	"/faq": "Frequently Asked Questions",
	"/resume": "Resume",
	"/projects": "Projects",
	"/projects/yield": "Yield - Investment Portfolio Tracker",
	"/projects/debate": "Debate Lab - AI-Powered Debate Training",
	"/projects/passfx": "PassFX - Secure Password Generator",
	"/projects/imessage-wrapped": "iMessage Wrapped",
	"/projects/holiday-exe": "Holiday.exe",
	"/projects/links": "Links",
	"/experience": "Experience",
	"/experience/meridian": "Meridian - Work Experience",
	"/experience/slice-labs": "Slice Labs - Work Experience",
	"/experience/carleton": "Carleton University - Education",
	"/experience/absa": "ABSA - Work Experience",
};

/**
 * Get a human-readable label for a path.
 */
function getPathLabel(path: string): string {
	return PATH_LABELS[path] ?? path.split("/").pop()?.replace(/-/g, " ") ?? path;
}

export interface SiteIndexProps {
	/** Base URL for absolute links (optional, defaults to relative) */
	baseUrl?: string;
}

/**
 * Hidden site index for crawler discovery.
 *
 * Renders all canonical routes as accessible anchor tags,
 * hidden from visual users but discoverable by search engines.
 *
 * @example
 * ```tsx
 * // In layout or page component
 * <SiteIndex />
 * ```
 */
export function SiteIndex({ baseUrl }: SiteIndexProps) {
	const paths = getAllCanonicalPaths();

	return (
		<nav
			aria-label="Site index for search engines"
			className="sr-only"
			// Additional fallback for crawlers that might not respect sr-only
			style={{
				position: "absolute",
				width: "1px",
				height: "1px",
				padding: 0,
				margin: "-1px",
				overflow: "hidden",
				clip: "rect(0, 0, 0, 0)",
				whiteSpace: "nowrap",
				border: 0,
			}}
		>
			<h2>Site Navigation</h2>
			<ul>
				{paths.map((path) => {
					const href = baseUrl ? `${baseUrl}${path}` : path;
					const label = getPathLabel(path);

					return (
						<li key={path}>
							<a href={href}>{label}</a>
						</li>
					);
				})}
			</ul>
		</nav>
	);
}
