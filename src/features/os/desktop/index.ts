/**
 * Desktop Module
 *
 * Contains the Stage, Dock, SystemBar, and all background layer components.
 * Import via '@/os/desktop'.
 */

export { DesktopIcon, type DesktopIconProps } from "./DesktopIcon";
export {
	type DeviceType,
	DOCK_ITEMS,
	Dock,
	DockIcon,
	type DockIconProps,
	type DockItemConfig,
	useDeviceType,
} from "./dock";
export { GridPattern, type GridPatternProps } from "./GridPattern";
export {
	SelectionBox as SelectionBoxComponent,
	type SelectionBoxProps,
} from "./SelectionBox";
export { Stage, type StageProps } from "./Stage";
export { SystemBar, type SystemBarProps } from "./system-bar";
export {
	DESKTOP_ITEMS,
	type DesktopItem,
	type SelectionRect,
	useDesktop,
} from "./useDesktop";
export {
	type SelectionBox,
	type UseSelectionBoxReturn,
	useSelectionBox,
} from "./useSelectionBox";
export { useWallpaperSync } from "./useWallpaperSync";
export { Vignette, type VignetteProps } from "./Vignette";
export {
	DEFAULT_MOBILE_WALLPAPER_PATH,
	DEFAULT_WALLPAPER_PATH,
	getAnyWallpaperConfig,
	getMobileWallpaperConfig,
	getWallpaperConfig,
	isDesktopWallpaper,
	isMobileWallpaper,
	MOBILE_WALLPAPER_MAP,
	MOBILE_WALLPAPERS,
	WALLPAPER_MAP,
	WALLPAPERS,
	type WallpaperConfig,
} from "./wallpapers";
