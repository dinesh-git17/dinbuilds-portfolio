import type { Metadata } from "next";
import {
	generatePathMetadata,
	generateSoftwareApplicationSchema,
	parsePathToState,
	renderJsonLd,
} from "@/lib/seo";
import { OSShell } from "@/os/ssr";

/**
 * Generate metadata for the PassFX project page.
 */
export function generateMetadata(): Metadata {
	return generatePathMetadata("/projects/passfx");
}

/**
 * PassFX Project Page — /projects/passfx (Story 5)
 *
 * Opens the PassFX app - a zero-knowledge password manager TUI.
 * Includes SoftwareApplication schema for rich search results.
 */
export default async function PassFXPage() {
	const initialState = parsePathToState("/projects/passfx");

	// Generate SoftwareApplication schema for PassFX
	const appSchema = generateSoftwareApplicationSchema("file.passfx");

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
