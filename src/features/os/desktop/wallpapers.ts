/**
 * Wallpaper Configuration — SEO-01 Phase 3
 *
 * Centralized wallpaper registry with blur placeholders for
 * optimized image loading (LCP improvement).
 *
 * Each wallpaper includes:
 * - path: Public URL to the image
 * - name: Display name for UI
 * - blurDataURL: Tiny base64 placeholder for instant preview
 * - dominantColor: CSS fallback color
 */

export interface WallpaperConfig {
	/** Unique identifier */
	id: string;
	/** Display name for UI */
	name: string;
	/** Path to the wallpaper image (public folder) */
	path: string;
	/** Dominant color for CSS fallback */
	dominantColor: string;
	/** Base64 blur placeholder for next/image */
	blurDataURL: string;
}

/**
 * Generate a tiny 1x1 pixel base64 data URL from a hex color.
 * Used as blur placeholder for next/image.
 */
function generateBlurPlaceholder(hexColor: string): string {
	// Convert hex to RGB
	const hex = hexColor.replace("#", "");
	const r = Number.parseInt(hex.substring(0, 2), 16);
	const g = Number.parseInt(hex.substring(2, 4), 16);
	const b = Number.parseInt(hex.substring(4, 6), 16);

	// Create a 10x10 SVG with the color (next/image requires minimum dimensions)
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect fill="rgb(${r},${g},${b})" width="10" height="10"/></svg>`;
	const base64 = btoa(svg);
	return `data:image/svg+xml;base64,${base64}`;
}

/**
 * All available wallpapers with optimized loading configuration.
 * Dominant colors were extracted from each image for accurate placeholders.
 */
export const WALLPAPERS: WallpaperConfig[] = [
	{
		id: "wall-1",
		name: "Monterey Dark",
		path: "/assets/wallpapers/wall-1.jpg",
		dominantColor: "#1a1a2e",
		blurDataURL: generateBlurPlaceholder("#1a1a2e"),
	},
	{
		id: "wall-2",
		name: "Sonoma",
		path: "/assets/wallpapers/wall-2.jpg",
		dominantColor: "#2d1f3d",
		blurDataURL: generateBlurPlaceholder("#2d1f3d"),
	},
	{
		id: "wall-3",
		name: "Late Night Coding",
		path: "/assets/wallpapers/wall-3.jpg",
		dominantColor: "#1e1428",
		blurDataURL: generateBlurPlaceholder("#1e1428"),
	},
	{
		id: "wall-4",
		name: "Fluid Blue",
		path: "/assets/wallpapers/wall-4.jpg",
		dominantColor: "#0d1b2a",
		blurDataURL: generateBlurPlaceholder("#0d1b2a"),
	},
	{
		id: "wall-5",
		name: "VS Code",
		path: "/assets/wallpapers/wall-5.jpg",
		dominantColor: "#1e1e1e",
		blurDataURL: generateBlurPlaceholder("#1e1e1e"),
	},
	{
		id: "wall-6",
		name: "Yosemite Sunrise",
		path: "/assets/wallpapers/wall-6.jpg",
		dominantColor: "#3d2a4d",
		blurDataURL: generateBlurPlaceholder("#3d2a4d"),
	},
	{
		id: "wall-7",
		name: "Do Something Great",
		path: "/assets/wallpapers/wall-7.jpg",
		dominantColor: "#1a1a1a",
		blurDataURL: generateBlurPlaceholder("#1a1a1a"),
	},
	{
		id: "wall-8",
		name: "Ventura Night",
		path: "/assets/wallpapers/wall-8.jpg",
		dominantColor: "#1f1135",
		blurDataURL: generateBlurPlaceholder("#1f1135"),
	},
	{
		id: "wall-9",
		name: "Dark Bloom",
		path: "/assets/wallpapers/wall-9.jpg",
		dominantColor: "#0d0d14",
		blurDataURL: generateBlurPlaceholder("#0d0d14"),
	},
	{
		id: "wall-10",
		name: "Blue Bloom",
		path: "/assets/wallpapers/wall-10.jpg",
		dominantColor: "#0a1628",
		blurDataURL: generateBlurPlaceholder("#0a1628"),
	},
];

/**
 * Default wallpaper path (Dark Bloom - wall-9).
 */
export const DEFAULT_WALLPAPER_PATH = "/assets/wallpapers/wall-9.jpg";

/**
 * Map of wallpaper paths to their configurations.
 * Enables O(1) lookup for blur data in Stage component.
 */
export const WALLPAPER_MAP: Map<string, WallpaperConfig> = new Map(
	WALLPAPERS.map((w) => [w.path, w]),
);

/**
 * Get wallpaper config by path.
 * Returns undefined if path is not in registry.
 */
export function getWallpaperConfig(path: string): WallpaperConfig | undefined {
	return WALLPAPER_MAP.get(path);
}
