/**
 * Path-Based Metadata Generation — SEO-02 Story 2
 *
 * Generates page metadata based on clean URL paths.
 * Provides canonical URLs, titles, descriptions, and OG/Twitter meta.
 */

import type { Metadata } from "next";
import { SITE_CONFIG } from "./metadata";
import {
	getExperienceFileBySlug,
	getProjectFileBySlug,
	isValidExperienceSlug,
	isValidProjectSlug,
} from "./path-routing";

/**
 * Route configuration for metadata generation.
 */
interface RouteMetadata {
	title: string;
	description: string;
	ogImage?: string;
}

/**
 * Default homepage metadata (extracted for type safety).
 */
const DEFAULT_METADATA: RouteMetadata = {
	title: `${SITE_CONFIG.name} | ${SITE_CONFIG.title}`,
	description: SITE_CONFIG.description,
};

/**
 * Static route metadata configurations.
 */
const ROUTE_METADATA: Record<string, RouteMetadata> = {
	"/": DEFAULT_METADATA,
	"/about": {
		title: "About Me",
		description:
			"Learn about Dinesh Dawonauth — Data Engineer with expertise in Python, SQL, Apache Spark, and cloud data platforms. Building scalable data solutions.",
	},
	"/contact": {
		title: "Contact",
		description:
			"Get in touch with Dinesh Dawonauth for data engineering consulting, collaboration opportunities, or just to say hello.",
	},
	"/faq": {
		title: "System Manual",
		description:
			"Documentation and reference for DinBuilds OS. Learn about the creator, the technology stack, and how to navigate the portfolio.",
	},
	"/resume": {
		title: "Resume",
		description:
			"Professional resume of Dinesh Dawonauth — Data Engineer with experience in ETL pipelines, data warehousing, and analytics infrastructure.",
	},
	"/projects": {
		title: "Projects",
		description:
			"Browse Dinesh Dawonauth's portfolio of data engineering and full-stack projects. From ETL pipelines to web applications.",
	},
	"/projects/yield": {
		title: "Yield — Algorithm Visualizer",
		description:
			"An interactive algorithm visualizer that turns data structures into something you can actually see, step through, and understand.",
		ogImage: "/assets/apps/yield.png",
	},
	"/projects/debate": {
		title: "Debate Lab",
		description:
			"Watch AI models debate any topic in real-time. ChatGPT and Grok argue, Claude moderates.",
		ogImage: "/assets/apps/debate_lab.png",
	},
	"/projects/passfx": {
		title: "PassFX",
		description:
			"A zero-knowledge, local-first TUI for managing secrets — built with standard cryptography and designed to never touch the network.",
		ogImage: "/assets/apps/passfx.png",
	},
	"/experience": {
		title: "Experience",
		description:
			"Explore Dinesh Dawonauth's professional experience in data engineering across fintech, insurance, and education sectors.",
	},
};

/**
 * File-specific metadata for project markdown files.
 */
const PROJECT_FILE_METADATA: Record<string, RouteMetadata> = {
	"imessage-wrapped": {
		title: "iMessage Wrapped",
		description:
			"iMessage Wrapped analyzes your chat history to generate a Spotify Wrapped style year in review — fully local and private.",
	},
	"holiday-exe": {
		title: "Holiday.exe",
		description:
			"Holiday.exe — a personal iOS holiday app built as a gift, combining code, sound, and interaction to create something meaningful.",
	},
	links: {
		title: "Links",
		description:
			"My internet command center. One page to rule all links, version-controlled for absolutely no reason.",
	},
};

/**
 * File-specific metadata for experience markdown files.
 */
const EXPERIENCE_FILE_METADATA: Record<string, RouteMetadata> = {
	meridian: {
		title: "Meridian Credit Union",
		description:
			"Data engineering role at Meridian Credit Union — building ETL pipelines and data warehouse solutions for financial services.",
	},
	"slice-labs": {
		title: "Slice Labs",
		description:
			"Insurance technology at Slice Labs — developing data infrastructure for on-demand insurance products.",
	},
	carleton: {
		title: "Carleton University",
		description:
			"Academic experience at Carleton University — research and teaching assistant roles in computer science.",
	},
	absa: {
		title: "Absa Group",
		description:
			"Financial services data engineering at Absa Group — enterprise data platform development in banking.",
	},
};

/**
 * Generate the canonical URL for a given path.
 */
function getCanonicalUrl(path: string): string {
	const normalizedPath = path === "/" ? "" : path;
	return `${SITE_CONFIG.baseUrl}${normalizedPath}`;
}

