/**
 * Schema.org JSON-LD Generation — SEO-01 Phase 2
 *
 * Generates structured data for search engine knowledge graphs.
 * Enables rich snippets and establishes entity authority.
 */

import { ENTITY, getSameAsUrls } from "./entity";
import { SITE_CONFIG } from "./metadata";

/**
 * Person schema for the portfolio owner.
 * Establishes Knowledge Graph entity for "Dinesh Dawonauth".
 */
export interface PersonSchema {
	"@context": "https://schema.org";
	"@type": "Person";
	"@id": string;
	name: string;
	givenName: string;
	familyName: string;
	jobTitle: string;
	description: string;
	url: string;
	image: string;
	email?: string;
	sameAs: string[];
	worksFor?: {
		"@type": "Organization";
		name: string;
		url?: string;
	};
	alumniOf?: Array<{
		"@type": "EducationalOrganization";
		name: string;
		url?: string;
	}>;
	knowsAbout: string[];
}

/**
 * ProfilePage schema wrapping the Person.
 * Indicates this page is a profile/portfolio.
 */
export interface ProfilePageSchema {
	"@context": "https://schema.org";
	"@type": "ProfilePage";
	"@id": string;
	name: string;
	description: string;
	url: string;
	mainEntity: PersonSchema;
}

/**
 * CreativeWork schema for projects.
 * Enables rich snippets for portfolio projects.
 */
export interface CreativeWorkSchema {
	"@context": "https://schema.org";
	"@type": "CreativeWork";
	"@id": string;
	name: string;
	description: string;
	url: string;
	sameAs?: string;
	author: {
		"@type": "Person";
		"@id": string;
		name: string;
	};
	keywords?: string[];
	genre?: string;
}

/**
 * Project metadata for schema generation.
 * Contains technical details about each project.
 */
export interface ProjectMetadata {
	name: string;
	description: string;
	codeRepository?: string;
	programmingLanguage: string[];
	keywords: string[];
	applicationCategory: string;
	dateCreated?: string;
	license?: string;
}

/**
 * Project metadata registry.
 * Maps file IDs to their technical metadata.
 */
export const PROJECT_METADATA: Record<string, ProjectMetadata> = {
	"file.yield": {
		name: "Yield",
		description:
			"An interactive algorithm visualizer that turns data structures into something you can actually see, step through, and understand. Built for learning, teaching, and satisfying curiosity.",
		codeRepository: "https://github.com/dinesh-git17/yield",
		programmingLanguage: ["TypeScript", "JavaScript"],
		keywords: [
			"algorithms",
			"data-structures",
			"visualizer",
			"education",
			"interactive",
			"learning",
		],
		applicationCategory: "EducationalApplication",
	},
	"file.passfx": {
		name: "PassFX",
		description:
			"A zero-knowledge, local-first TUI for managing secrets — built with standard cryptography and designed to never touch the network.",
		codeRepository: "https://github.com/dinesh-git17/passfx",
		programmingLanguage: ["Python", "Shell"],
		keywords: ["security", "password-manager", "terminal", "cryptography", "zero-knowledge", "cli"],
		applicationCategory: "SecurityApplication",
	},
	"file.debate-lab": {
		name: "Debate Lab",
		description:
			"Watch AI models debate any topic in real-time. ChatGPT and Grok argue, Claude moderates.",
		codeRepository: "https://github.com/dinesh-git17/debate-lab",
		programmingLanguage: ["TypeScript", "JavaScript", "SQL"],
		keywords: ["AI", "debate", "ChatGPT", "Grok", "Claude", "real-time"],
		applicationCategory: "EntertainmentApplication",
	},
	"file.imessage-wrapped": {
		name: "iMessage Wrapped",
		description:
			"Your iMessage data tells a story. This Python tool analyzes macOS iMessage conversations to generate a Spotify Wrapped style year in review with deep insights into messaging habits, milestones, and conversation patterns — all fully local and private.",
		codeRepository: "https://github.com/dinesh-git17/imessage-wrapped",
		programmingLanguage: ["Python"],
		keywords: [
			"analytics",
			"iMessage",
			"data-visualization",
			"insights",
			"spotify-wrapped",
			"privacy",
		],
		applicationCategory: "UtilitiesApplication",
	},
	"file.holiday-exe": {
		name: "Holiday.exe",
		description:
			"A personal iOS holiday app built as a gift, combining code, sound, and interaction to create something meaningful — not just functional.",
		codeRepository: "https://github.com/dinesh-git17/christmas-gift",
		programmingLanguage: ["TypeScript", "JavaScript", "Swift"],
		keywords: ["iOS", "holiday", "gift", "interactive", "native-app"],
		applicationCategory: "EntertainmentApplication",
	},
	"file.links": {
		name: "Links",
		description:
			"My internet command center. One page to rule my links, version-controlled for absolutely no reason.",
		codeRepository: "https://github.com/dinesh-git17/links",
		programmingLanguage: ["TypeScript", "JavaScript"],
		keywords: ["links", "portfolio", "link-in-bio", "personal-site"],
		applicationCategory: "SocialNetworkingApplication",
	},
};

