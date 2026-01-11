import type { Metadata } from "next";
import {
	generatePathMetadata,
	generateSoftwareApplicationSchema,
	parsePathToState,
	renderJsonLd,
} from "@/lib/seo";
import { OSShell } from "@/os/ssr";

/**
 * Generate metadata for the Yield project page.
 */
export function generateMetadata(): Metadata {
	return generatePathMetadata("/projects/yield");
}

/**
 * Yield Project Page — /projects/yield (Story 5)
 *
 * Opens the Yield app - an interactive algorithm visualizer.
 * Includes SoftwareApplication schema for rich search results.
 */
export default async function YieldPage() {
	const initialState = parsePathToState("/projects/yield");

	// Generate SoftwareApplication schema for Yield
	const appSchema = generateSoftwareApplicationSchema("file.yield");

	return (
		<>
			<OSShell initialState={initialState} />
			{/* SoftwareApplication schema for project (Story 5) */}
			{appSchema && (
				<script
					type="application/ld+json"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD schema injection is a standard pattern; content is developer-controlled
					dangerouslySetInnerHTML={{ __html: renderJsonLd(appSchema) }}
				/>
			)}
		</>
	);
}
