/**
 * SSRFAQContent — Server-Side FAQ Rendering (Story 5)
 *
 * Renders FAQ content in semantic HTML for search engine crawlers.
 * Uses description list (<dl>) format for structured Q&A content.
 *
 * The content is:
 * - Present in the DOM for crawlers to index
 * - Visually hidden from users (uses sr-only pattern)
 * - Does not interfere with the interactive FAQ app
 * - Provides semantic structure for rich snippets
 */

import type { FAQEntry } from "@/lib/seo";

export interface SSRFAQContentProps {
	/** FAQ entries to render */
	entries: FAQEntry[];
}

/**
 * Renders FAQ content as semantic description lists for SEO.
 *
 * Uses the screen-reader-only pattern (position: absolute, clip: rect)
 * which is accessible to crawlers but not visible to users.
 *
 * @see https://schema.org/FAQPage
 */
export function SSRFAQContent({ entries }: SSRFAQContentProps) {
	if (entries.length === 0) {
		return null;
	}

	return (
		<section className="sr-only" aria-label="Frequently Asked Questions" data-ssr-faq="true">
			<h1>Frequently Asked Questions</h1>
			<p>
				Common questions about Dinesh Dawonauth, his projects, technologies, and this portfolio.
			</p>

			<dl data-ssr-faq-list="true">
				{entries.map((entry, index) => (
					<div key={`faq-${index}-${entry.question.slice(0, 20)}`}>
						<dt data-question="true">
							<strong>{entry.question}</strong>
						</dt>
						<dd data-answer="true">{entry.answer}</dd>
					</div>
				))}
			</dl>
		</section>
	);
}
