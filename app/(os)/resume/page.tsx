import type { Metadata } from "next";
import { fetchParsedResume } from "@/lib/content";
import { generatePathMetadata, parsePathToState } from "@/lib/seo";
import { OSShell, SSRResumeContent } from "@/os/ssr";

/**
 * Generate metadata for the resume page.
 */
export function generateMetadata(): Metadata {
	return generatePathMetadata("/resume");
}

/**
 * Resume Page — /resume (Story 5)
 *
 * Opens the Markdown Viewer with the resume document.
 * Server-renders resume content with semantic HTML for SEO.
 */
export default async function ResumePage() {
	const initialState = parsePathToState("/resume");

	// Fetch and parse resume for semantic SSR
	const parsedResume = await fetchParsedResume();

	return (
		<>
			<OSShell initialState={initialState} hasContentH1 />
			{/* SSR Resume Content — Semantic HTML for crawlers */}
			{parsedResume && <SSRResumeContent resume={parsedResume} />}
		</>
	);
}
