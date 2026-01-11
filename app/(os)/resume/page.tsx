import type { Metadata } from "next";
import { generatePathMetadata, parsePathToState } from "@/lib/seo";
import { OSShell } from "@/os/ssr";

/**
 * Generate metadata for the resume page.
 */
export function generateMetadata(): Metadata {
	return generatePathMetadata("/resume");
}

/**
 * Resume Page — /resume
 *
 * Opens the Markdown Viewer with the resume document.
 */
export default async function ResumePage() {
	const initialState = parsePathToState("/resume");

	return <OSShell initialState={initialState} hasContentH1 />;
}
