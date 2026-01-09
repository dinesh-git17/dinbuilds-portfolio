"use client";

import { AnimatePresence } from "framer-motion";
import { memo } from "react";
import { useShallow } from "zustand/react/shallow";

import { useSystemStore } from "@/os/store";
import { getAppManifest } from "./app-registry";
import { useReducedMotion } from "./useReducedMotion";
import { WindowFrame } from "./WindowFrame";

/**
 * WindowManager — Renders all visible windows from the store.
 *
 * This component:
 * - Subscribes only to visible windows (not minimized)
 * - Uses AnimatePresence for smooth enter/exit transitions
 * - Respects reduced motion preferences
 *
 * Uses granular selector to prevent
 * re-renders from unrelated state changes (e.g., Clock).
 *
 * Note: useShallow is required because the selector returns a derived
 * array via .filter(), which would create new references on each call.
 */
export const WindowManager = memo(function WindowManager() {
	const visibleWindows = useSystemStore(
		useShallow((state) => state.windows.filter((w) => w.status === "open")),
	);
	const reducedMotion = useReducedMotion();

	return (
		<AnimatePresence mode="popLayout">
			{visibleWindows.map((window) => {
				const manifest = getAppManifest(window.id);
				const AppComponent = manifest.component;
				const displayTitle = window.props?.title ?? manifest.name;

				return (
					<WindowFrame
						key={window.id}
						window={window}
						title={displayTitle}
						reducedMotion={reducedMotion}
					>
						<AppComponent windowProps={window.props} />
					</WindowFrame>
				);
			})}
		</AnimatePresence>
	);
});
