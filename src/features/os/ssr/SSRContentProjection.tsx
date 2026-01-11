/**
 * SSRContentProjection — Server-Side Content for SEO
 *
 * Renders pre-fetched content in a crawlable but visually hidden element.
 * This ensures search engines can index content from the initial HTML response
 * without waiting for JavaScript execution.
 *
 * The content is:
 * - Present in the DOM for crawlers to index
 * - Visually hidden from users (uses sr-only pattern)
 * - Does not interfere with the interactive UI
 *
 * This component should be rendered in the server component (page.tsx)
 * alongside the interactive OS UI.
 */

import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

export interface SSRContentProjectionProps {
	/**
	 * Window instances with potential SSR content.
	 * Only windows with `ssrContent` in their props will be rendered.
	 */
	windows: Array<{
		id: string;
		props?: {
			title?: string;
			ssrContent?: string;
		};
	}>;
}

/**
 * Renders SSR content in a crawlable hidden element.
 *
 * Uses the screen-reader-only pattern (position: absolute, clip: rect)
 * which is accessible to crawlers but not visible to users.
 *
 * @see https://webaim.org/techniques/css/invisiblecontent/
 */
export function SSRContentProjection({ windows }: SSRContentProjectionProps) {
	// Filter to windows that have SSR content
	const windowsWithContent = windows.filter(
		(w) => w.props?.ssrContent && w.props.ssrContent.length > 0,
	);

	if (windowsWithContent.length === 0) {
		return null;
	}

	return (
		<div className="sr-only" aria-hidden="true" data-ssr-content="true">
			{windowsWithContent.map((window) => {
				const content = window.props?.ssrContent;
				const title = window.props?.title;

				if (!content) return null;

				return (
					<article key={window.id} data-window-id={window.id} data-ssr-projected="true">
						{title && <h1>{title}</h1>}
						<Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
					</article>
				);
			})}
		</div>
	);
}
