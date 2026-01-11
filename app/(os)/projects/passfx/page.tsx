import type { Metadata } from "next";
import { generatePathMetadata, parsePathToState } from "@/lib/seo";
import { OSShell } from "@/os/ssr";

/**
 * Generate metadata for the PassFX project page.
 */
export function generateMetadata(): Metadata {
	return generatePathMetadata("/projects/passfx");
}

/**
 * PassFX Project Page — /projects/passfx
 *
 * Opens the PassFX app - a zero-knowledge password manager TUI.
 */
export default async function PassFXPage() {
	const initialState = parsePathToState("/projects/passfx");

	return <OSShell initialState={initialState} />;
}
