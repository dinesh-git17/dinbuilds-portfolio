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

/**
 * Mobile Wallpaper Configuration
 *
 * Portrait-oriented wallpapers optimized for mobile devices.
 * These assets are served exclusively when deviceType === 'mobile'.
 */
export const MOBILE_WALLPAPERS: WallpaperConfig[] = [
	{
		id: "mob-wall-1",
		name: "Obsidian Flow",
		path: "/assets/mobile-wallpapers/mob-wall-1.jpg",
		dominantColor: "#0a0a0a",
		blurDataURL: generateBlurPlaceholder("#0a0a0a"),
	},
	{
		id: "mob-wall-2",
		name: "Aurora",
		path: "/assets/mobile-wallpapers/mob-wall-2.jpg",
		dominantColor: "#3d1f5c",
		blurDataURL: generateBlurPlaceholder("#3d1f5c"),
	},
	{
		id: "mob-wall-3",
		name: "Neon Bars",
		path: "/assets/mobile-wallpapers/mob-wall-3.jpg",
		dominantColor: "#2a1a3d",
		blurDataURL: generateBlurPlaceholder("#2a1a3d"),
	},
	{
		id: "mob-wall-4",
		name: "Pastel Dreams",
		path: "/assets/mobile-wallpapers/mob-wall-4.jpg",
		dominantColor: "#a8b0c8",
		blurDataURL: generateBlurPlaceholder("#a8b0c8"),
	},
	{
		id: "mob-wall-5",
		name: "Twisted",
		path: "/assets/mobile-wallpapers/mob-wall-5.jpg",
		dominantColor: "#0d1028",
		blurDataURL: generateBlurPlaceholder("#0d1028"),
	},
	{
		id: "mob-wall-6",
		name: "Marble Flow",
		path: "/assets/mobile-wallpapers/mob-wall-6.jpg",
		dominantColor: "#0f1821",
		blurDataURL: generateBlurPlaceholder("#0f1821"),
	},
	{
		id: "mob-wall-7",
		name: "Nebula",
		path: "/assets/mobile-wallpapers/mob-wall-7.jpg",
		dominantColor: "#3d5a6d",
		blurDataURL: generateBlurPlaceholder("#3d5a6d"),
	},
];

/**
 * Default mobile wallpaper path (Obsidian Flow - mob-wall-1).
 */
export const DEFAULT_MOBILE_WALLPAPER_PATH = "/assets/mobile-wallpapers/mob-wall-1.jpg";

/**
 * Map of mobile wallpaper paths to their configurations.
 * Enables O(1) lookup for blur data in Stage component.
 */
export const MOBILE_WALLPAPER_MAP: Map<string, WallpaperConfig> = new Map(
	MOBILE_WALLPAPERS.map((w) => [w.path, w]),
);

/**
 * Get mobile wallpaper config by path.
 * Returns undefined if path is not in registry.
 */
export function getMobileWallpaperConfig(path: string): WallpaperConfig | undefined {
	return MOBILE_WALLPAPER_MAP.get(path);
}

/**
 * Check if a wallpaper path belongs to the mobile collection.
 */
export function isMobileWallpaper(path: string): boolean {
	return path.startsWith("/assets/mobile-wallpapers/");
}

/**
 * Check if a wallpaper path belongs to the desktop collection.
 */
export function isDesktopWallpaper(path: string): boolean {
	return path.startsWith("/assets/wallpapers/");
}

/**
 * Get wallpaper config from either collection.
 * Checks mobile first, then desktop.
 */
export function getAnyWallpaperConfig(path: string): WallpaperConfig | undefined {
	return MOBILE_WALLPAPER_MAP.get(path) ?? WALLPAPER_MAP.get(path);
}
