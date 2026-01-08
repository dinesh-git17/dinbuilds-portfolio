/**
 * System Store Type Definitions
 *
 * Defines the complete type system for the Spatial OS window management.
 * All window identifiers use the AppID enum to prevent magic strings.
 */

/**
 * Application identifiers for all installable apps.
 * Use this enum everywhere instead of string literals.
 */
export enum AppID {
	Yield = "app.yield",
	Debate = "app.debate",
	Terminal = "app.terminal",
	About = "app.about",
	Contact = "app.contact",
}

/**
 * Window visibility states
 */
export type WindowStatus = "open" | "minimized";

/**
 * Position coordinates for window placement
 */
export interface WindowPosition {
	x: number;
	y: number;
}

/**
 * Dimensions for window sizing
 */
export interface WindowSize {
	width: number;
	height: number;
}

/**
 * Runtime instance of an open window.
 * Each window in the stack is represented by this type.
 */
export interface WindowInstance {
	/** Unique identifier matching the app manifest */
	id: AppID;
	/** Current visibility state */
	status: WindowStatus;
	/** Position on the desktop stage */
	position: WindowPosition;
	/** Current dimensions */
	size: WindowSize;
}

/**
 * Configuration for spawning a new window.
 * Partial so apps can use defaults.
 */
export interface WindowSpawnConfig {
	position?: WindowPosition;
	size?: WindowSize;
}

/**
 * Default window dimensions per app.
 * Used when spawning without explicit size.
 */
export const DEFAULT_WINDOW_SIZES: Record<AppID, WindowSize> = {
	[AppID.Yield]: { width: 900, height: 650 },
	[AppID.Debate]: { width: 850, height: 600 },
	[AppID.Terminal]: { width: 700, height: 500 },
	[AppID.About]: { width: 780, height: 520 },
	[AppID.Contact]: { width: 780, height: 520 },
};

/**
 * State slice for the system store.
 * Represents the current state of all windows.
 */
export interface SystemState {
	/**
	 * Ordered array of window instances.
	 * Last item = highest Z-index (topmost window).
	 */
	windows: WindowInstance[];

	/**
	 * ID of the currently focused window.
	 * null when no windows are open or all are minimized.
	 */
	activeWindowId: AppID | null;
}

/**
 * Actions available on the system store.
 * Separated from state for clean typing.
 */
export interface SystemActions {
	/**
	 * Launch an app or bring existing instance to front.
	 * If minimized, restores and focuses.
	 * If not open, creates new instance.
	 */
	launchApp: (appId: AppID, config?: WindowSpawnConfig) => void;

	/**
	 * Close a window and remove from stack.
	 * Focus transfers to next window in stack.
	 */
	closeWindow: (id: AppID) => void;

	/**
	 * Bring window to front (highest Z-index).
	 * Moves window to end of array.
	 */
	focusWindow: (id: AppID) => void;

	/**
	 * Hide window but keep in stack.
	 * Sets status to 'minimized'.
	 */
	minimizeWindow: (id: AppID) => void;

	/**
	 * Update window position after drag.
	 */
	updateWindowPosition: (id: AppID, position: WindowPosition) => void;

	/**
	 * Update window size after resize.
	 */
	updateWindowSize: (id: AppID, size: WindowSize) => void;
}

/**
 * Complete store type combining state and actions.
 */
export type SystemStore = SystemState & SystemActions;
