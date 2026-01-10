"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { type AppID, useSystemStore } from "@/os/store";

import { APP_CONFIG_MAP, type DockStackItem } from "./dock-config";

export interface DockStackProps {
	/** The stack item configuration */
	stack: DockStackItem;
	/** Whether the stack is currently expanded */
	isOpen: boolean;
	/** Callback to close the stack */
	onClose: () => void;
	/** Anchor element ref for positioning */
	anchorRef: React.RefObject<HTMLElement | null>;
}

interface StackPosition {
	bottom: number;
	left: number;
}

/** Minimum touch target size (WCAG AA) */
const TOUCH_TARGET_SIZE = 56;

/** Stack z-index - above dock (z-50) but below system notifications */
const STACK_Z_INDEX = 60;

/**
 * Spring animation config for stack expand/collapse.
 * Quick, bouncy animation that feels native.
 */
const springTransition = {
	type: "spring" as const,
	stiffness: 500,
	damping: 30,
	mass: 0.8,
};

/**
 * DockStack — Expandable folder overlay for mobile dock.
 *
 * Displays contained apps in a grid layout when the stack folder
 * is tapped. Springs open from the dock icon with a glass panel aesthetic.
 *
 * Features:
 * - Glass morphism panel matching system aesthetic
 * - 3-column grid for touch-friendly layout
 * - Click-outside to dismiss
 * - Framer Motion spring animations
 * - WCAG AA compliant touch targets (min 44px)
 */
