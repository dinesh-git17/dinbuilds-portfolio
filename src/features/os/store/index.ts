/**
 * OS Store Module
 *
 * Central export for all system state management.
 * Import from '@/os/store' for clean access.
 */

// Hydration
export { StoreHydrator, type StoreHydratorProps } from "./StoreHydrator";
// Store
export {
	selectActiveWindowId,
	selectDockConfig,
	selectFullscreenWindowId,
	selectIsAnyWindowFullscreen,
	selectIsWindowActive,
	selectIsWindowFullscreen,
	selectWallpaper,
	selectWindowById,
	selectWindows,
	useHasHydrated,
	useSystemStore,
} from "./system-store";

// Types
export {
	AppID,
	AUTO_FULLSCREEN_APPS,
	DEFAULT_DOCK_CONFIG,
	DEFAULT_WINDOW_SIZES,
	DOCK_SIZE_MAP,
	type DockConfig,
	type DockPosition,
	type DockSize,
	MAXIMIZED_APPS,
	type SystemActions,
	type SystemState,
	type SystemStore,
	type WindowInstance,
	type WindowPosition,
	type WindowProps,
	type WindowSize,
	type WindowSpawnConfig,
	type WindowStatus,
} from "./types";
