import { hydrateWindowContent } from "@/lib/content";
import { generateProjectSchema, type HydrationState, renderJsonLd } from "@/lib/seo";
import { BootManager, BootScreen, WelcomeOverlay } from "@/os/boot";
import { Stage } from "@/os/desktop";
import { SSRContentProjection, SSREntityCard } from "@/os/ssr";
import { StoreHydrator } from "@/os/store";

export interface OSShellProps {
	/** Initial window state derived from route */
	initialState: HydrationState;
	/** File ID for project schema (if viewing a project file) */
	fileId?: string | null;
	/** Whether this is the homepage (controls h1 rendering) */
	isHomepage?: boolean;
	/** Whether the content has its own h1 (markdown files) */
	hasContentH1?: boolean;
}

/**
 * OSShell — Shared Server Component
 *
 * Renders the complete OS shell with:
 * - Store hydration with initial window state
 * - Boot sequence (screen, manager, welcome)
 * - Desktop stage
 * - SSR entity card for identity signals
 * - SSR content projection for crawler visibility
 * - Optional project schema for file routes
 *
 * Usage:
 * ```tsx
 * const state = parsePathToState(pathname);
 * const hydratedState = await hydrateWindowContent(state);
 * return <OSShell initialState={hydratedState} />;
 * ```
 */
export async function OSShell({
	initialState,
	fileId,
	isHomepage = false,
	hasContentH1 = false,
}: OSShellProps) {
	// Hydrate content server-side for SSR
	const hydratedState = await hydrateWindowContent(initialState);

	// Generate project schema if viewing a project file
	let projectSchema = null;
	if (fileId) {
		projectSchema = generateProjectSchema(fileId);
	}

	return (
		<StoreHydrator initialState={hydratedState}>
			<BootManager>
				<BootScreen />
				<Stage />
				<WelcomeOverlay />
			</BootManager>
			{/* SSR Entity Card — Identity signals for search engine crawlers */}
			<SSREntityCard includeH1={isHomepage || !hasContentH1} />
			{/* SSR Content Projection — Hidden content for search engine crawlers */}
			<SSRContentProjection windows={hydratedState.windows} />
			{/* Schema.org JSON-LD for SoftwareSourceCode (projects only) */}
			{projectSchema && (
				<script
					type="application/ld+json"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD schema injection is a standard pattern; content is developer-controlled, not user-generated
					dangerouslySetInnerHTML={{ __html: renderJsonLd(projectSchema) }}
				/>
			)}
		</StoreHydrator>
	);
}
