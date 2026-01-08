/**
 * OS Store Module
 *
 * Central export for all system state management.
 * Import from '@/os/store' for clean access.
 */

// Store
export {
	selectActiveWindowId,
	selectFullscreenWindowId,
	selectIsAnyWindowFullscreen,
	selectIsWindowActive,
	selectIsWindowFullscreen,
	selectWindowById,
	selectWindows,
	useSystemStore,
} from "./system-store";

// Types
export {
	AppID,
	AUTO_FULLSCREEN_APPS,
	DEFAULT_WINDOW_SIZES,
	MAXIMIZED_APPS,
	type SystemActions,
	type SystemState,
	type SystemStore,
	type WindowInstance,
	type WindowPosition,
	type WindowSize,
	type WindowSpawnConfig,
	type WindowStatus,
} from "./types";
