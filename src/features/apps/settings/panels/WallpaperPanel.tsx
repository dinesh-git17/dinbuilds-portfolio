"use client";

import clsx from "clsx";
import Image from "next/image";
import { memo, useCallback } from "react";

import { selectWallpaper, useSystemStore } from "@/os/store";

/**
 * Available wallpaper configuration.
 */
interface WallpaperOption {
	/** Unique identifier */
	id: string;
	/** Display name */
	name: string;
	/** Path to the wallpaper image */
	path: string;
}

/**
 * Predefined wallpapers from /public/assets/wallpapers/.
 */
const WALLPAPERS: WallpaperOption[] = [
	{ id: "wall-1", name: "Monterey Dark", path: "/assets/wallpapers/wall-1.jpg" },
	{ id: "wall-2", name: "Sonoma", path: "/assets/wallpapers/wall-2.jpg" },
	{ id: "wall-3", name: "Late Night Coding", path: "/assets/wallpapers/wall-3.jpg" },
	{ id: "wall-4", name: "Fluid Blue", path: "/assets/wallpapers/wall-4.jpg" },
	{ id: "wall-5", name: "VS Code", path: "/assets/wallpapers/wall-5.jpg" },
	{ id: "wall-6", name: "Yosemite Sunrise", path: "/assets/wallpapers/wall-6.jpg" },
	{ id: "wall-7", name: "Do Something Great", path: "/assets/wallpapers/wall-7.jpg" },
	{ id: "wall-8", name: "Ventura Night", path: "/assets/wallpapers/wall-8.jpg" },
	{ id: "wall-9", name: "Dark Bloom", path: "/assets/wallpapers/wall-9.jpg" },
	{ id: "wall-10", name: "Blue Bloom", path: "/assets/wallpapers/wall-10.jpg" },
];

/**
 * Wallpaper Panel - Desktop background picker.
 *
 * Displays a grid of available wallpapers with:
 * - Aspect-video thumbnails
 * - Blue border selection state
 * - Click to apply wallpaper globally
 */
export const WallpaperPanel = memo(function WallpaperPanel() {
	const currentWallpaper = useSystemStore(selectWallpaper);
	const setWallpaper = useSystemStore((s) => s.setWallpaper);

	const handleSelect = useCallback(
		(path: string) => {
			// Toggle off if clicking the current wallpaper
			if (currentWallpaper === path) {
				setWallpaper(null);
			} else {
				setWallpaper(path);
			}
		},
		[currentWallpaper, setWallpaper],
	);

	return (
		<div className="flex flex-col gap-4">
			<header>
				<h2 className="text-sm font-medium text-white">Desktop Wallpaper</h2>
				<p className="mt-1 text-xs text-white/50">Choose a background for your desktop</p>
			</header>

			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
				{WALLPAPERS.map((wallpaper) => {
					const isSelected = currentWallpaper === wallpaper.path;

					return (
						<button
							key={wallpaper.id}
							type="button"
							onClick={() => handleSelect(wallpaper.path)}
							className={clsx(
								"group relative aspect-video overflow-hidden rounded-lg transition-all",
								"ring-2 ring-offset-2 ring-offset-black/50",
								"focus-visible:outline-none focus-visible:ring-blue-500",
								isSelected ? "ring-blue-500 ring-offset-1" : "ring-transparent hover:ring-white/30",
							)}
							aria-pressed={isSelected}
							aria-label={`${wallpaper.name}${isSelected ? " (selected)" : ""}`}
						>
							<Image
								src={wallpaper.path}
								alt={wallpaper.name}
								fill
								sizes="(max-width: 640px) 50vw, 33vw"
								className="object-cover transition-transform group-hover:scale-105"
							/>
							{/* Hover overlay with name */}
							<div
								className={clsx(
									"absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent p-2",
									"opacity-0 transition-opacity group-hover:opacity-100",
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
