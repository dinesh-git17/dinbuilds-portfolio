import type { Metadata } from "next";
import { generatePathMetadata, parsePathToState } from "@/lib/seo";
import { OSShell } from "@/os/ssr";

/**
 * Generate metadata for the projects folder page.
 */
export function generateMetadata(): Metadata {
	return generatePathMetadata("/projects");
}

/**
 * Projects Folder Page — /projects
 *
 * Opens the Projects folder window showing all project files.
 */
export default async function ProjectsPage() {
	const initialState = parsePathToState("/projects");

	return <OSShell initialState={initialState} />;
}