export const DockStack = memo(function DockStack({
	stack,
	isOpen,
	onClose,
	anchorRef,
}: DockStackProps) {
	const panelRef = useRef<HTMLDivElement>(null);
	const launchApp = useSystemStore((s) => s.launchApp);

	// Position state - calculated based on anchor element
	const [position, setPosition] = useState<StackPosition | null>(null);

	/**
	 * Calculate and set position based on anchor element.
	 * Uses useLayoutEffect to measure before paint.
	 */
	useLayoutEffect(() => {
		if (!isOpen) {
			setPosition(null);
			return;
		}

		const updatePosition = () => {
			// Try ref first, then fall back to data attribute query
			let anchor = anchorRef.current;
			if (!anchor) {
				// Query for the stack button using data attribute
				anchor = document.querySelector(`[data-stack-id="${stack.id}"]`) as HTMLElement | null;
			}

			if (!anchor) return;

			const anchorRect = anchor.getBoundingClientRect();
			const anchorCenterX = anchorRect.left + anchorRect.width / 2;

			setPosition({
				bottom: window.innerHeight - anchorRect.top + 12,
				left: anchorCenterX,
			});
		};

		// Calculate initial position
		updatePosition();

		// Recalculate after a frame to get accurate panel measurements
		const frameId = requestAnimationFrame(updatePosition);

		// Recalculate on resize
		window.addEventListener("resize", updatePosition);
		return () => {
			window.removeEventListener("resize", updatePosition);
			cancelAnimationFrame(frameId);
		};
	}, [isOpen, anchorRef, stack.id]);

	/**
	 * Handle clicking an app within the stack.
	 * Launches the app and closes the stack.
	 */
	const handleAppClick = useCallback(
		(appId: AppID) => {
			launchApp(appId, { launchMethod: "dock" });
			onClose();
		},
		[launchApp, onClose],
	);

	/**
	 * Handle keyboard navigation within the stack.
	 */
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent, appId: AppID) => {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				handleAppClick(appId);
			} else if (e.key === "Escape") {
				e.preventDefault();
				onClose();
			}
		},
		[handleAppClick, onClose],
	);

	/**
	 * Click-outside detection to close the stack.
	 */
	useEffect(() => {
		if (!isOpen) return;

		const handleClickOutside = (e: MouseEvent | TouchEvent) => {
			const target = e.target as Node;

			// Ignore clicks on the panel itself
			if (panelRef.current?.contains(target)) return;

			// Ignore clicks on the anchor (folder icon) - let toggle handle it
			if (anchorRef.current?.contains(target)) return;

			onClose();
		};

		// Use capture phase to catch clicks before they bubble
		document.addEventListener("mousedown", handleClickOutside, true);
		document.addEventListener("touchstart", handleClickOutside, true);

		return () => {
			document.removeEventListener("mousedown", handleClickOutside, true);
			document.removeEventListener("touchstart", handleClickOutside, true);
		};
	}, [isOpen, onClose, anchorRef]);

	// Don't render until position is calculated
	if (!position && isOpen) return null;

	return (
		<AnimatePresence>
			{isOpen && position && (
				<motion.div
					ref={panelRef}
					role="menu"
					aria-label={`${stack.label} folder contents`}
					className="fixed"
					style={{
						zIndex: STACK_Z_INDEX,
						bottom: position.bottom,
						left: position.left,
					}}
					initial={{ scale: 0.85, y: 20, x: "-50%" }}
					animate={{ scale: 1, y: 0, x: "-50%" }}
					exit={{ scale: 0.85, y: 20, x: "-50%" }}
					transition={springTransition}
				>
					{/* Glass panel background */}
					<div
						className="rounded-2xl p-4"
						style={{
							background: "rgba(40, 40, 40, 0.85)",
							backdropFilter: "blur(24px)",
							WebkitBackdropFilter: "blur(24px)",
							boxShadow: `
								0 0 0 0.5px rgba(255, 255, 255, 0.15),
								0 16px 64px rgba(0, 0, 0, 0.6),
								0 8px 32px rgba(0, 0, 0, 0.4),
								inset 0 0.5px 0 rgba(255, 255, 255, 0.1)
							`,
						}}
					>
						{/* Stack label */}
						<div className="mb-3 text-center">
							<span className="text-xs font-medium text-white/60">{stack.label}</span>
						</div>

						{/* Apps grid - 3 columns for Yield, Debate, PassFX */}
						<div
							className="grid gap-3"
							style={{
								gridTemplateColumns: `repeat(${Math.min(stack.contents.length, 3)}, 1fr)`,
							}}
						>
							{stack.contents.map((appId) => {
								const appConfig = APP_CONFIG_MAP[appId];
								if (!appConfig) return null;

								return (
									<button
										key={appId}
										type="button"
										role="menuitem"
										onClick={() => handleAppClick(appId)}
										onKeyDown={(e) => handleKeyDown(e, appId)}
										aria-label={`Open ${appConfig.label}`}
										className={clsx(
											"flex flex-col items-center gap-2",
											"rounded-xl p-2",
											"transition-colors duration-150",
											"hover:bg-white/10 active:bg-white/15",
											"focus:outline-none focus:ring-2 focus:ring-white/40 focus:ring-offset-2 focus:ring-offset-transparent",
										)}
									>
										{/* App icon */}
										<div
											className="relative overflow-hidden"
											style={{
												width: TOUCH_TARGET_SIZE,
												height: TOUCH_TARGET_SIZE,
												borderRadius: "22.5%",
											}}
										>
											{appConfig.iconSrc ? (
												<div
													className="absolute inset-0"
													style={{
														backgroundColor: appConfig.backgroundColor ?? "#000",
														borderRadius: "22.5%",
														boxShadow: `
															0 2px 8px rgba(0,0,0,0.3),
															0 4px 16px rgba(0,0,0,0.2),
															inset 0 1px 1px rgba(255,255,255,0.1)
														`,
														padding: appConfig.iconPadding,
													}}
												>
													<Image
														src={appConfig.iconSrc}
														alt={appConfig.label}
														fill
														className="object-contain"
														sizes="56px"
														style={{ padding: appConfig.iconPadding }}
													/>
												</div>
											) : (
												<>
													{/* Gradient background */}
													<div
														className="absolute inset-0"
														style={{
															background: appConfig.gradient
																? `linear-gradient(145deg, ${appConfig.gradient[0]}, ${appConfig.gradient[1]})`
																: "linear-gradient(145deg, #666, #333)",
															borderRadius: "22.5%",
															boxShadow: `
																0 2px 8px rgba(0,0,0,0.3),
																0 4px 16px rgba(0,0,0,0.2),
																inset 0 1px 1px rgba(255,255,255,0.2)
															`,
														}}
													/>
													{/* Glass highlight */}
													<div
														className="absolute inset-0 overflow-hidden"
														style={{ borderRadius: "22.5%" }}
													>
														<div
															className="absolute inset-x-0 top-0 h-1/2"
															style={{
																background:
																	"linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 100%)",
															}}
														/>
													</div>
													{/* Lucide icon */}
													{appConfig.icon && (
														<div className="relative flex h-full w-full items-center justify-center">
															<appConfig.icon
																className="pointer-events-none text-white drop-shadow-md"
																style={{ width: "50%", height: "50%" }}
																strokeWidth={1.75}
															/>
														</div>
													)}
												</>
											)}
										</div>

										{/* App label */}
										<span className="max-w-[72px] truncate text-xs font-medium text-white/80">
											{appConfig.label}
										</span>
									</button>
								);
							})}
						</div>
					</div>

					{/* Arrow pointing down to dock - centered since panel is centered on icon */}
					<div className="flex justify-center">
						<div
							className="h-3 w-3 rotate-45"
							style={{
								background: "rgba(40, 40, 40, 0.85)",
								marginTop: -6,
								boxShadow: "2px 2px 4px rgba(0, 0, 0, 0.2)",
							}}
						/>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
});
