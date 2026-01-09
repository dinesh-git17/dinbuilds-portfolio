import { create } from "zustand";
import { persist } from "zustand/middleware";

import type {
	AppID,
	SystemStore,
	WindowInstance,
	WindowPosition,
	WindowSize,
	WindowSpawnConfig,
} from "./types";
import { AUTO_FULLSCREEN_APPS, DEFAULT_WINDOW_SIZES, MAXIMIZED_APPS } from "./types";

/**
 * State keys that should persist across sessions.
 * Window state is ephemeral—only preferences survive.
 */
interface PersistedState {
	wallpaper: string | null;
}

/**
 * Default viewport assumption for SSR/initial render.
 * Used to calculate centered positions before client hydration.
 */
const DEFAULT_VIEWPORT = { width: 1440, height: 900 };

/**
 * Padding around maximized windows.
 */
const MAXIMIZED_PADDING = 32;

/**
 * Calculate maximized window size based on current viewport.
 * Fills the available space with padding on all sides.
 */
function calculateMaximizedSize(): WindowSize {
	const viewport =
		typeof window !== "undefined"
			? { width: window.innerWidth, height: window.innerHeight }
			: DEFAULT_VIEWPORT;

	const systemBarHeight = 32;
	const dockHeight = 80;

	return {
		width: viewport.width - MAXIMIZED_PADDING * 2,
		height: viewport.height - systemBarHeight - dockHeight - MAXIMIZED_PADDING,
	};
}

/**
 * Calculate centered window position with cascade offset.
 * Centers the window in the viewport, then applies a small offset
 * for each additional open window to create a cascade effect.
 */
function calculateCenteredPosition(windowSize: WindowSize, windowCount: number): WindowPosition {
	const cascadeOffset = 24;

	// Use actual viewport if available (client-side), otherwise use defaults
	const viewport =
		typeof window !== "undefined"
			? { width: window.innerWidth, height: window.innerHeight }
			: DEFAULT_VIEWPORT;

	// Account for system bar (top) and dock (bottom) when centering vertically
	const systemBarHeight = 32;
	const dockHeight = 80;
	const availableHeight = viewport.height - systemBarHeight - dockHeight;

	// Calculate center position
	const centerX = (viewport.width - windowSize.width) / 2;
	const centerY = systemBarHeight + (availableHeight - windowSize.height) / 2;

	// Apply cascade offset for multiple windows
	const offset = (windowCount % 6) * cascadeOffset;

	return {
		x: Math.max(16, centerX + offset),
		y: Math.max(systemBarHeight + 8, centerY + offset),
	};
}

/**
 * Find the next window to focus after closing/minimizing.
 * Returns the topmost visible window, or null if none exist.
 */
function findNextFocusTarget(windows: WindowInstance[], excludeId?: AppID): AppID | null {
	// Iterate from end (highest z-index) to find first visible window
	for (let i = windows.length - 1; i >= 0; i--) {
		const window = windows[i];
		if (window && window.status === "open" && window.id !== excludeId) {
			return window.id;
		}
	}
	return null;
}

/**
 * System Store — Window Manager State
 *
 * Manages the lifecycle of all windows in the Spatial OS.
 * Uses an ordered array where position = z-index (last = top).
 *
 * Usage with granular selectors:
 * ```
 * const windows = useSystemStore(s => s.windows);
 * const launchApp = useSystemStore(s => s.launchApp);
 * ```
 */
