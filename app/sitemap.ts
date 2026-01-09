import type { MetadataRoute } from "next";
import { APP_ID_TO_SLUG, FILE_ID_TO_SLUG } from "@/lib/seo";
import { VFS_REGISTRY } from "@/os/filesystem/files";
import { AppID } from "@/os/store/types";

/**
 * Dynamic Sitemap Generation — SEO-01 Phase 1
 *
 * Generates sitemap.xml from the Virtual Filesystem registry.
 * Enables search engines to discover all indexable app states.
 *
 * Priority Hierarchy:
 * - 1.0: Homepage (desktop)
 * - 0.9: Projects (primary content)
 * - 0.8: About, Experience files (high-value)
 * - 0.7: Project apps (Yield, Debate, PassFX)
 * - 0.6: Folders (navigation)
 * - 0.5: Utility pages (Contact, Terminal, Settings)
 */

const BASE_URL = "https://dineshd.dev";

/**
 * App priority configuration.
 * Higher priority = more important for crawlers.
 */
const APP_PRIORITIES: Record<AppID, number> = {
	[AppID.About]: 0.8,
	[AppID.Contact]: 0.5,
	[AppID.Yield]: 0.7,
	[AppID.Debate]: 0.7,
	[AppID.PassFX]: 0.7,
	[AppID.Terminal]: 0.5,
	[AppID.Settings]: 0.3,
	[AppID.FolderProjects]: 0.6,
	[AppID.FolderExperience]: 0.6,
	[AppID.MarkdownViewer]: 0.9,
};

/**
 * Change frequency hints for crawlers.
 */
type ChangeFrequency = "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";

const APP_CHANGE_FREQ: Record<AppID, ChangeFrequency> = {
	[AppID.About]: "monthly",
	[AppID.Contact]: "yearly",
	[AppID.Yield]: "monthly",
	[AppID.Debate]: "monthly",
	[AppID.PassFX]: "monthly",
	[AppID.Terminal]: "yearly",
	[AppID.Settings]: "yearly",
	[AppID.FolderProjects]: "weekly",
	[AppID.FolderExperience]: "monthly",
	[AppID.MarkdownViewer]: "weekly",
};

/**
 * Apps to include in sitemap (excluding MarkdownViewer which uses file URLs).
 */
const INDEXABLE_APPS: AppID[] = [
	AppID.About,
	AppID.Contact,
	AppID.Yield,
	AppID.Debate,
	AppID.PassFX,
	AppID.Terminal,
	AppID.FolderProjects,
	AppID.FolderExperience,
];

/**
 * Escapes special XML characters in a string.
 * Required because Next.js sitemap doesn't properly escape ampersands in URLs.
 */
function escapeXml(str: string): string {
	return str.replace(/&/g, "&amp;");
}

export default function sitemap(): MetadataRoute.Sitemap {
	const now = new Date();

	// Homepage entry
	const entries: MetadataRoute.Sitemap = [
		{
			url: BASE_URL,
			lastModified: now,
			changeFrequency: "weekly",
			priority: 1.0,
		},
	];

	// App entries
	for (const appId of INDEXABLE_APPS) {
		const slug = APP_ID_TO_SLUG[appId];
		if (slug) {
			entries.push({
				url: `${BASE_URL}?app=${slug}`,
				lastModified: now,
				changeFrequency: APP_CHANGE_FREQ[appId],
				priority: APP_PRIORITIES[appId],
			});
		}
	}

	// Markdown file entries (projects and experience)
	for (const [folderId, files] of Object.entries(VFS_REGISTRY)) {
		// Experience files get slightly lower priority than project files
		const basePriority = folderId === "projects" ? 0.9 : 0.8;

		for (const file of files) {
			const fileSlug = FILE_ID_TO_SLUG[file.id];
			if (fileSlug) {
				entries.push({
					url: escapeXml(`${BASE_URL}?app=markdown&file=${fileSlug}`),
					lastModified: now,
					changeFrequency: "weekly",
					priority: basePriority,
				});
			}
		}
	}

	return entries;
}
