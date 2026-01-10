/**
 * Dynamic Metadata Generation — SEO-01 Phase 0
 *
 * Generates page-specific metadata based on URL state.
 * Enables unique titles, descriptions, and OG images per app/file.
 */

import type { Metadata } from "next";
import { getFileById } from "@/os/filesystem/files";
import { AppID } from "@/os/store/types";
import {
	APP_SLUG_MAP,
	FILE_SLUG_MAP,
	generateCanonicalURL,
	type PageSearchParams,
} from "./url-state";

/**
 * Base site configuration for metadata.
 */
export const SITE_CONFIG = {
	name: "Dinesh Dawonauth",
	title: "Data Engineer",
	siteName: "DinBuilds OS",
	baseUrl: "https://dineshd.dev",
	description:
		"Data Engineer specializing in building scalable data pipelines, ETL workflows, and analytics infrastructure. Turning raw data into actionable insights.",
	ogImage: "/assets/web_assets/og.png",
	twitterHandle: "@dinbuilds",
} as const;

/**
 * App-specific metadata configurations.
 * Each app can have custom title, description, and OG image.
 */
const APP_METADATA: Record<AppID, { title: string; description: string; ogImage?: string }> = {
	[AppID.About]: {
		title: "About Me",
		description:
			"Learn about Dinesh Dawonauth — Data Engineer with expertise in Python, SQL, Apache Spark, and cloud data platforms. Building scalable data solutions.",
	},
	[AppID.Contact]: {
		title: "Contact",
		description:
			"Get in touch with Dinesh Dawonauth for data engineering consulting, collaboration opportunities, or just to say hello.",
	},
	[AppID.Yield]: {
		title: "Yield — Algorithm Visualizer",
		description:
			"An interactive algorithm visualizer that turns data structures into something you can actually see, step through, and understand.",
		ogImage: "/assets/apps/yield.png",
	},
	[AppID.Debate]: {
		title: "Debate Lab",
		description:
			"Watch AI models debate any topic in real-time. ChatGPT and Grok argue, Claude moderates.",
		ogImage: "/assets/apps/debate_lab.png",
	},
	[AppID.PassFX]: {
		title: "PassFX",
		description:
			"A zero-knowledge, local-first TUI for managing secrets — built with standard cryptography and designed to never touch the network.",
		ogImage: "/assets/apps/passfx.png",
	},
	[AppID.Terminal]: {
		title: "Terminal",
		description:
			"Interactive terminal emulator showcasing CLI skills. Navigate the portfolio OS using command-line interface.",
	},
	[AppID.Settings]: {
		title: "Settings",
		description:
			"Customize your DinBuilds OS experience. Adjust wallpaper, dock position, and other preferences.",
	},
	[AppID.FolderProjects]: {
		title: "Projects",
		description:
			"Browse Dinesh Dawonauth's portfolio of data engineering and full-stack projects. From ETL pipelines to web applications.",
	},
	[AppID.FolderExperience]: {
		title: "Experience",
		description:
			"Explore Dinesh Dawonauth's professional experience in data engineering across fintech, insurance, and education sectors.",
	},
	[AppID.MarkdownViewer]: {
		title: "Document",
		description: "View project documentation and detailed information.",
	},
	[AppID.FAQ]: {
		title: "System Manual",
		description:
			"Documentation and reference for DinBuilds OS. Learn about the creator, the technology stack, and how to navigate the portfolio.",
	},
};

/**
 * File-specific metadata overrides.
 * Markdown files can have custom descriptions based on content.
 */
