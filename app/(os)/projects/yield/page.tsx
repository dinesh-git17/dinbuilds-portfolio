import type { Metadata } from "next";
import { generatePathMetadata, parsePathToState } from "@/lib/seo";
import { OSShell } from "@/os/ssr";

/**
 * Generate metadata for the Yield project page.
 */
export function generateMetadata(): Metadata {
	return generatePathMetadata("/projects/yield");
}

/**
 * Yield Project Page — /projects/yield
 *
 * Opens the Yield app - an interactive algorithm visualizer.
 */
export default async function YieldPage() {
	const initialState = parsePathToState("/projects/yield");

	return <OSShell initialState={initialState} />;
}
