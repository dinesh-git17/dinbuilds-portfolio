/**
 * Dock Module
 *
 * macOS-style application launcher with magnification effect.
 */

export { Dock, type DockProps } from "./Dock";
export { DockIcon, type DockIconProps } from "./DockIcon";
export { DockStack, type DockStackProps } from "./DockStack";
export { DockStackIcon, type DockStackIconProps } from "./DockStackIcon";
export {
	APP_CONFIG_MAP,
	DOCK_ITEMS,
	type DockAppItem,
	type DockItem,
	type DockItemConfig,
	type DockStackItem,
	isDockAppItem,
	isDockStackItem,
	MOBILE_DOCK_ITEMS,
	PROJECTS_STACK,
} from "./dock-config";
export { type DeviceType, useDeviceType } from "./useDeviceType";
