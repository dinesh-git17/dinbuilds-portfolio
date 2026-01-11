import type { Metadata } from "next";
import {
	generatePathMetadata,
	generateSoftwareApplicationSchema,
	parsePathToState,
	renderJsonLd,
} from "@/lib/seo";
import { OSShell } from "@/os/ssr";

/**
 * Generate metadata for the Debate Lab project page.
 */
export function generateMetadata(): Metadata {
	return generatePathMetadata("/projects/debate");
}

/**
 * Debate Lab Project Page — /projects/debate (Story 5)
 *
 * Opens the Debate Lab app - AI models debating in real-time.
 * Includes SoftwareApplication schema for rich search results.
 */
export default async function DebatePage() {
	const initialState = parsePathToState("/projects/debate");

	// Generate SoftwareApplication schema for Debate Lab
	const appSchema = generateSoftwareApplicationSchema("file.debate-lab");

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
