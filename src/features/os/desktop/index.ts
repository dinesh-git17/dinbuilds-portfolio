/**
 * Desktop Module
 *
 * Contains the Stage, Dock, and all background layer components.
 * Import via '@/os/desktop'.
 */

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
export { Stage, type StageProps } from "./Stage";
export { Vignette, type VignetteProps } from "./Vignette";
