/**
 * OS Store Module
 *
 * Central export for all system state management.
 * Import from '@/os/store' for clean access.
 */

// Notification Store
export {
	selectCurrentNotification,
	selectHasNotification,
	selectOpenedProjectApps,
	selectQueueLength,
	selectSeenIds,
	useNotificationHasHydrated,
	useNotificationStore,
} from "./notification-store";

// Onboarding Store
export {
	selectCurrentStep,
	selectHasCompletedTour,
	selectIsInteractionBlocked,
	selectIsOnboarding,
	selectIsOnboardingStep,
	useOnboardingHasHydrated,
	useOnboardingStore,
} from "./onboarding-store";
// Hydration
export { StoreHydrator, type StoreHydratorProps } from "./StoreHydrator";
// System Store
export {
	selectActiveWindowId,
	selectBootPhase,
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
	type BootPhase,
	DEFAULT_DOCK_CONFIG,
	DEFAULT_WINDOW_SIZES,
	DESKTOP_STEP_ORDER,
	DOCK_SIZE_MAP,
	type DockConfig,
	type DockPosition,
	type DockSize,
	DockStackID,
	FULL_HEIGHT_MOBILE_APPS,
	MAXIMIZED_APPS,
	MOBILE_MAXIMIZED_APPS,
	MOBILE_STEP_ORDER,
	NOTIFICATION_AUTO_DISMISS,
	NOTIFICATION_QUEUE_DELAY,
	NOTIFICATION_REGISTRY,
	type NotificationActions,
	type NotificationContent,
	NotificationID,
	type NotificationInstance,
	type NotificationState,
	type NotificationStore,
	ONBOARDING_STEP_ORDER,
	type OnboardingActions,
	type OnboardingState,
	type OnboardingStep,
	type OnboardingStore,
	PROJECT_APP_IDS,
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
