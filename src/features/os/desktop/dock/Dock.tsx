"use client";

import { motion, useMotionValue } from "framer-motion";
import { memo, useCallback, useRef, useState } from "react";

import { DockIcon } from "./DockIcon";
import { DOCK_ITEMS } from "./dock-config";
import { useDeviceType } from "./useDeviceType";

/**
 * The Dock — macOS-style app launcher with magnification effect.
 *
 * Desktop: Bottom-center floating dock with parabolic magnification on hover.
 * Mobile: Compact pill navigation with static icons.
 *
 * Features:
 * - Framer Motion magnification based on mouse proximity
 * - Icons appear to sit on a frosted glass platform
 * - Platform naturally expands as icons magnify
 * - Keyboard navigation via arrow keys (WCAG AA)
 */
export const Dock = memo(function Dock() {
	const deviceType = useDeviceType();
	const isMobile = deviceType === "mobile";

	const dockRef = useRef<HTMLElement>(null);
	const mouseX = useMotionValue(Infinity);

	// Keyboard navigation state
	const [focusedIndex, setFocusedIndex] = useState<number>(-1);

	const handleMouseMove = useCallback(
		(e: React.MouseEvent) => {
			if (isMobile) return;
			mouseX.set(e.clientX);
		},
		[isMobile, mouseX],
	);

	const handleMouseLeave = useCallback(() => {
		mouseX.set(Infinity);
		setFocusedIndex(-1);
	}, [mouseX]);

	const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
		const itemCount = DOCK_ITEMS.length;

		switch (e.key) {
			case "ArrowRight":
			case "ArrowDown":
				e.preventDefault();
				setFocusedIndex((prev) => (prev + 1) % itemCount);
				break;
			case "ArrowLeft":
			case "ArrowUp":
				e.preventDefault();
				setFocusedIndex((prev) => (prev - 1 + itemCount) % itemCount);
				break;
			case "Home":
				e.preventDefault();
				setFocusedIndex(0);
				break;
			case "End":
				e.preventDefault();
				setFocusedIndex(itemCount - 1);
				break;
		}
	}, []);

	const handleIconFocus = useCallback((index: number) => {
		setFocusedIndex(index);
	}, []);

	const handleIconClick = useCallback(() => {
		setFocusedIndex(-1);
	}, []);

	// Prevent selection box from triggering when interacting with dock
	const handlePointerDown = useCallback((e: React.PointerEvent) => {
		e.stopPropagation();
	}, []);

	return (
		<motion.nav
			ref={dockRef}
			role="navigation"
			aria-label="Application dock"
			className="fixed bottom-3 left-1/2 z-50 -translate-x-1/2"
			initial={{ y: 100, opacity: 0 }}
			animate={{ y: 0, opacity: 1 }}
			transition={{
				type: "spring",
				stiffness: 300,
				damping: 30,
				delay: 0.2,
			}}
			onPointerDown={handlePointerDown}
		>
			{/* Dock platform container */}
			<div
				role="toolbar"
				aria-label="Application shortcuts"
				className="relative"
				onMouseMove={handleMouseMove}
				onMouseLeave={handleMouseLeave}
				onKeyDown={handleKeyDown}
			>
				{/* Glass platform background */}
				<div
					className="absolute inset-x-0 bottom-0 rounded-2xl"
					style={{
						height: isMobile ? "64px" : "68px",
						background: "rgba(50, 50, 50, 0.65)",
						backdropFilter: "blur(20px)",
						WebkitBackdropFilter: "blur(20px)",
						boxShadow: `
							0 0 0 0.5px rgba(255, 255, 255, 0.15),
							0 8px 40px rgba(0, 0, 0, 0.55),
							inset 0 0.5px 0 rgba(255, 255, 255, 0.1)
						`,
					}}
				/>

				{/* Icons row - positioned above the platform */}
				<div
					className={`
						relative flex items-end
						${isMobile ? "gap-2 px-2 pb-1.5" : "gap-3 px-3 pb-2"}
					`}
				>
					{DOCK_ITEMS.map((item, index) => (
						<DockIcon
							key={item.id}
							appId={item.id}
							label={item.label}
							icon={item.icon}
							iconSrc={item.iconSrc}
							gradient={item.gradient}
							backgroundColor={item.backgroundColor}
							mouseX={mouseX}
							magnify={!isMobile}
							isFocused={focusedIndex === index}
							onFocus={() => handleIconFocus(index)}
							onClick={handleIconClick}
						/>
					))}
				</div>
			</div>
		</motion.nav>
	);
});
