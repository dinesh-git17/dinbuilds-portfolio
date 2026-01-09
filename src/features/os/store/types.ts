/**
 * System Store Type Definitions
 *
 * Defines the complete type system for the Spatial OS window management.
 * All window identifiers use the AppID enum to prevent magic strings.
 */

/**
 * Boot sequence phases for system initialization.
 * Transitions: hidden -> booting -> desktop_enter -> complete
 */
export type BootPhase = "hidden" | "booting" | "desktop_enter" | "complete";

/**
 * Application identifiers for all installable apps.
 * Use this enum everywhere instead of string literals.
 */
export enum AppID {
	Yield = "app.yield",
	Debate = "app.debate",
	PassFX = "app.passfx",
	Terminal = "app.terminal",
	About = "app.about",
	Contact = "app.contact",
	Settings = "app.settings",
	FolderProjects = "app.folder.projects",
	FolderExperience = "app.folder.experience",
	MarkdownViewer = "app.markdown",
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
 * App-specific props passed to window components.
 * Each app can define its own props shape.
 */
export interface WindowProps {
	/** URL to content for MarkdownViewer */
	url?: string;
	/** Display title override (e.g., file name) */
	title?: string;
	/** Folder ID for FolderApp to load files from VFS */
	folderId?: string;
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
	/** App-specific props passed to the component */
	props?: WindowProps;
}

/**
 * Configuration for spawning a new window.
 * Partial so apps can use defaults.
 */
export interface WindowSpawnConfig {
	position?: WindowPosition;
	size?: WindowSize;
	/** App-specific props to pass to the component */
	props?: WindowProps;
}

/**
 * Default window dimensions per app.
 * Used when spawning without explicit size.
 */
export const DEFAULT_WINDOW_SIZES: Record<AppID, WindowSize> = {
	[AppID.Yield]: { width: 900, height: 650 },
	[AppID.Debate]: { width: 850, height: 600 },
	[AppID.PassFX]: { width: 900, height: 650 },
	[AppID.Terminal]: { width: 780, height: 520 },
	[AppID.About]: { width: 780, height: 520 },
	[AppID.Contact]: { width: 780, height: 520 },
	[AppID.Settings]: { width: 680, height: 480 },
	[AppID.FolderProjects]: { width: 700, height: 450 },
	[AppID.FolderExperience]: { width: 700, height: 450 },
	[AppID.MarkdownViewer]: { width: 900, height: 650 },
};

/**
 * Apps that should maximize to fill the viewport.
 * These windows will be sized to viewport minus padding.
 */
export const MAXIMIZED_APPS: Set<AppID> = new Set([
	AppID.Yield,
	AppID.Debate,
	AppID.PassFX,
	AppID.MarkdownViewer,
]);

/**
 * Apps that should automatically enter fullscreen when launched.
 * These apps will open in fullscreen mode, hiding the dock and system bar.
 */
export const AUTO_FULLSCREEN_APPS: Set<AppID> = new Set([
	AppID.Yield,
	AppID.Debate,
	AppID.PassFX,
	AppID.MarkdownViewer,
]);

/**
 * Dock position options.
 * "Top" is excluded to avoid conflict with the System Bar.
 */
export type DockPosition = "bottom" | "left" | "right";

/**
 * Dock size presets mapped to icon dimensions.
 * sm=40px, md=50px, lg=64px
 */
export type DockSize = "sm" | "md" | "lg";

/**
 * Configuration for dock appearance and behavior.
 */
export interface DockConfig {
	/** Position of the dock on screen */
	position: DockPosition;
	/** Icon size preset */
	size: DockSize;
	/** Whether icons scale up on hover */
	magnification: boolean;
}

/**
 * Default dock configuration.
 * Bottom position, medium size, magnification enabled.
 */
export const DEFAULT_DOCK_CONFIG: DockConfig = {
	position: "bottom",
	size: "md",
	magnification: true,
};

/**
 * Mapping from size preset to icon dimensions in pixels.
 */
export const DOCK_SIZE_MAP: Record<DockSize, number> = {
	sm: 40,
	md: 50,
	lg: 64,
};

/**
 * State slice for the system store.
 * Represents the current state of all windows.
 */
export interface SystemState {
	/**
	 * Current boot sequence phase.
	 * Controls the visibility of boot screen, desktop, and welcome overlay.
	 */
	bootPhase: BootPhase;

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

	/**
	 * ID of the window currently in fullscreen mode.
	 * null when no window is fullscreen.
	 * Fullscreen hides the dock and system bar.
	 */
	fullscreenWindowId: AppID | null;

	/**
	 * Path to the current wallpaper image.
	 * null uses the default Grid/Vignette background.
	 */
	wallpaper: string | null;

	/**
	 * Dock appearance and behavior configuration.
	 * Persisted to localStorage for user preference retention.
	 */
	dockConfig: DockConfig;
}

/**
 * Actions available on the system store.
 * Separated from state for clean typing.
 */
export interface SystemActions {
	/**
	 * Advance the boot sequence to the next phase.
	 * Used by BootManager to orchestrate system initialization.
	 */
	setBootPhase: (phase: BootPhase) => void;

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

	/**
	 * Toggle fullscreen mode for a window.
	 * If window is already fullscreen, exits fullscreen.
	 * If another window is fullscreen, switches to this one.
	 */
	toggleFullscreen: (id: AppID) => void;

	/**
	 * Exit fullscreen mode.
	 */
	exitFullscreen: () => void;

	/**
	 * Set the desktop wallpaper.
	 * Pass null to revert to the default Grid/Vignette.
	 */
	setWallpaper: (path: string | null) => void;

	/**
	 * Update dock configuration.
	 * Accepts partial config to allow updating individual properties.
	 */
	setDockConfig: (config: Partial<DockConfig>) => void;
}

/**
 * Complete store type combining state and actions.
 */
export type SystemStore = SystemState & SystemActions;
