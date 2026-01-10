"use client";

import { AnimatePresence } from "framer-motion";
import { memo } from "react";
import { useShallow } from "zustand/react/shallow";

import type { OnboardingHighlights } from "@/os/onboarding";
import { selectActiveWindowId, useSystemStore } from "@/os/store";

import { getAppManifest } from "./app-registry";
import { useReducedMotion } from "./useReducedMotion";
import { WindowFrame } from "./WindowFrame";

export interface WindowManagerProps {
	/** Onboarding highlight states */
	onboardingHighlights?: OnboardingHighlights;
	/** Callback when ghost drag animation completes */
	onGhostDragComplete?: () => void;
}

/**
 * WindowManager — Renders all visible windows from the store.
 *
 * This component:
 * - Subscribes only to visible windows (not minimized)
 * - Uses AnimatePresence for smooth enter/exit transitions
 * - Respects reduced motion preferences
 * - Passes onboarding highlight states to the active window
 *
 * Uses granular selector to prevent
 * re-renders from unrelated state changes (e.g., Clock).
 *
 * Note: useShallow is required because the selector returns a derived
 * array via .filter(), which would create new references on each call.
 */
export const WindowManager = memo(function WindowManager({
	onboardingHighlights,
	onGhostDragComplete,
}: WindowManagerProps) {
	const visibleWindows = useSystemStore(
		useShallow((state) => state.windows.filter((w) => w.status === "open")),
	);
	const activeWindowId = useSystemStore(selectActiveWindowId);
	const reducedMotion = useReducedMotion();

	return (
		<AnimatePresence mode="popLayout">
			{visibleWindows.map((window) => {
				const manifest = getAppManifest(window.id);
				const AppComponent = manifest.component;
				const displayTitle = window.props?.title ?? manifest.name;

				// Only apply onboarding highlights to the active window
				const isActiveWindow = window.id === activeWindowId;
				const shouldHighlightControls = isActiveWindow && onboardingHighlights?.windowControls;
				const shouldHighlightHeader = isActiveWindow && onboardingHighlights?.windowHeader;
				const shouldGhostDrag = isActiveWindow && onboardingHighlights?.shouldGhostDrag;

				return (
					<WindowFrame
						key={window.id}
						window={window}
						title={displayTitle}
						reducedMotion={reducedMotion}
						isControlsHighlighted={shouldHighlightControls}
						isHeaderHighlighted={shouldHighlightHeader}
						shouldGhostDrag={shouldGhostDrag}
						onGhostDragComplete={isActiveWindow ? onGhostDragComplete : undefined}
					>
						<AppComponent windowProps={window.props} />
					</WindowFrame>
				);
			})}
		</AnimatePresence>
	);
});
