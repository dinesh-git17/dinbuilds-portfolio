/**
 * System Store Type Definitions
 *
 * Defines the complete type system for the Spatial OS window management.
 * All window identifiers use the AppID enum to prevent magic strings.
 */

/**
 * Boot sequence phases for system initialization.
 * Transitions: hidden -> booting -> welcome -> complete
 *
 * - hidden: Initial render, nothing visible
 * - booting: Boot screen with progress bar
 * - welcome: Wallpaper + welcome typography (no functional UI)
 * - complete: Full desktop with all UI elements
 */
export type BootPhase = "hidden" | "booting" | "welcome" | "complete";

/**
 * Onboarding tour steps for both desktop and mobile users.
 *
 * Desktop flow: idle -> window_controls -> window_drag -> dock -> desktop_icons -> outro -> complete
 * Mobile flow:  idle -> window_controls -> dock -> dock_projects_stack -> desktop_icons -> outro -> complete
 *
 * - idle: Tour not active, waiting for trigger
 * - window_controls: Highlighting traffic light buttons (close/min/max)
 * - window_drag: Demonstrating window drag physics (desktop only)
 * - dock: Highlighting the dock and its functionality
 * - dock_projects_stack: Highlighting the Projects stack in dock (mobile only)
 * - desktop_icons: Highlighting desktop file/folder icons
 * - outro: Final "Have fun exploring" message
 * - complete: Tour finished, normal operation
 */
export type OnboardingStep =
	| "idle"
	| "window_controls"
	| "window_drag"
	| "dock"
	| "dock_projects_stack"
	| "desktop_icons"
	| "outro"
	| "complete";

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
	FAQ = "app.faq",
}

/**
 * Dock stack identifiers for grouped items (mobile only).
 * These are NOT apps - they represent collapsible folders in the dock.
 */
export enum DockStackID {
	Projects = "stack.projects",
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
	[AppID.FAQ]: { width: 800, height: 600 },
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
 * Apps that should fill the available viewport on mobile.
 * These windows will expand from system bar to dock on mobile devices.
 */
export const MOBILE_MAXIMIZED_APPS: Set<AppID> = new Set([
	AppID.About,
	AppID.Terminal,
	AppID.Contact,
	AppID.FAQ,
]);

/**
 * Apps that should be full-height and edge-to-edge on mobile.
 * These windows have NO padding - they snap directly to system bar and dock.
 * Used for productivity apps that need maximum screen real estate.
 */
export const FULL_HEIGHT_MOBILE_APPS: Set<AppID> = new Set([]);

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

/**
 * State slice for the onboarding store.
 * Manages the tour experience for first-time users on both desktop and mobile.
 */
export interface OnboardingState {
	/**
	 * Current step in the onboarding tour.
	 * Controls which UI element is highlighted.
	 */
	currentStep: OnboardingStep;

	/**
	 * Whether the user has completed the tour (persisted).
	 * Used to prevent showing the tour on repeat visits.
	 */
	hasCompletedTour: boolean;

	/**
	 * Whether user input is blocked during demo moments.
	 * True during animated demonstrations (ghost drag, etc.).
	 */
	isInteractionBlocked: boolean;

	/**
	 * The ordered list of steps for the current tour.
	 * Set based on device type (desktop vs mobile) when tour starts.
	 */
	stepOrder: OnboardingStep[];
}

/**
 * Actions available on the onboarding store.
 */
export interface OnboardingActions {
	/**
	 * Start the onboarding tour with a specific step order.
	 * Called after About app animation completes.
	 * No-op if tour already completed.
	 *
	 * @param stepOrder - Device-specific step sequence (desktop or mobile)
	 */
	startTour: (stepOrder: OnboardingStep[]) => void;

	/**
	 * Advance to the next step in the tour.
	 * Automatically transitions through the state machine.
	 */
	advanceStep: () => void;

	/**
	 * Skip directly to completion.
	 * Allows users to dismiss the tour early.
	 */
	skipTour: () => void;

	/**
	 * Set the interaction blocked state.
	 * Used during animated demonstrations.
	 */
	setInteractionBlocked: (blocked: boolean) => void;

	/**
	 * Reset the tour (for development/testing).
	 * Clears completion status and returns to idle.
	 */
	resetTour: () => void;
}

/**
 * Complete onboarding store type combining state and actions.
 */
export type OnboardingStore = OnboardingState & OnboardingActions;

/**
 * Ordered list of onboarding steps for desktop devices.
 * Excludes 'idle' as it's the pre-tour state.
 * Desktop includes window_drag step to demonstrate drag physics.
 */
export const DESKTOP_STEP_ORDER: OnboardingStep[] = [
	"window_controls",
	"window_drag",
	"dock",
	"desktop_icons",
	"outro",
	"complete",
];

/**
 * Ordered list of onboarding steps for mobile devices.
 * Excludes 'idle' as it's the pre-tour state.
 *
 * Mobile-specific differences:
 * - No window_drag step (touch devices don't have drag physics demo)
 * - Includes dock_projects_stack to teach the "Stack" concept (folders in dock)
 */
export const MOBILE_STEP_ORDER: OnboardingStep[] = [
	"window_controls",
	"dock",
	"dock_projects_stack",
	"desktop_icons",
	"outro",
	"complete",
];

/**
 * Legacy alias for backward compatibility.
 * @deprecated Use DESKTOP_STEP_ORDER or MOBILE_STEP_ORDER instead.
 */
export const ONBOARDING_STEP_ORDER = DESKTOP_STEP_ORDER;

// ============================================================================
// NOTIFICATION SYSTEM TYPES
// ============================================================================

/**
 * Unique identifiers for system notifications.
 * Each ID corresponds to a specific "delight moment" in the user journey.
 * Notifications with the same ID will only fire once per user lifetime.
 */
export enum NotificationID {
	// Boot & Session
	Welcome = "sys.welcome",
	WelcomeBack = "sys.welcome_back",

