import type { Metadata } from "next";
import { hydrateWindowContent } from "@/lib/content";
import {
	FILE_SLUG_MAP,
	generatePageMetadata,
	generateProjectSchema,
	type PageSearchParams,
	parseURLToState,
	renderJsonLd,
} from "@/lib/seo";
import { BootManager, BootScreen, WelcomeOverlay } from "@/os/boot";
import { Stage } from "@/os/desktop";
import { SSRContentProjection, SSREntityCard } from "@/os/ssr";
import { StoreHydrator } from "@/os/store";

/**
 * Page props with searchParams for URL-driven state.
 */
interface PageProps {
	searchParams: Promise<PageSearchParams>;
}

/**
 * Generate dynamic metadata based on URL state.
 * Enables unique titles/descriptions for each app/file view.
 */
export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
	const params = await searchParams;
	return generatePageMetadata(params);
}

/**
 * Home Page — Spatial OS Desktop
 *
 * Server component that parses URL search params and hydrates
 * the system store with initial window state for SSR.
 *
 * URL patterns:
 * - / → Desktop with no windows
 * - /?app=about → About window open
 * - /?app=yield → Yield project window
 * - /?app=markdown&file=yield → Markdown viewer with yield.md
 *
 * SSR Content Strategy (SEO-01 Story 1):
 * - Content is fetched server-side and injected into window props
 * - This ensures crawlers see full content in initial HTML response
 * - Boot screen renders on top but doesn't block SSR content from DOM
 */
export default async function Home({ searchParams }: PageProps) {
	const params = await searchParams;
	const parsedState = parseURLToState(params);

	// Hydrate window content server-side for SSR
	// This fetches markdown content and injects it into window props
	const initialState = await hydrateWindowContent(parsedState);

	// Generate project schema if viewing a markdown file
	let projectSchema = null;
	if (params.app === "markdown" && params.file) {
		const fileId = FILE_SLUG_MAP[params.file.toLowerCase()];
		if (fileId) {
			projectSchema = generateProjectSchema(fileId);
		}
	}

	// Determine if we're on the homepage (no app specified)
	// Homepage should include h1 for entity verification
	const isHomepage = !params.app;

	// Markdown content has its own h1, so skip entity h1 when viewing files
	const hasContentH1 = params.app === "markdown" && params.file;

	return (
		<StoreHydrator initialState={initialState}>
			<BootManager>
				<BootScreen />
				<Stage />
				<WelcomeOverlay />
			</BootManager>
			{/* SSR Entity Card — Identity signals for search engine crawlers */}
			{/* Renders entity data (name, social links) in crawlable hidden section */}
			<SSREntityCard includeH1={isHomepage || !hasContentH1} />
			{/* SSR Content Projection — Hidden content for search engine crawlers */}
			{/* This renders pre-fetched content in a crawlable but visually hidden element */}
			<SSRContentProjection windows={initialState.windows} />
			{/* Schema.org JSON-LD for SoftwareSourceCode (projects only) */}
			{projectSchema && (
				<script
					type="application/ld+json"
					dangerouslySetInnerHTML={{ __html: renderJsonLd(projectSchema) }}
				/>
			)}
		</StoreHydrator>
	);
}