const FILE_METADATA: Record<string, { title?: string; description?: string }> = {
	"file.yield": {
		description:
			"Deep dive into Yield — an interactive algorithm visualizer that turns data structures into something you can see, step through, and understand.",
	},
	"file.passfx": {
		description:
			"Technical breakdown of PassFX — a zero-knowledge, local-first TUI for managing secrets with standard cryptography.",
	},
	"file.debate-lab": {
		description:
			"Architecture overview of Debate Lab — watch AI models debate any topic in real-time. ChatGPT and Grok argue, Claude moderates.",
	},
	"file.imessage-wrapped": {
		description:
			"iMessage Wrapped analyzes your chat history to generate a Spotify Wrapped style year in review — fully local and private.",
	},
	"file.holiday-exe": {
		description:
			"Holiday.exe — a personal iOS holiday app built as a gift, combining code, sound, and interaction to create something meaningful.",
	},
	"file.links": {
		description:
			"My internet command center. One page to rule all links, version-controlled for absolutely no reason.",
	},
	"file.meridian": {
		description:
			"Data engineering role at Meridian Credit Union — building ETL pipelines and data warehouse solutions for financial services.",
	},
	"file.slice-labs": {
		description:
			"Insurance technology at Slice Labs — developing data infrastructure for on-demand insurance products.",
	},
	"file.carleton": {
		description:
			"Academic experience at Carleton University — research and teaching assistant roles in computer science.",
	},
	"file.absa": {
		description:
			"Financial services data engineering at Absa Group — enterprise data platform development in banking.",
	},
};

/**
 * Generate metadata based on URL search params.
 *
 * @param searchParams - URL search parameters
 * @returns Next.js Metadata object
 */
export function generatePageMetadata(searchParams: PageSearchParams): Metadata {
	const appSlug = searchParams.app?.toLowerCase();
	const fileSlug = searchParams.file?.toLowerCase();

	// Default metadata for root page
	if (!appSlug) {
		return {
			title: `${SITE_CONFIG.name} | ${SITE_CONFIG.title}`,
			description: SITE_CONFIG.description,
			alternates: {
				canonical: SITE_CONFIG.baseUrl,
			},
			openGraph: {
				title: `${SITE_CONFIG.name} | ${SITE_CONFIG.title}`,
				description: SITE_CONFIG.description,
				url: SITE_CONFIG.baseUrl,
				siteName: SITE_CONFIG.siteName,
				images: [
					{
						url: SITE_CONFIG.ogImage,
						width: 1200,
						height: 630,
						alt: `${SITE_CONFIG.name} - ${SITE_CONFIG.siteName}`,
					},
				],
				type: "website",
				locale: "en_US",
			},
			twitter: {
				card: "summary_large_image",
				title: `${SITE_CONFIG.name} | ${SITE_CONFIG.title}`,
				description: SITE_CONFIG.description,
				images: [SITE_CONFIG.ogImage],
			},
		};
	}

	const appId = APP_SLUG_MAP[appSlug];
	if (!appId) {
		// Invalid app slug, return default
		return generatePageMetadata({});
	}

	// Get app-specific metadata
	const appMeta = APP_METADATA[appId];
	let title = appMeta.title;
	let description = appMeta.description;
	const ogImage = appMeta.ogImage ?? SITE_CONFIG.ogImage;
	let fileId: string | null = null;

	// Handle markdown viewer with file
	if (appId === AppID.MarkdownViewer && fileSlug) {
		fileId = FILE_SLUG_MAP[fileSlug] ?? null;
		const file = fileId ? getFileById(fileId) : undefined;

		if (file && fileId) {
			title = file.name;
			const fileMeta = FILE_METADATA[fileId];
			if (fileMeta?.description) {
				description = fileMeta.description;
			}
		}
	}

	const canonicalUrl = generateCanonicalURL(SITE_CONFIG.baseUrl, appId, fileId);

	return {
		title,
		description,
		alternates: {
			canonical: canonicalUrl,
		},
		openGraph: {
			title: `${title} | ${SITE_CONFIG.siteName}`,
			description,
			url: canonicalUrl,
			siteName: SITE_CONFIG.siteName,
			images: [
				{
					url: ogImage,
					width: 1200,
					height: 630,
					alt: `${title} - ${SITE_CONFIG.siteName}`,
				},
			],
			type: "website",
			locale: "en_US",
		},
		twitter: {
			card: "summary_large_image",
			title: `${title} | ${SITE_CONFIG.siteName}`,
			description,
			images: [ogImage],
		},
	};
}
