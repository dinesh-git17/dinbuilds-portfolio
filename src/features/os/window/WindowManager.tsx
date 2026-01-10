"use client";

import { AnimatePresence } from "framer-motion";
import { memo, Suspense } from "react";
import { useShallow } from "zustand/react/shallow";

import type { OnboardingHighlights } from "@/os/onboarding";
import { selectActiveWindowId, useSystemStore } from "@/os/store";

import { getAppManifest } from "./app-registry";
import { useReducedMotion } from "./useReducedMotion";
import { WindowFrame } from "./WindowFrame";

/**
 * Loading fallback for lazy-loaded app components.
 * Displays a subtle skeleton that matches the OS visual language.
 */
function AppLoadingFallback() {
	return (
		<div className="flex h-full min-h-[200px] w-full items-center justify-center">
			<div className="flex flex-col items-center gap-3">
				<div className="h-8 w-8 animate-pulse rounded-lg bg-white/10" />
				<div className="h-2 w-16 animate-pulse rounded-full bg-white/5" />
			</div>
		</div>
	);
}

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
						<Suspense fallback={<AppLoadingFallback />}>
							<AppComponent windowProps={window.props} />
						</Suspense>
					</WindowFrame>
				);
			})}
		</AnimatePresence>
	);
});
