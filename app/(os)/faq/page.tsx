import type { Metadata } from "next";
import { fetchAllFAQContent } from "@/lib/content";
import {
	generateFAQPageSchema,
	generatePathMetadata,
	parsePathToState,
	renderJsonLd,
} from "@/lib/seo";
import { OSShell, SSRFAQContent } from "@/os/ssr";

/**
 * Generate metadata for the FAQ/System Manual page.
 */
export function generateMetadata(): Metadata {
	return generatePathMetadata("/faq");
}

/**
 * FAQ Page — /faq (Story 5)
 *
 * Opens the System Manual (FAQ) window with documentation.
 * Server-renders FAQ content and FAQPage schema for SEO.
 */
export default async function FAQPage() {
	const initialState = parsePathToState("/faq");

	// Fetch all FAQ content server-side for SSR and schema
	const faqEntries = await fetchAllFAQContent();

	// Generate FAQPage schema from entries
	const faqSchema = generateFAQPageSchema(faqEntries);

	return (
		<>
			<OSShell initialState={initialState} />
			{/* SSR FAQ Content — Semantic HTML for crawlers */}
			<SSRFAQContent entries={faqEntries} />
			{/* FAQPage Schema for rich snippets */}
			<script
				type="application/ld+json"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD schema injection is a standard pattern; content is developer-controlled
				dangerouslySetInnerHTML={{ __html: renderJsonLd(faqSchema) }}
			/>
		</>
	);
}
