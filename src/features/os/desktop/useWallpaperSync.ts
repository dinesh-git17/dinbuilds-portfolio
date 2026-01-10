"use client";

import { useEffect, useRef } from "react";

import { selectWallpaper, useSystemStore } from "@/os/store";

import type { DeviceType } from "./dock/useDeviceType";
import { useDeviceType } from "./dock/useDeviceType";
import {
	DEFAULT_MOBILE_WALLPAPER_PATH,
	DEFAULT_WALLPAPER_PATH,
	isDesktopWallpaper,
	isMobileWallpaper,
} from "./wallpapers";

/**
 * Determine the appropriate wallpaper for the given device type.
 * Returns null if current wallpaper is valid, otherwise returns the fallback path.
 */
function getWallpaperFallback(
	currentWallpaper: string | null,
	deviceType: DeviceType,
): string | null {
	const isMobile = deviceType === "mobile";
	const defaultPath = isMobile ? DEFAULT_MOBILE_WALLPAPER_PATH : DEFAULT_WALLPAPER_PATH;

	// No wallpaper set → use device-appropriate default
	if (!currentWallpaper) {
		return defaultPath;
	}

	const wallpaperIsMobile = isMobileWallpaper(currentWallpaper);
	const wallpaperIsDesktop = isDesktopWallpaper(currentWallpaper);

	// Mobile device with desktop wallpaper → swap to mobile default
	if (isMobile && wallpaperIsDesktop) {
		return DEFAULT_MOBILE_WALLPAPER_PATH;
	}

	// Desktop device with mobile wallpaper → swap to desktop default
	if (!isMobile && wallpaperIsMobile) {
		return DEFAULT_WALLPAPER_PATH;
	}

	// Wallpaper is valid for current device type
	return null;
}

/**
 * Hook to synchronize wallpaper state with device type.
 *
 * Ensures mobile users see portrait-optimized wallpapers and desktop users
 * see landscape-optimized wallpapers. Handles three scenarios:
 *
 * 1. **Boot Check:** On initial mount, validates persisted wallpaper against
 *    device type and swaps to appropriate default if mismatched.
 *
 * 2. **Asset Validation:** If a mobile user has a desktop wallpaper persisted
 *    (or vice versa), automatically falls back to the device-appropriate default.
 *
 * 3. **Resize Handling:** When viewport crosses the mobile breakpoint,
 *    swaps wallpaper to prevent distortion.
 *
 * @returns The current device type for use in rendering decisions
 */
export function useWallpaperSync() {
	const deviceType = useDeviceType();
	const wallpaper = useSystemStore(selectWallpaper);
	const setWallpaper = useSystemStore((s) => s.setWallpaper);
	const hasInitializedRef = useRef(false);
	const previousDeviceTypeRef = useRef(deviceType);

	useEffect(() => {
		// Skip SSR
		if (typeof window === "undefined") return;

		const shouldUpdate = !hasInitializedRef.current || previousDeviceTypeRef.current !== deviceType;

		if (shouldUpdate) {
			hasInitializedRef.current = true;
			previousDeviceTypeRef.current = deviceType;

			const fallback = getWallpaperFallback(wallpaper, deviceType);
			if (fallback) {
				setWallpaper(fallback);
			}
		}
	}, [deviceType, wallpaper, setWallpaper]);

	return deviceType;
}
