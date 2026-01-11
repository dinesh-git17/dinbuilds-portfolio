import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
	generateExperienceFileMetadata,
	getExperienceFileBySlug,
	getExperienceFileSlugs,
} from "@/lib/seo";
import { OSShell } from "@/os/ssr";
import {
	AppID,
	AUTO_FULLSCREEN_APPS,
	DEFAULT_WINDOW_SIZES,
	MAXIMIZED_APPS,
} from "@/os/store/types";

interface ExperienceFilePageProps {
	params: Promise<{ slug: string }>;
}

/**
 * Generate static params for all experience files.
 * Enables static generation for known experience file routes.
 */
export function generateStaticParams() {
	return getExperienceFileSlugs().map((slug) => ({ slug }));
}

/**
 * Generate metadata for an experience file page.
 */
export async function generateMetadata({ params }: ExperienceFilePageProps): Promise<Metadata> {
	const { slug } = await params;
	const metadata = generateExperienceFileMetadata(slug);

	if (!metadata) {
		return {};
	}

	return metadata;
}

/**
 * Calculate centered window position for SSR.
 */
const SSR_VIEWPORT = { width: 1440, height: 900 };
const SYSTEM_BAR_HEIGHT = 32;
const DOCK_HEIGHT = 80;
const MAXIMIZED_PADDING = 32;

function calculateSSRPosition(width: number, height: number): { x: number; y: number } {
	const availableHeight = SSR_VIEWPORT.height - SYSTEM_BAR_HEIGHT - DOCK_HEIGHT;
	return {
		x: Math.max(16, (SSR_VIEWPORT.width - width) / 2),
		y: Math.max(SYSTEM_BAR_HEIGHT + 8, SYSTEM_BAR_HEIGHT + (availableHeight - height) / 2),
	};
}

function calculateSSRMaximizedSize(): { width: number; height: number } {
	return {
		width: SSR_VIEWPORT.width - MAXIMIZED_PADDING * 2,
		height: SSR_VIEWPORT.height - SYSTEM_BAR_HEIGHT - DOCK_HEIGHT - MAXIMIZED_PADDING,
	};
}

/**
 * Experience File Page — /experience/[slug]
 *
 * Dynamic route for experience markdown files.
 * Opens the Markdown Viewer with the experience documentation.
 */
export default async function ExperienceFilePage({ params }: ExperienceFilePageProps) {
	const { slug } = await params;

	// Get file data
	const file = getExperienceFileBySlug(slug);
	if (!file) {
		notFound();
	}

	// Build initial state for markdown viewer
	const appId = AppID.MarkdownViewer;
	const isMaximized = MAXIMIZED_APPS.has(appId);
	const defaultSize = DEFAULT_WINDOW_SIZES[appId];
	const size = isMaximized ? calculateSSRMaximizedSize() : defaultSize;

	const position = isMaximized
		? { x: MAXIMIZED_PADDING, y: SYSTEM_BAR_HEIGHT + MAXIMIZED_PADDING / 2 }
		: calculateSSRPosition(size.width, size.height);

	const initialState = {
		windows: [
			{
				id: appId,
				status: "open" as const,
				position,
				size,
				props: {
					url: file.contentUrl,
					title: file.title,
				},
				openedAt: Date.now(),
			},
		],
		activeWindowId: appId,
		fullscreenWindowId: AUTO_FULLSCREEN_APPS.has(appId) ? appId : null,
	};

	return <OSShell initialState={initialState} fileId={file.fileId} hasContentH1 />;
}
