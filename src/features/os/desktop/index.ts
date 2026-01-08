/**
 * Desktop Module
 *
 * Contains the Stage, Dock, SystemBar, and all background layer components.
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
export {
	SelectionBox as SelectionBoxComponent,
	type SelectionBoxProps,
} from "./SelectionBox";
export { Stage, type StageProps } from "./Stage";
export { SystemBar, type SystemBarProps } from "./system-bar";
export {
	type SelectionBox,
	type UseSelectionBoxReturn,
	useSelectionBox,
} from "./useSelectionBox";
export { Vignette, type VignetteProps } from "./Vignette";
