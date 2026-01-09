"use client";

/**
 * Store Hydrator — SEO-01 Phase 0
 *
 * Client component that hydrates the Zustand store with URL-derived state.
 * Uses a ref-based approach to hydrate before React's first render cycle,
 * ensuring SSR content matches client-side state.
 *
 * @see https://docs.pmnd.rs/zustand/integrations/persisting-store-data#hydration
 */

import { useRef } from "react";
import type { HydrationState } from "@/lib/seo";
import { useSystemStore } from "./system-store";

export interface StoreHydratorProps {
	/**
	 * Initial state derived from URL search params.
	 * Passed from the server component.
	 */
	initialState: HydrationState | null;
	children: React.ReactNode;
}

/**
 * Hydrates the system store with URL-derived initial state.
 *
 * This component uses a ref to track hydration status, ensuring
 * the store is only hydrated once even in React's StrictMode.
 * Hydration happens synchronously during the first render to
 * prevent flash of incorrect state.
 *
 * @example
 * ```tsx
 * // In page.tsx (Server Component)
 * const state = parseURLToState(searchParams);
 * return (
 *   <StoreHydrator initialState={state}>
 *     <Stage />
 *   </StoreHydrator>
 * );
 * ```
 */
export function StoreHydrator({ initialState, children }: StoreHydratorProps) {
	const isHydrated = useRef(false);

	// Hydrate synchronously during first render (before effects)
	// This ensures the store has the correct state before any component reads it
	if (!isHydrated.current && initialState) {
		// Only hydrate window state if we have windows to show
		// This preserves persisted preferences (wallpaper, dock config)
		if (initialState.windows.length > 0) {
			useSystemStore.setState({
				windows: initialState.windows,
				activeWindowId: initialState.activeWindowId,
				fullscreenWindowId: initialState.fullscreenWindowId,
			});
		}
		isHydrated.current = true;
	}

	return <>{children}</>;
}
