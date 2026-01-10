import * as React from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { NotificationID, NotificationStore } from "./types";
import {
	type AppID,
	NotificationID as NID,
	NOTIFICATION_QUEUE_DELAY,
	NOTIFICATION_REGISTRY,
	PROJECT_APP_IDS,
} from "./types";

/**
 * localStorage key for notification persistence.
 * Only persists seen notification IDs to prevent repeat notifications.
 */
const NOTIFICATION_STORAGE_KEY = "sys_notifications_log";

/**
 * State keys that should persist across sessions.
 * We serialize the Set as an array for localStorage compatibility.
 */
interface PersistedNotificationState {
	seenIds: NotificationID[];
}

/**
 * Timer reference for queue processing delay.
 * Stored outside the store to prevent serialization issues.
 */
let queueTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Notification Store — System Voice Engine
 *
 * Manages the reactive notification system that acts as the OS's
 * internal monologue. Handles queuing (prevents spam), persistence
 * (notifications fire once per user lifetime), and processing delays.
 *
 * Key behaviors:
 * - Notifications with the same ID only fire once per user lifetime
 * - Multiple simultaneous events are queued and displayed sequentially
 * - A delay buffer prevents notification spam
 *
 * Usage:
 * ```
 * const addNotification = useNotificationStore(s => s.addNotification);
 * addNotification(NotificationID.Welcome);
 * ```
 */
export const useNotificationStore = create<NotificationStore>()(
	persist(
		(set, get) => ({
			// Initial State
			queue: [],
			current: null,
			seenIds: new Set<NotificationID>(),
			isProcessing: false,
			openedProjectApps: new Set<AppID>(),

			// Actions
			addNotification: (id: NotificationID) => {
				const { seenIds, queue, current } = get();

				// Skip if already seen
				if (seenIds.has(id)) {
					return;
				}

				// Skip if already in queue
				if (queue.some((n) => n.id === id)) {
					return;
				}

				// Skip if currently showing this notification
				if (current?.id === id) {
					return;
				}

				// Get content from registry
				const content = NOTIFICATION_REGISTRY[id];
				if (!content) {
					return;
				}

				// Create notification instance
				const instance = {
					id,
					content,
					timestamp: Date.now(),
				};

				// Add to queue and mark as seen
				const newSeenIds = new Set(seenIds);
				newSeenIds.add(id);

				set({
					queue: [...queue, instance],
					seenIds: newSeenIds,
				});

				// Start processing if not already
				get().processQueue();
			},

			dismissCurrent: () => {
				const { current } = get();

				if (!current) {
					return;
				}

				set({ current: null });

				// Process next with delay
				if (queueTimer) {
					clearTimeout(queueTimer);
				}

				queueTimer = setTimeout(() => {
					get().processQueue();
				}, NOTIFICATION_QUEUE_DELAY);
			},

			markAsSeen: (id: NotificationID) => {
				const { seenIds } = get();

				if (seenIds.has(id)) {
					return;
				}

				const newSeenIds = new Set(seenIds);
				newSeenIds.add(id);
				set({ seenIds: newSeenIds });
			},

			hasSeen: (id: NotificationID) => {
				return get().seenIds.has(id);
			},

			processQueue: () => {
				const { queue, current, isProcessing } = get();

				// Skip if already showing a notification or processing
				if (current || isProcessing) {
					return;
				}

				// Nothing to process
				if (queue.length === 0) {
					return;
				}

				// Mark as processing to prevent race conditions
				set({ isProcessing: true });

				// Take the first notification from the queue
				const [next, ...remaining] = queue;

				if (next) {
					set({
						current: next,
						queue: remaining,
						isProcessing: false,
					});
				} else {
					set({ isProcessing: false });
				}
			},

			trackProjectAppOpen: (appId: AppID) => {
				// Only track project apps
				if (!PROJECT_APP_IDS.includes(appId as (typeof PROJECT_APP_IDS)[number])) {
					return;
				}

				const { openedProjectApps, addNotification } = get();

				// Skip if already tracked this session
				if (openedProjectApps.has(appId)) {
					return;
				}

				// Add to tracked set
				const newOpenedApps = new Set(openedProjectApps);
				newOpenedApps.add(appId);
				set({ openedProjectApps: newOpenedApps });

				// Check if this is the first project app opened this session
				if (openedProjectApps.size === 0) {
					addNotification(NID.FirstAppOpened);
				}

				// Check if all project apps have been opened
				if (newOpenedApps.size === PROJECT_APP_IDS.length) {
					addNotification(NID.AllAppsExplored);
				}
			},

			resetSeen: () => {
				// Clear timer if running
				if (queueTimer) {
					clearTimeout(queueTimer);
					queueTimer = null;
				}

				set({
					queue: [],
					current: null,
					seenIds: new Set<NotificationID>(),
					isProcessing: false,
					openedProjectApps: new Set<AppID>(),
				});
			},
		}),
		{
			name: NOTIFICATION_STORAGE_KEY,
			partialize: (state): PersistedNotificationState => ({
				// Convert Set to array for JSON serialization
				seenIds: Array.from(state.seenIds),
			}),
			merge: (persisted, current) => {
				// Safely merge persisted state, converting array back to Set
				const persistedState = persisted as PersistedNotificationState | undefined;
				const seenIdsArray = persistedState?.seenIds ?? [];

				return {
					...current,
					seenIds: new Set(seenIdsArray as NotificationID[]),
				};
			},
		},
	),
);

/**
 * Hook to check if notification store has hydrated from localStorage.
 * Use this to prevent hydration mismatches when checking seen status.
 */
export function useNotificationHasHydrated(): boolean {
	const [hasHydrated, setHasHydrated] = React.useState(false);

	React.useEffect(() => {
		setHasHydrated(true);
	}, []);

	return hasHydrated;
}

/**
 * Selector helpers for common patterns.
 * Use these to avoid unnecessary re-renders.
 */
export const selectCurrentNotification = (state: NotificationStore) => state.current;
export const selectHasNotification = (state: NotificationStore) => state.current !== null;
export const selectQueueLength = (state: NotificationStore) => state.queue.length;
export const selectSeenIds = (state: NotificationStore) => state.seenIds;
export const selectOpenedProjectApps = (state: NotificationStore) => state.openedProjectApps;
