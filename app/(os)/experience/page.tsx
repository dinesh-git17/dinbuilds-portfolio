import type { Metadata } from "next";
import { generatePathMetadata, parsePathToState } from "@/lib/seo";
import { OSShell } from "@/os/ssr";

/**
 * Generate metadata for the experience folder page.
 */
export function generateMetadata(): Metadata {
	return generatePathMetadata("/experience");
}

/**
 * Experience Folder Page — /experience
 *
 * Opens the Experience folder window showing all experience files.
 */
export default async function ExperiencePage() {
	const initialState = parsePathToState("/experience");

	return <OSShell initialState={initialState} />;
}
