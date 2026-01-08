"use client";

import { useEffect, useState } from "react";

export type DeviceType = "desktop" | "mobile";

const MOBILE_BREAKPOINT = 768;

/**
 * Hook to detect device type based on viewport width.
 * Returns 'desktop' or 'mobile' for conditional rendering.
 *
 * Defaults to 'desktop' during SSR to prevent hydration mismatch,
 * then updates on client mount.
 */
export function useDeviceType(): DeviceType {
	const [deviceType, setDeviceType] = useState<DeviceType>("desktop");

	useEffect(() => {
		const checkDevice = () => {
			setDeviceType(window.innerWidth < MOBILE_BREAKPOINT ? "mobile" : "desktop");
		};

		// Initial check
		checkDevice();

		// Listen for resize
		window.addEventListener("resize", checkDevice);
		return () => window.removeEventListener("resize", checkDevice);
	}, []);

	return deviceType;
}
