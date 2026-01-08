/**
 * OS Store Module
 *
 * Central export for all system state management.
 * Import from '@/os/store' for clean access.
 */

// Store
export {
	selectActiveWindowId,
	selectIsWindowActive,
	selectWindowById,
	selectWindows,
	useSystemStore,
} from "./system-store";

// Types
export {
	AppID,
	DEFAULT_WINDOW_SIZES,
	type SystemActions,
	type SystemState,
	type SystemStore,
	type WindowInstance,
	type WindowPosition,
	type WindowSize,
	type WindowSpawnConfig,
	type WindowStatus,
} from "./types";
