import type { Metadata } from "next";
import { generatePathMetadata, parsePathToState } from "@/lib/seo";
import { OSShell } from "@/os/ssr";

/**
 * Generate metadata for the about page.
 */
export function generateMetadata(): Metadata {
	return generatePathMetadata("/about");
}

/**
 * About Page — /about
 *
 * Opens the About window displaying personal information and bio.
 */
export default async function AboutPage() {
	const initialState = parsePathToState("/about");

	return <OSShell initialState={initialState} />;
}