/**
 * Build complete metadata object from route metadata.
 */
function buildMetadata(path: string, meta: RouteMetadata): Metadata {
	const canonicalUrl = getCanonicalUrl(path);
	const ogImage = meta.ogImage ?? SITE_CONFIG.ogImage;

	return {
		title: meta.title,
		description: meta.description,
		alternates: {
			canonical: canonicalUrl,
		},
		openGraph: {
			title: `${meta.title} | ${SITE_CONFIG.siteName}`,
			description: meta.description,
			url: canonicalUrl,
			siteName: SITE_CONFIG.siteName,
			images: [
				{
					url: ogImage,
					width: 1200,
					height: 630,
					alt: `${meta.title} - ${SITE_CONFIG.siteName}`,
				},
			],
			type: "website",
			locale: "en_US",
		},
		twitter: {
			card: "summary_large_image",
			title: `${meta.title} | ${SITE_CONFIG.siteName}`,
			description: meta.description,
			images: [ogImage],
		},
	};
}

/**
 * Generate metadata for a static route.
 *
 * @param path - The route path (e.g., "/about", "/projects/yield")
 * @returns Next.js Metadata object
 */
export function generatePathMetadata(path: string): Metadata {
	const normalizedPath = path.toLowerCase().replace(/\/$/, "") || "/";

	// Check static routes first
	const staticMeta = ROUTE_METADATA[normalizedPath];
	if (staticMeta) {
		return buildMetadata(normalizedPath, staticMeta);
	}

	// Check dynamic project file routes
	const projectMatch = normalizedPath.match(/^\/projects\/(.+)$/);
	if (projectMatch) {
		const slug = projectMatch[1];
		if (slug && !["yield", "debate", "passfx"].includes(slug)) {
			const fileMeta = PROJECT_FILE_METADATA[slug];
			if (fileMeta) {
				return buildMetadata(normalizedPath, fileMeta);
			}
			// Fallback for valid project files without custom metadata
			const file = getProjectFileBySlug(slug);
			if (file) {
				return buildMetadata(normalizedPath, {
					title: file.title,
					description: `Project details for ${file.title} by Dinesh Dawonauth.`,
				});
			}
		}
	}

	// Check dynamic experience file routes
	const experienceMatch = normalizedPath.match(/^\/experience\/(.+)$/);
	if (experienceMatch) {
		const slug = experienceMatch[1];
		if (slug) {
			const fileMeta = EXPERIENCE_FILE_METADATA[slug];
			if (fileMeta) {
				return buildMetadata(normalizedPath, fileMeta);
			}
			// Fallback for valid experience files without custom metadata
			const file = getExperienceFileBySlug(slug);
			if (file) {
				return buildMetadata(normalizedPath, {
					title: file.title,
					description: `Professional experience at ${file.title} by Dinesh Dawonauth.`,
				});
			}
		}
	}

	// Fallback to default homepage metadata
	return buildMetadata("/", DEFAULT_METADATA);
}

/**
 * Generate metadata for a project file route.
 *
 * @param slug - The project file slug
 * @returns Next.js Metadata object or null if invalid slug
 */
export function generateProjectFileMetadata(slug: string): Metadata | null {
	if (!isValidProjectSlug(slug)) return null;

	// Project apps have static metadata
	if (["yield", "debate", "passfx"].includes(slug)) {
		return generatePathMetadata(`/projects/${slug}`);
	}

	const path = `/projects/${slug}`;
	const fileMeta = PROJECT_FILE_METADATA[slug];
	if (fileMeta) {
		return buildMetadata(path, fileMeta);
	}

	const file = getProjectFileBySlug(slug);
	if (file) {
		return buildMetadata(path, {
			title: file.title,
			description: `Project details for ${file.title} by Dinesh Dawonauth.`,
		});
	}

	return null;
}

/**
 * Generate metadata for an experience file route.
 *
 * @param slug - The experience file slug
 * @returns Next.js Metadata object or null if invalid slug
 */
export function generateExperienceFileMetadata(slug: string): Metadata | null {
	if (!isValidExperienceSlug(slug)) return null;

	const path = `/experience/${slug}`;
	const fileMeta = EXPERIENCE_FILE_METADATA[slug];
	if (fileMeta) {
		return buildMetadata(path, fileMeta);
	}

	const file = getExperienceFileBySlug(slug);
	if (file) {
		return buildMetadata(path, {
			title: file.title,
			description: `Professional experience at ${file.title} by Dinesh Dawonauth.`,
		});
	}

	return null;
}
