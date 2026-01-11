import type { Metadata } from "next";
import { generatePathMetadata, parsePathToState } from "@/lib/seo";
import { OSShell } from "@/os/ssr";

/**
 * Generate metadata for the FAQ/System Manual page.
 */
export function generateMetadata(): Metadata {
	return generatePathMetadata("/faq");
}

/**
 * FAQ Page — /faq
 *
 * Opens the System Manual (FAQ) window with documentation.
 */
export default async function FAQPage() {
	const initialState = parsePathToState("/faq");

	return <OSShell initialState={initialState} />;
}