export const useSystemStore = create<SystemStore>()(
	persist(
		(set, get) => ({
			// Initial State
			windows: [],
			activeWindowId: null,
			fullscreenWindowId: null,
			wallpaper: null,

			// Actions
			launchApp: (appId: AppID, config?: WindowSpawnConfig) => {
				const { windows } = get();
				const existingIndex = windows.findIndex((w) => w.id === appId);
				const shouldAutoFullscreen = AUTO_FULLSCREEN_APPS.has(appId);

				if (existingIndex !== -1) {
					// Window exists - restore if minimized and bring to front
					const existingWindow = windows[existingIndex];
					if (!existingWindow) return;

					const updatedWindows = windows.filter((w) => w.id !== appId);
					updatedWindows.push({
						...existingWindow,
						status: "open",
					});

					set({
						windows: updatedWindows,
						activeWindowId: appId,
						// Auto-enter fullscreen for designated apps
						fullscreenWindowId: shouldAutoFullscreen ? appId : get().fullscreenWindowId,
					});
				} else {
					// Create new window instance
					// Use maximized size for designated apps, otherwise use defaults
					const isMaximized = MAXIMIZED_APPS.has(appId);
					const defaultSize = isMaximized ? calculateMaximizedSize() : DEFAULT_WINDOW_SIZES[appId];
					const windowSize = config?.size ?? defaultSize;

					// Maximized windows position at top-left with padding, others cascade
					const defaultPosition = isMaximized
						? { x: MAXIMIZED_PADDING, y: 32 + MAXIMIZED_PADDING / 2 }
						: calculateCenteredPosition(windowSize, windows.length);

					const newWindow: WindowInstance = {
						id: appId,
						status: "open",
						position: config?.position ?? defaultPosition,
						size: windowSize,
					};

					set({
						windows: [...windows, newWindow],
						activeWindowId: appId,
						// Auto-enter fullscreen for designated apps
						fullscreenWindowId: shouldAutoFullscreen ? appId : get().fullscreenWindowId,
					});
				}
			},

			closeWindow: (id: AppID) => {
				const { windows, activeWindowId, fullscreenWindowId } = get();
				const filteredWindows = windows.filter((w) => w.id !== id);

				// If closing the active window, transfer focus
				const newActiveId =
					activeWindowId === id ? findNextFocusTarget(filteredWindows) : activeWindowId;

				// Exit fullscreen if closing the fullscreen window
				const newFullscreenId = fullscreenWindowId === id ? null : fullscreenWindowId;

				set({
					windows: filteredWindows,
					activeWindowId: newActiveId,
					fullscreenWindowId: newFullscreenId,
				});
			},

			focusWindow: (id: AppID) => {
				const { windows, activeWindowId } = get();

				// Already focused and at top
				if (activeWindowId === id && windows[windows.length - 1]?.id === id) {
					return;
				}

				const windowIndex = windows.findIndex((w) => w.id === id);
				if (windowIndex === -1) return;

				const targetWindow = windows[windowIndex];
				if (!targetWindow) return;

				// Move to end of array (highest z-index)
				const reorderedWindows = windows.filter((w) => w.id !== id);
				reorderedWindows.push({
					...targetWindow,
					status: "open", // Restore if minimized
				});

				set({
					windows: reorderedWindows,
					activeWindowId: id,
				});
			},

			minimizeWindow: (id: AppID) => {
				const { windows, activeWindowId, fullscreenWindowId } = get();
				const windowIndex = windows.findIndex((w) => w.id === id);

				if (windowIndex === -1) return;

				const targetWindow = windows[windowIndex];
				if (!targetWindow) return;

				const updatedWindows = [...windows];
				updatedWindows[windowIndex] = {
					...targetWindow,
					status: "minimized",
				};

				// Transfer focus if minimizing active window
				const newActiveId =
					activeWindowId === id ? findNextFocusTarget(updatedWindows, id) : activeWindowId;

				// Exit fullscreen if minimizing the fullscreen window
				const newFullscreenId = fullscreenWindowId === id ? null : fullscreenWindowId;

				set({
					windows: updatedWindows,
					activeWindowId: newActiveId,
					fullscreenWindowId: newFullscreenId,
				});
			},

			updateWindowPosition: (id: AppID, position: WindowPosition) => {
				const { windows } = get();
				const windowIndex = windows.findIndex((w) => w.id === id);

				if (windowIndex === -1) return;

				const targetWindow = windows[windowIndex];
				if (!targetWindow) return;

				const updatedWindows = [...windows];
				updatedWindows[windowIndex] = {
					...targetWindow,
					position,
				};

				set({ windows: updatedWindows });
			},

			updateWindowSize: (id: AppID, size: WindowSize) => {
				const { windows } = get();
				const windowIndex = windows.findIndex((w) => w.id === id);

				if (windowIndex === -1) return;

				const targetWindow = windows[windowIndex];
				if (!targetWindow) return;

				const updatedWindows = [...windows];
				updatedWindows[windowIndex] = {
					...targetWindow,
					size,
				};

				set({ windows: updatedWindows });
			},

			toggleFullscreen: (id: AppID) => {
				const { fullscreenWindowId } = get();

				if (fullscreenWindowId === id) {
					// Exit fullscreen
					set({ fullscreenWindowId: null });
				} else {
					// Enter fullscreen (and focus the window)
					get().focusWindow(id);
					set({ fullscreenWindowId: id });
				}
			},

			exitFullscreen: () => {
				set({ fullscreenWindowId: null });
			},

			setWallpaper: (path: string | null) => {
				set({ wallpaper: path });
			},
		}),
		{
			name: "dinos-preferences",
			partialize: (state): PersistedState => ({
				wallpaper: state.wallpaper,
			}),
		},
	),
);

/**
 * Selector helpers for common patterns.
 * Use these to avoid unnecessary re-renders.
 *
 * IMPORTANT: Selectors that return primitive values can be used directly.
 * Selectors that derive arrays/objects (via .filter, .map, etc.) must be
 * wrapped with `useShallow` from 'zustand/react/shallow' to prevent
 * infinite re-render loops during SSR.
 */
export const selectWindows = (state: SystemStore) => state.windows;
export const selectActiveWindowId = (state: SystemStore) => state.activeWindowId;
export const selectFullscreenWindowId = (state: SystemStore) => state.fullscreenWindowId;
export const selectIsWindowActive = (id: AppID) => (state: SystemStore) =>
	state.activeWindowId === id;
export const selectIsWindowFullscreen = (id: AppID) => (state: SystemStore) =>
	state.fullscreenWindowId === id;
export const selectIsAnyWindowFullscreen = (state: SystemStore) =>
	state.fullscreenWindowId !== null;
export const selectWindowById = (id: AppID) => (state: SystemStore) =>
	state.windows.find((w) => w.id === id);
export const selectWallpaper = (state: SystemStore) => state.wallpaper;
