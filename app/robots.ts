import type { MetadataRoute } from "next";

/**
 * Robots.txt Generation — SEO-01 Phase 1
 *
 * Provides crawler instructions and sitemap location.
 * Allows all crawlers access to all content.
 */

export default function robots(): MetadataRoute.Robots {
	return {
		rules: [
			{
				userAgent: "*",
				allow: "/",
			},
		],
		sitemap: "https://dineshd.dev/sitemap.xml",
	};
}
