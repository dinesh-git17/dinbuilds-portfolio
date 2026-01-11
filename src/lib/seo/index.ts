/**
 * SEO Utilities Barrel Export
 *
 * Provides URL-to-state mapping, metadata generation,
 * and Schema.org structured data for search engine optimization.
 */

export {
	ENTITY,
	type EntityData,
	getSameAsUrls,
	type SocialProfile,
} from "./entity";
export { generatePageMetadata, SITE_CONFIG } from "./metadata";
export {
	generateExperienceFileMetadata,
	generatePathMetadata,
	generateProjectFileMetadata,
} from "./path-metadata";
export {
	getAllCanonicalPaths,
	getCanonicalPath,
	getExperienceFileBySlug,
	getExperienceFileSlugs,
	getFolderFromPath,
	getLegacyRedirectPath,
	getProjectFileBySlug,
	getProjectFileSlugs,
	isValidExperienceSlug,
	isValidProjectSlug,
	parsePathToState,
	windowToPath,
} from "./path-routing";
export {
	type CreativeWorkSchema,
	generatePersonSchema,
	generateProfilePageSchema,
	generateProjectSchema,
	type PersonSchema,
	PROJECT_METADATA,
	type ProfilePageSchema,
	type ProjectMetadata,
	renderJsonLd,
} from "./schema";
export {
	APP_ID_TO_SLUG,
	APP_SLUG_MAP,
	FILE_ID_TO_SLUG,
	FILE_SLUG_MAP,
	generateCanonicalURL,
	getAllIndexableURLs,
	type HydrationState,
	type PageSearchParams,
	parseURLToState,
} from "./url-state";