/**
 * Generate the Person schema for Dinesh Dawonauth.
 * Uses centralized ENTITY data for consistency with visible DOM content.
 */
export function generatePersonSchema(): PersonSchema {
	return {
		"@context": "https://schema.org",
		"@type": "Person",
		"@id": `${SITE_CONFIG.baseUrl}/#person`,
		name: ENTITY.name,
		givenName: ENTITY.givenName,
		familyName: ENTITY.familyName,
		jobTitle: ENTITY.jobTitle,
		description: ENTITY.description,
		url: ENTITY.url,
		image: ENTITY.ogImage,
		sameAs: getSameAsUrls(),
		worksFor: {
			"@type": "Organization",
			name: ENTITY.currentEmployer.organization,
			url: ENTITY.currentEmployer.organizationUrl,
		},
		alumniOf: ENTITY.education.map((edu) => ({
			"@type": "EducationalOrganization" as const,
			name: edu.institution,
			url: edu.institutionUrl,
		})),
		knowsAbout: ENTITY.knowsAbout,
	};
}

/**
 * Generate the ProfilePage schema wrapping the Person.
 * Uses centralized ENTITY data for consistency.
 */
export function generateProfilePageSchema(): ProfilePageSchema {
	return {
		"@context": "https://schema.org",
		"@type": "ProfilePage",
		"@id": `${SITE_CONFIG.baseUrl}/#profilepage`,
		name: `${ENTITY.name} | ${ENTITY.jobTitle}`,
		description: ENTITY.description,
		url: ENTITY.url,
		mainEntity: generatePersonSchema(),
	};
}

/**
 * Generate CreativeWork schema for a project.
 * Uses centralized ENTITY data for author reference.
 *
 * @param fileId - The VFS file ID (e.g., "file.yield")
 * @returns Schema object or null if project not found
 */
export function generateProjectSchema(fileId: string): CreativeWorkSchema | null {
	const metadata = PROJECT_METADATA[fileId];
	if (!metadata) return null;

	const fileSlug = fileId.replace("file.", "");

	return {
		"@context": "https://schema.org",
		"@type": "CreativeWork",
		"@id": `${SITE_CONFIG.baseUrl}?app=markdown&file=${fileSlug}#project`,
		name: metadata.name,
		description: metadata.description,
		url: `${SITE_CONFIG.baseUrl}?app=markdown&file=${fileSlug}`,
		sameAs: metadata.codeRepository,
		author: {
			"@type": "Person",
			"@id": `${SITE_CONFIG.baseUrl}/#person`,
			name: ENTITY.name,
		},
		keywords: metadata.keywords,
		genre: metadata.applicationCategory,
	};
}

/**
 * Render JSON-LD script tag content.
 * Use this in a <script type="application/ld+json"> tag.
 */
export function renderJsonLd<T extends object>(schema: T): string {
	return JSON.stringify(schema, null, 0);
}
