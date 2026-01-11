import type { Metadata } from "next";
import { generatePathMetadata, parsePathToState } from "@/lib/seo";
import { OSShell } from "@/os/ssr";

/**
 * Generate metadata for the contact page.
 */
export function generateMetadata(): Metadata {
	return generatePathMetadata("/contact");
}

/**
 * Contact Page — /contact
 *
 * Opens the Contact window with the contact form.
 */
export default async function ContactPage() {
	const initialState = parsePathToState("/contact");

	return <OSShell initialState={initialState} />;
}
