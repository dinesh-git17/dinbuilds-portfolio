"use client";

import { motion, type PanInfo, useDragControls, useMotionValue } from "framer-motion";
import { memo, useCallback, useRef } from "react";

import { selectIsWindowActive, useSystemStore, type WindowInstance } from "@/os/store";

import { WindowControls } from "./WindowControls";

export interface WindowFrameProps {
	/** Window instance data from the store */
	window: WindowInstance;
	/** Window title displayed in the header */
	title: string;
	/** Content rendered inside the window */
	children: React.ReactNode;
	/** Whether to respect reduced motion preferences */
	reducedMotion?: boolean;
}

/**
 * Draggable window container with glassmorphism styling.
 *
 * Features:
 * - Drag via header bar only (useDragControls pattern)
 * - Click anywhere to focus (z-index promotion)
 * - Smooth scale + fade animations on mount/unmount
 * - Constrained to viewport bounds
 */
export const WindowFrame = memo(function WindowFrame({
	window,
	title,
	children,
	reducedMotion = false,
}: WindowFrameProps) {
	const { id, position, size } = window;

	const isActive = useSystemStore(selectIsWindowActive(id));
	const focusWindow = useSystemStore((s) => s.focusWindow);
	const updateWindowPosition = useSystemStore((s) => s.updateWindowPosition);

	const constraintsRef = useRef<HTMLDivElement>(null);
	const dragControls = useDragControls();

	// Motion values for smooth position updates
	const x = useMotionValue(position.x);
	const y = useMotionValue(position.y);

	const handleFocus = useCallback(() => {
		if (!isActive) {
			focusWindow(id);
		}
	}, [focusWindow, id, isActive]);

	const handleDragEnd = useCallback(
		(_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
			updateWindowPosition(id, {
				x: position.x + info.offset.x,
				y: position.y + info.offset.y,
			});
		},
		[id, position.x, position.y, updateWindowPosition],
	);

	// Start drag when pointer down on header
	const handleHeaderPointerDown = useCallback(
		(e: React.PointerEvent) => {
			// Don't start drag if clicking on controls
			if ((e.target as HTMLElement).closest("fieldset")) {
				return;
			}
			dragControls.start(e);
		},
		[dragControls],
	);

	// Animation variants
	const variants = {
		initial: reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 },
		animate: reducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 },
		exit: reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 },
	};

	return (
		<>
			{/* Invisible constraints boundary */}
			<div ref={constraintsRef} className="pointer-events-none fixed inset-4" />

			<motion.div
				role="dialog"
				aria-label={`${title} window`}
				aria-modal="false"
				tabIndex={-1}
				className="fixed select-none"
				style={{
					x,
					y,
					width: size.width,
					height: size.height,
					zIndex: isActive ? 50 : 10,
				}}
				drag
				dragControls={dragControls}
				dragListener={false}
				dragConstraints={constraintsRef}
				dragElastic={0}
				dragMomentum={false}
				onDragEnd={handleDragEnd}
				initial="initial"
				animate="animate"
				exit="exit"
				variants={variants}
				transition={{
					type: "spring",
					stiffness: 400,
					damping: 30,
				}}
				onPointerDown={handleFocus}
			>
				{/* Window chrome */}
				<div
					className={`
						flex h-full flex-col overflow-hidden rounded-xl
						border bg-black/60 backdrop-blur-xl
						shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)]
						transition-[border-color,box-shadow] duration-200
						${isActive ? "border-white/20 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.1)]" : "border-white/10"}
					`}
				>
					{/* Header / Drag Handle */}
					<div
						className="flex h-11 shrink-0 cursor-grab items-center gap-3 border-b border-white/5 px-4 active:cursor-grabbing"
						onPointerDown={handleHeaderPointerDown}
						style={{ touchAction: "none" }}
					>
						<WindowControls windowId={id} />

						<span className="flex-1 truncate text-center font-mono text-xs text-white/50">
							{title}
						</span>

						{/* Spacer for centering title */}
						<div className="w-[52px]" />
					</div>

					{/* Content area */}
					<div className="flex-1 overflow-auto">{children}</div>
				</div>
			</motion.div>
		</>
	);
});
