/**
 * Entity Identity Data — Single Source of Truth
 *
 * Centralizes all identity data for the portfolio owner.
 * Used by:
 * - Schema.org JSON-LD generation (Person, ProfilePage)
 * - SSR Entity Card (crawlable identity signals)
 * - ProfileSidebar component
 * - AboutSystemModal component
 *
 * This ensures consistency between structured data claims
 * and visible DOM content — critical for entity verification.
 */

import { SITE_CONFIG } from "./metadata";

/**
 * Social profile link configuration.
 */
export interface SocialProfile {
	platform: string;
	url: string;
	username: string;
	ariaLabel: string;
}

/**
 * Work experience entry.
 */
export interface WorkExperience {
	organization: string;
	organizationUrl?: string;
	role: string;
	startDate: string;
	endDate?: string;
	current: boolean;
}

/**
 * Education entry.
 */
export interface Education {
	institution: string;
	institutionUrl?: string;
	degree?: string;
	field?: string;
	graduationYear?: number;
}

/**
 * Complete entity identity data.
 */
export interface EntityData {
	// Core identity
	name: string;
	givenName: string;
	familyName: string;
	jobTitle: string;
	description: string;

	// Location
	location: string;
	timezone: string;

	// Contact
	email: string;
	url: string;

	// Images
	profileImage: string;
	ogImage: string;

	// Social profiles (used in sameAs schema)
	socialProfiles: SocialProfile[];

	// Professional
	currentEmployer: WorkExperience;
	education: Education[];

	// Skills/expertise (used in knowsAbout schema)
	knowsAbout: string[];
}

/**
 * The Entity — Dinesh Dawonauth
 *
 * This constant is the canonical source for all identity data.
 * Any component or schema generator should reference this object.
 */
export const ENTITY: EntityData = {
	// Core identity
	name: "Dinesh Dawonauth",
	givenName: "Dinesh",
	familyName: "Dawonauth",
	jobTitle: "Data Engineer",
	description: SITE_CONFIG.description,

	// Location
	location: "Toronto, Canada",
	timezone: "EST (UTC-5)",

	// Contact
	email: "hireme@dineshd.dev",
	url: SITE_CONFIG.baseUrl,

	// Images
	profileImage: "/assets/profile_picture/din.png",
	ogImage: `${SITE_CONFIG.baseUrl}/assets/web_assets/og.png`,

	// Social profiles
	socialProfiles: [
		{
			platform: "GitHub",
			url: "https://github.com/dinesh-git17",
			username: "dinesh-git17",
			ariaLabel: "View GitHub profile",
		},
		{
			platform: "LinkedIn",
			url: "https://www.linkedin.com/in/dineshsdawonauth",
			username: "dineshsdawonauth",
			ariaLabel: "View LinkedIn profile",
		},
		{
			platform: "Twitter",
			url: "https://twitter.com/dinbuilds",
			username: "dinbuilds",
			ariaLabel: "View Twitter profile",
		},
		{
			platform: "Links",
			url: "https://links.dineshd.dev",
			username: "links",
			ariaLabel: "View all links",
		},
	],

	// Current employment
	currentEmployer: {
		organization: "Meridian Credit Union",
		organizationUrl: "https://www.meridiancu.ca",
		role: "Data Scientist",
		startDate: "2024-04",
		current: true,
	},

	// Education
	education: [
		{
			institution: "Carleton University",
			institutionUrl: "https://carleton.ca",
			degree: "Bachelor of Computer Science",
			field: "Computer Science",
			graduationYear: 2023,
		},
	],

	// Skills and expertise
	knowsAbout: [
		"Data Engineering",
		"Python",
		"SQL",
		"Apache Spark",
		"ETL Pipelines",
		"Data Warehousing",
		"Cloud Platforms",
		"TypeScript",
		"React",
		"Next.js",
	],
};

/**
 * Get social profile URLs for schema.org sameAs property.
 * Excludes internal links (like "Links" page).
 */
export function getSameAsUrls(): string[] {
	const externalPlatforms = ["GitHub", "LinkedIn", "Twitter"];
	return ENTITY.socialProfiles
		.filter((profile) => externalPlatforms.includes(profile.platform))
		.map((profile) => profile.url);
}
