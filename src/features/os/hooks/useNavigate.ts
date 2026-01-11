"use client";

/**
 * Navigation Hook — SEO-02 Story 2
 *
 * Provides programmatic navigation for opening windows.
 * Used by DockIcon, DesktopIcon, and FolderApp for consistent navigation.
 *
 * Key behavior:
 * - Delegates to launchApp() for window state management
 * - No runtime URL manipulation (URLs are set server-side on direct access)
 * - Supports prefetching for faster direct URL navigation
 */

import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { getCanonicalPath } from "@/lib/seo/path-routing";
import { type AppID, useSystemStore, type WindowProps } from "@/os/store";
import type { LaunchMethod } from "@/os/store/types";

export interface NavigateOptions {
	/** Window props to pass to the app */
	props?: WindowProps;
	/** How the navigation was triggered (for analytics) */
	launchMethod?: LaunchMethod;
}

export interface UseNavigateReturn {
	/**
	 * Open an app window.
	 * @param appId - The app to open
	 * @param options - Navigation options
	 */
	navigate: (appId: AppID, options?: NavigateOptions) => void;

	/**
	 * Prefetch a route for faster direct URL navigation.
	 * @param appId - The app to prefetch
	 * @param props - Optional props to determine the canonical path
	 */
	prefetch: (appId: AppID, props?: WindowProps) => void;

	/**
	 * Get the canonical path for an app (useful for href attributes).
	 * @param appId - The app ID
	 * @param props - Optional props for file-based apps
	 */
	getPath: (appId: AppID, props?: WindowProps) => string;
}

/**
 * Hook for programmatic window navigation.
 *
 * @returns Navigation utilities
 *
 * @example
 * ```tsx
 * const { navigate, prefetch, getPath } = useNavigate();
 *
 * // Prefetch on hover
 * onMouseEnter={() => prefetch(AppID.Yield)}
 *
 * // Navigate on click
 * onClick={() => navigate(AppID.Yield, { launchMethod: 'dock' })}
 *
 * // Get path for href (Story 4: crawl graph)
 * href={getPath(AppID.Yield)}
 * ```
 */
export function useNavigate(): UseNavigateReturn {
	const router = useRouter();
	const launchApp = useSystemStore((s) => s.launchApp);

	const navigate = useCallback(
		(appId: AppID, options?: NavigateOptions) => {
			const { props, launchMethod = "system" } = options ?? {};

			// Launch the app in window manager - no URL manipulation
			// URLs are handled server-side when users access routes directly
			launchApp(appId, { props, launchMethod });
		},
		[launchApp],
	);

	const prefetch = useCallback(
		(appId: AppID, props?: WindowProps) => {
			// Prefetch for faster direct URL navigation
			const path = getCanonicalPath(appId, props);
			router.prefetch(path);
		},
		[router],
	);

	const getPath = useCallback((appId: AppID, props?: WindowProps) => {
		return getCanonicalPath(appId, props);
	}, []);

	return {
		navigate,
		prefetch,
		getPath,
	};
}
