import { create } from "zustand";

import type {
	AppID,
	SystemStore,
	WindowInstance,
	WindowPosition,
	WindowSize,
	WindowSpawnConfig,
} from "./types";
import { DEFAULT_WINDOW_SIZES } from "./types";

/**
 * Calculate initial window position with cascade offset.
 * Each new window is offset slightly from the previous.
 */
function calculateInitialPosition(windowCount: number): WindowPosition {
	const baseX = 100;
	const baseY = 80;
	const cascadeOffset = 30;

	return {
		x: baseX + (windowCount % 8) * cascadeOffset,
		y: baseY + (windowCount % 8) * cascadeOffset,
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
export const useSystemStore = create<SystemStore>((set, get) => ({
	// Initial State
	windows: [],
	activeWindowId: null,

	// Actions
	launchApp: (appId: AppID, config?: WindowSpawnConfig) => {
		const { windows } = get();
		const existingIndex = windows.findIndex((w) => w.id === appId);

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
			});
		} else {
			// Create new window instance
			const defaultSize = DEFAULT_WINDOW_SIZES[appId];
			const newWindow: WindowInstance = {
				id: appId,
				status: "open",
				position: config?.position ?? calculateInitialPosition(windows.length),
				size: config?.size ?? defaultSize,
			};

			set({
				windows: [...windows, newWindow],
				activeWindowId: appId,
			});
		}
	},

	closeWindow: (id: AppID) => {
		const { windows, activeWindowId } = get();
		const filteredWindows = windows.filter((w) => w.id !== id);

		// If closing the active window, transfer focus
		const newActiveId =
			activeWindowId === id ? findNextFocusTarget(filteredWindows) : activeWindowId;

		set({
			windows: filteredWindows,
			activeWindowId: newActiveId,
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
		const { windows, activeWindowId } = get();
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

		set({
			windows: updatedWindows,
			activeWindowId: newActiveId,
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
}));

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
export const selectIsWindowActive = (id: AppID) => (state: SystemStore) =>
	state.activeWindowId === id;
export const selectWindowById = (id: AppID) => (state: SystemStore) =>
	state.windows.find((w) => w.id === id);
