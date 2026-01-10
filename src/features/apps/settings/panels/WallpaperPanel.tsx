"use client";

import clsx from "clsx";
import Image from "next/image";
import { memo, useCallback } from "react";

import { useDeviceType } from "@/os/desktop/dock/useDeviceType";
import { MOBILE_WALLPAPERS, WALLPAPERS, type WallpaperConfig } from "@/os/desktop/wallpapers";
import { NotificationID, selectWallpaper, useNotificationStore, useSystemStore } from "@/os/store";

export interface WallpaperPanelProps {
	/** Optional className for container styling */
	className?: string;
}

/**
 * Wallpaper Panel - Device-adaptive background picker.
 *
 * Displays a grid of available wallpapers based on device type:
 * - Desktop: Landscape wallpapers with aspect-video thumbnails
 * - Mobile: Portrait wallpapers with aspect-[9/16] thumbnails
 *
 * Features:
 * - Blue border selection state with checkmark
 * - Click/tap to apply wallpaper globally
 * - Minimum 44px touch targets for accessibility
 */
export const WallpaperPanel = memo(function WallpaperPanel({ className }: WallpaperPanelProps) {
	const deviceType = useDeviceType();
	const currentWallpaper = useSystemStore(selectWallpaper);
	const setWallpaper = useSystemStore((s) => s.setWallpaper);
	const addNotification = useNotificationStore((s) => s.addNotification);

	const isMobile = deviceType === "mobile";
	const wallpapers: WallpaperConfig[] = isMobile ? MOBILE_WALLPAPERS : WALLPAPERS;

	const handleSelect = useCallback(
		(path: string) => {
			setWallpaper(path);
			addNotification(NotificationID.WallpaperChanged);
		},
		[setWallpaper, addNotification],
	);

	return (
		<div className={clsx("flex flex-col gap-4", className)}>
			<header>
				<h2 className="text-sm font-medium text-white">
					{isMobile ? "Mobile Wallpaper" : "Desktop Wallpaper"}
				</h2>
				<p className="mt-1 text-xs text-white/50">
					{isMobile
						? "Choose a portrait background for your device"
						: "Choose a background for your desktop"}
				</p>
			</header>

			<div className={clsx("grid gap-3", isMobile ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-3")}>
				{wallpapers.map((wallpaper) => {
					const isSelected = currentWallpaper === wallpaper.path;

					return (
						<button
							key={wallpaper.id}
							type="button"
							onClick={() => handleSelect(wallpaper.path)}
							className={clsx(
								"group relative overflow-hidden rounded-lg transition-all",
								"ring-2 ring-offset-2 ring-offset-black/50",
								"focus-visible:outline-none focus-visible:ring-blue-500",
								"min-h-[44px] min-w-[44px]",
								isMobile ? "aspect-[9/16]" : "aspect-video",
								isSelected ? "ring-blue-500 ring-offset-1" : "ring-transparent hover:ring-white/30",
							)}
							aria-pressed={isSelected}
							aria-label={`${wallpaper.name}${isSelected ? " (selected)" : ""}`}
						>
							<Image
								src={wallpaper.path}
								alt={wallpaper.name}
								fill
								sizes={isMobile ? "33vw" : "(max-width: 640px) 50vw, 33vw"}
								className="object-cover transition-transform group-hover:scale-105"
								placeholder="blur"
								blurDataURL={wallpaper.blurDataURL}
							/>
							{/* Hover/tap overlay with name */}
							<div
								className={clsx(
									"absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent p-2",
									"opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100",
									isSelected && "opacity-100",
								)}
							>
								<span className="text-xs font-medium text-white">{wallpaper.name}</span>
							</div>
							{/* Selection checkmark */}
							{isSelected && (
								<div className="absolute top-2 right-2 flex size-5 items-center justify-center rounded-full bg-blue-500">
									<svg
										className="size-3 text-white"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										strokeWidth={3}
										aria-hidden="true"
									>
										<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
									</svg>
								</div>
							)}
						</button>
					);
				})}
			</div>
		</div>
	);
});
