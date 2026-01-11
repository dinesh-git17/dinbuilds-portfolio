import type { Metadata } from "next";
import { generatePathMetadata, parsePathToState } from "@/lib/seo";
import { OSShell } from "@/os/ssr";

/**
 * Generate metadata for the Debate Lab project page.
 */
export function generateMetadata(): Metadata {
	return generatePathMetadata("/projects/debate");
}

/**
 * Debate Lab Project Page — /projects/debate
 *
 * Opens the Debate Lab app - AI models debating in real-time.
 */
export default async function DebatePage() {
	const initialState = parsePathToState("/projects/debate");

	return <OSShell initialState={initialState} />;
}
