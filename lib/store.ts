import { create } from "zustand";

/**
 * Spatial OS Global State Store
 *
 * This store will manage:
 * - Window states (position, size, z-index, minimized/maximized)
 * - Active window focus
 * - Desktop state
 */

interface SpatialState {
	// Placeholder for future window state
	initialized: boolean;
	setInitialized: (value: boolean) => void;
}

export const useSpatialStore = create<SpatialState>((set) => ({
	initialized: false,
	setInitialized: (value) => set({ initialized: value }),
}));
