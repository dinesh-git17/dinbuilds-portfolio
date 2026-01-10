"use client";

import clsx from "clsx";
import { memo, useCallback, useId } from "react";

import { AnalyticsEvent, trackEvent } from "@/lib/analytics";
import {
	type DockPosition,
	type DockSize,
	NotificationID,
	selectDockConfig,
	useNotificationStore,
	useSystemStore,
} from "@/os/store";

/**
 * Position option with visual representation.
 */
interface PositionOption {
	id: DockPosition;
	label: string;
}

const POSITION_OPTIONS: PositionOption[] = [
	{ id: "left", label: "Left" },
	{ id: "bottom", label: "Bottom" },
	{ id: "right", label: "Right" },
];

/**
 * Size option configuration.
 */
interface SizeOption {
	id: DockSize;
	label: string;
}

const SIZE_OPTIONS: SizeOption[] = [
	{ id: "sm", label: "Small" },
	{ id: "md", label: "Medium" },
	{ id: "lg", label: "Large" },
];

/**
 * Mini display preview showing dock position.
 * Renders a small rectangle with the dock highlighted at the specified position.
 */
function DockPositionPreview({
	position,
	isSelected,
}: {
	position: DockPosition;
	isSelected: boolean;
}) {
	return (
		<div
			className={clsx(
				"relative h-12 w-16 rounded border transition-colors",
				isSelected ? "border-blue-500 bg-white/10" : "border-white/20 bg-white/5",
			)}
		>
			{/* Screen area */}
			<div className="absolute inset-1 rounded-sm bg-white/5" />

			{/* Dock indicator */}
			<div
				className={clsx(
					"absolute rounded-sm transition-colors",
					isSelected ? "bg-blue-500" : "bg-white/40",
					position === "bottom" && "bottom-1 left-1/2 h-1 w-6 -translate-x-1/2",
					position === "left" && "left-1 top-1/2 h-6 w-1 -translate-y-1/2",
					position === "right" && "right-1 top-1/2 h-6 w-1 -translate-y-1/2",
				)}
			/>
		</div>
	);
}

/**
 * Dock Panel - Dock customization settings.
 *
 * Provides controls for:
 * - Position: Visual radio buttons (Left/Bottom/Right)
 * - Size: Segmented control (Small/Medium/Large)
 * - Magnification: Toggle switch (On/Off)
 */
export const DockPanel = memo(function DockPanel() {
	const dockConfig = useSystemStore(selectDockConfig);
	const setDockConfig = useSystemStore((s) => s.setDockConfig);
	const addNotification = useNotificationStore((s) => s.addNotification);

	const positionGroupId = useId();
	const sizeGroupId = useId();
	const magnificationId = useId();

	const handlePositionChange = useCallback(
		(position: DockPosition) => {
			setDockConfig({ position });
			addNotification(NotificationID.DockConfigChanged);
			trackEvent(AnalyticsEvent.SETTINGS_CHANGED, {
				setting_category: "dock",
				setting_key: "position",
			});
		},
		[setDockConfig, addNotification],
	);

	const handleSizeChange = useCallback(
		(size: DockSize) => {
			setDockConfig({ size });
			addNotification(NotificationID.DockConfigChanged);
			trackEvent(AnalyticsEvent.SETTINGS_CHANGED, {
				setting_category: "dock",
				setting_key: "size",
			});
		},
		[setDockConfig, addNotification],
	);

	const handleMagnificationToggle = useCallback(() => {
		setDockConfig({ magnification: !dockConfig.magnification });
		addNotification(NotificationID.DockConfigChanged);
		trackEvent(AnalyticsEvent.SETTINGS_CHANGED, {
			setting_category: "dock",
			setting_key: "magnification",
		});
	}, [dockConfig.magnification, setDockConfig, addNotification]);

	return (
		<div className="flex flex-col gap-6">
			<header>
				<h2 className="text-sm font-medium text-white">Dock</h2>
				<p className="mt-1 text-xs text-white/50">Customize your dock appearance and behavior</p>
			</header>

			{/* Position Section */}
			<fieldset className="flex flex-col gap-4">
				<legend className="text-xs font-medium text-white/70">Position on screen</legend>
				<div className="flex gap-4">
					{POSITION_OPTIONS.map((option) => {
						const isSelected = dockConfig.position === option.id;
						const inputId = `${positionGroupId}-${option.id}`;

						return (
							<label
								key={option.id}
								htmlFor={inputId}
								className={clsx(
									"flex cursor-pointer flex-col items-center gap-2 rounded-lg p-3 transition-all",
									"has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-blue-500",
									isSelected ? "bg-white/10" : "hover:bg-white/5",
								)}
							>
								<input
									type="radio"
									id={inputId}
									name={positionGroupId}
									value={option.id}
									checked={isSelected}
									onChange={() => handlePositionChange(option.id)}
									className="sr-only"
								/>
								<DockPositionPreview position={option.id} isSelected={isSelected} />
								<span
									className={clsx(
										"text-xs transition-colors",
										isSelected ? "text-white" : "text-white/50",
									)}
								>
									{option.label}
								</span>
							</label>
						);
					})}
				</div>
			</fieldset>

			{/* Size Section */}
			<fieldset className="flex flex-col gap-4">
				<legend className="text-xs font-medium text-white/70">Size</legend>
				<div className="inline-flex w-fit rounded-lg bg-white/5 p-1">
					{SIZE_OPTIONS.map((option) => {
						const isSelected = dockConfig.size === option.id;
						const inputId = `${sizeGroupId}-${option.id}`;

						return (
							<label
								key={option.id}
								htmlFor={inputId}
								className={clsx(
									"cursor-pointer rounded-md px-4 py-1.5 text-xs font-medium transition-all",
									"has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-blue-500 has-[:focus-visible]:ring-offset-1 has-[:focus-visible]:ring-offset-black/50",
									isSelected
										? "bg-white/15 text-white shadow-sm"
										: "text-white/50 hover:text-white/70",
								)}
							>
								<input
									type="radio"
									id={inputId}
									name={sizeGroupId}
									value={option.id}
									checked={isSelected}
									onChange={() => handleSizeChange(option.id)}
									className="sr-only"
								/>
								{option.label}
							</label>
						);
					})}
				</div>
			</fieldset>

			{/* Magnification Section */}
			<div className="flex items-center justify-between">
				<div className="flex flex-col gap-0.5">
					<label htmlFor={magnificationId} className="text-xs font-medium text-white/70">
						Magnification
					</label>
					<p className="text-xs text-white/40">Scale icons when hovering</p>
				</div>
				<label
					htmlFor={magnificationId}
					className={clsx(
						"relative h-6 w-11 cursor-pointer rounded-full transition-colors",
						"has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-blue-500 has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-black/50",
						dockConfig.magnification ? "bg-blue-500" : "bg-white/20",
					)}
				>
					<input
						type="checkbox"
						id={magnificationId}
						checked={dockConfig.magnification}
						onChange={handleMagnificationToggle}
						className="sr-only"
					/>
					<span
						className={clsx(
							"absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
							dockConfig.magnification && "translate-x-5",
						)}
					/>
				</label>
			</div>
		</div>
	);
});
