"use client";

import { AnimatePresence } from "framer-motion";
import { memo, useCallback, useEffect, useRef } from "react";

import { useDeviceType } from "@/os/desktop/dock/useDeviceType";
import {
	NOTIFICATION_AUTO_DISMISS,
	selectCurrentNotification,
	useNotificationStore,
} from "@/os/store";

import { NotificationPill } from "./NotificationPill";

/**
 * Z-index for the notification layer.
 * Should be above fullscreen windows (100) but below critical modals.
 */
const NOTIFICATION_Z_INDEX = 150;

/**
 * NotificationLayer — Container for System Notifications
 *
 * Renders the current notification from the store with proper positioning:
 * - Desktop: Top-right corner with 24px margin
 * - Mobile: Top-center with Dynamic Island style positioning
 *
 * Handles:
 * - Auto-dismiss after NOTIFICATION_AUTO_DISMISS (5.5s)
 * - Timer reset on new notifications
 * - Proper cleanup on unmount
 *
 * Should be rendered once at the top level of the Stage component.
 */
export const NotificationLayer = memo(function NotificationLayer() {
	const deviceType = useDeviceType();
	const isMobile = deviceType === "mobile";

	const currentNotification = useNotificationStore(selectCurrentNotification);
	const dismissCurrent = useNotificationStore((s) => s.dismissCurrent);

	// Timer ref for auto-dismiss
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Clear timer helper
	const clearTimer = useCallback(() => {
		if (timerRef.current) {
			clearTimeout(timerRef.current);
			timerRef.current = null;
		}
	}, []);

	// Handle dismiss (from user interaction or timer)
	const handleDismiss = useCallback(() => {
		clearTimer();
		dismissCurrent();
	}, [clearTimer, dismissCurrent]);

	// Set up auto-dismiss timer when a notification appears
	useEffect(() => {
		if (currentNotification) {
			// Clear any existing timer
			clearTimer();

			// Start new auto-dismiss timer
			timerRef.current = setTimeout(() => {
				dismissCurrent();
			}, NOTIFICATION_AUTO_DISMISS);
		}

		// Cleanup on unmount or when notification changes
		return clearTimer;
	}, [currentNotification, dismissCurrent, clearTimer]);

	// Desktop: Below SystemBar (h-9 = 36px) with padding, right-aligned
	// Mobile: Below SystemBar, top-center
	return (
		<section
			className={`
				pointer-events-none fixed
				${isMobile ? "top-12 left-0 right-0 flex justify-center" : "top-14 right-6"}
			`}
			style={{ zIndex: NOTIFICATION_Z_INDEX }}
			aria-label="System notifications"
		>
			<AnimatePresence mode="wait">
				{currentNotification && (
					<div className="pointer-events-auto">
						<NotificationPill
							key={currentNotification.id}
							notification={currentNotification}
							onDismiss={handleDismiss}
							isMobile={isMobile}
						/>
					</div>
				)}
			</AnimatePresence>
		</section>
	);
});
