import type { MetadataRoute } from "next";
import { getAllCanonicalPaths } from "@/lib/seo";

/**
 * Dynamic Sitemap Generation — SEO-02 Story 2
 *
 * Generates sitemap.xml with clean path-based URLs.
 * Enables search engines to discover all indexable routes.
 *
 * Priority Hierarchy:
 * - 1.0: Homepage
 * - 0.9: Project markdown files (primary content)
 * - 0.8: About, Experience files (high-value)
 * - 0.7: Project apps (Yield, Debate, PassFX)
 * - 0.6: Folders, FAQ, Resume (navigation/reference)
 * - 0.5: Contact (utility)
 */

const BASE_URL = "https://dineshd.dev";

/**
 * Change frequency hints for crawlers.
 */
type ChangeFrequency = "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";

/**
 * Priority and frequency configuration by path pattern.
 */
interface RouteConfig {
	priority: number;
	changeFrequency: ChangeFrequency;
}

function getRouteConfig(path: string): RouteConfig {
	// Homepage
	if (path === "/") {
		return { priority: 1.0, changeFrequency: "weekly" };
	}

	// About page
	if (path === "/about") {
		return { priority: 0.8, changeFrequency: "monthly" };
	}

	// Contact page
	if (path === "/contact") {
		return { priority: 0.5, changeFrequency: "yearly" };
	}

	// FAQ/System Manual
	if (path === "/faq") {
		return { priority: 0.6, changeFrequency: "monthly" };
	}

	// Resume
	if (path === "/resume") {
		return { priority: 0.8, changeFrequency: "monthly" };
	}

	// Project apps (Yield, Debate, PassFX)
	if (path === "/projects/yield" || path === "/projects/debate" || path === "/projects/passfx") {
		return { priority: 0.7, changeFrequency: "monthly" };
	}

	// Folders
	if (path === "/projects" || path === "/experience") {
		return { priority: 0.6, changeFrequency: "weekly" };
	}

	// Project markdown files
	if (path.startsWith("/projects/")) {
		return { priority: 0.9, changeFrequency: "weekly" };
	}

	// Experience markdown files
	if (path.startsWith("/experience/")) {
		return { priority: 0.8, changeFrequency: "monthly" };
	}

	// Default
	return { priority: 0.5, changeFrequency: "monthly" };
}

export default function sitemap(): MetadataRoute.Sitemap {
	const now = new Date();
	const paths = getAllCanonicalPaths();

	const entries: MetadataRoute.Sitemap = paths.map((path) => {
		const config = getRouteConfig(path);
		const url = path === "/" ? BASE_URL : `${BASE_URL}${path}`;

		return {
			url,
			lastModified: now,
			changeFrequency: config.changeFrequency,
			priority: config.priority,
		};
	});

	return entries;
}