	// App Exploration
	FirstAppOpened = "sys.first_app",
	AllAppsExplored = "sys.all_apps",

	// Customization
	DockConfigChanged = "sys.dock_config",
	WallpaperChanged = "sys.wallpaper",

	// Terminal & Hacker
	TerminalOpened = "sys.terminal_open",
	HiddenFeature = "sys.hidden_feature",
	MatrixEnabled = "sys.matrix",

	// Idle State
	IdleMessage = "sys.idle",
}

/**
 * Content definition for a notification.
 */
export interface NotificationContent {
	/** Short headline for the notification */
	title: string;
	/** Optional longer description */
	message?: string;
}

/**
 * Registry mapping notification IDs to their content.
 * The "personality" of the system voice lives here.
 */
export const NOTIFICATION_REGISTRY: Record<NotificationID, NotificationContent> = {
	[NotificationID.Welcome]: {
		title: "Welcome to DinBuilds OS",
		message: "Explore the desktop. Click around.",
	},
	[NotificationID.WelcomeBack]: {
		title: "Welcome back",
		message: "Right where you left off.",
	},
	[NotificationID.FirstAppOpened]: {
		title: "You're in",
		message: "Explore. Everything is interactive.",
	},
	[NotificationID.AllAppsExplored]: {
		title: "Nice. You found them all.",
		message: "Curiosity noted.",
	},
	[NotificationID.DockConfigChanged]: {
		title: "Everything here is customizable",
		message: "Make it yours.",
	},
	[NotificationID.WallpaperChanged]: {
		title: "Visual preferences updated",
	},
	[NotificationID.TerminalOpened]: {
		title: "Command line active",
		message: "Type 'help' to see available commands.",
	},
	[NotificationID.HiddenFeature]: {
		title: "Hidden feature accessed",
		message: "You found something.",
	},
	[NotificationID.MatrixEnabled]: {
		title: "Visual protocol enabled",
		message: "Follow the white rabbit.",
	},
	[NotificationID.IdleMessage]: {
		title: "Take your time",
		message: "No rush. Explore at your own pace.",
	},
};

/**
 * Runtime representation of a notification in the queue.
 */
export interface NotificationInstance {
	/** Unique notification type */
	id: NotificationID;
	/** Content resolved from the registry */
	content: NotificationContent;
	/** Timestamp when added to queue */
	timestamp: number;
}

/**
 * Project app IDs for exploration tracking.
 * Used to trigger "You're in" and "Found them all" notifications.
 */
export const PROJECT_APP_IDS = [AppID.Yield, AppID.Debate, AppID.PassFX] as const;

/**
 * State slice for the notification store.
 */
export interface NotificationState {
	/**
	 * Queue of pending notifications.
	 * Processed one at a time with a delay buffer.
	 */
	queue: NotificationInstance[];

	/**
	 * Currently visible notification.
	 * null when no notification is being displayed.
	 */
	current: NotificationInstance | null;

	/**
	 * Set of notification IDs that have been shown.
	 * Persisted to localStorage to prevent repeat notifications.
	 */
	seenIds: Set<NotificationID>;

	/**
	 * Whether the queue is actively being processed.
	 * Used to prevent concurrent processing.
	 */
	isProcessing: boolean;

	/**
	 * Set of project app IDs opened this session.
	 * Used to track exploration progress for "You're in" and "Found them all".
	 * NOT persisted - resets on page refresh.
	 */
	openedProjectApps: Set<AppID>;
}

/**
 * Actions available on the notification store.
 */
export interface NotificationActions {
	/**
	 * Queue a notification for display.
	 * No-op if the notification has already been seen.
	 *
	 * @param id - The notification identifier
	 */
	addNotification: (id: NotificationID) => void;

	/**
	 * Dismiss the currently visible notification.
	 * Triggers processing of the next queued item.
	 */
	dismissCurrent: () => void;

	/**
	 * Mark a notification as seen without displaying it.
	 * Useful for programmatic completion tracking.
	 *
	 * @param id - The notification identifier
	 */
	markAsSeen: (id: NotificationID) => void;

	/**
	 * Check if a notification has been seen.
	 *
	 * @param id - The notification identifier
	 * @returns true if the notification has been shown before
	 */
	hasSeen: (id: NotificationID) => boolean;

	/**
	 * Process the next notification in the queue.
	 * Called internally after dismiss or delay.
	 */
	processQueue: () => void;

	/**
	 * Track a project app being opened.
	 * Triggers FirstAppOpened on first project app, AllAppsExplored when all 3 opened.
	 *
	 * @param appId - The app ID being opened
	 */
	trackProjectAppOpen: (appId: AppID) => void;

	/**
	 * Reset all seen notifications (for development/testing).
	 */
	resetSeen: () => void;
}

/**
 * Complete notification store type combining state and actions.
 */
export type NotificationStore = NotificationState & NotificationActions;

/**
 * Delay in milliseconds between consecutive notifications.
 * Prevents notification spam by adding a buffer.
 */
export const NOTIFICATION_QUEUE_DELAY = 800;

/**
 * Duration in milliseconds before auto-dismissing a notification.
 * User can dismiss earlier via interaction.
 */
export const NOTIFICATION_AUTO_DISMISS = 5500;
