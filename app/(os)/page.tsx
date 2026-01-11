import type { Metadata } from "next";
import { generatePathMetadata, parsePathToState } from "@/lib/seo";
import { OSShell } from "@/os/ssr";

/**
 * Generate metadata for the homepage.
 */
export function generateMetadata(): Metadata {
	return generatePathMetadata("/");
}

/**
 * Homepage — Desktop with no windows open
 *
 * The root route displays the OS desktop with no windows open.
 * This is the entry point for the spatial portfolio experience.
 */
export default async function HomePage() {
	const initialState = parsePathToState("/");

	return <OSShell initialState={initialState} isHomepage />;
}
