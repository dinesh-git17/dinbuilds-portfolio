import type { Metadata } from "next";
import {
	FILE_SLUG_MAP,
	generatePageMetadata,
	generateProjectSchema,
	type PageSearchParams,
	parseURLToState,
	renderJsonLd,
} from "@/lib/seo";
import { Stage } from "@/os/desktop";
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
 */
export default async function Home({ searchParams }: PageProps) {
	const params = await searchParams;
	const initialState = parseURLToState(params);

	// Generate project schema if viewing a markdown file
	let projectSchema = null;
	if (params.app === "markdown" && params.file) {
		const fileId = FILE_SLUG_MAP[params.file.toLowerCase()];
		if (fileId) {
			projectSchema = generateProjectSchema(fileId);
		}
	}

	return (
		<StoreHydrator initialState={initialState}>
			<Stage />
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
