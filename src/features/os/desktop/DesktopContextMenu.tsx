"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Code, ImageIcon, RefreshCw, Settings } from "lucide-react";
import { memo, useCallback, useEffect, useRef, useState } from "react";

export interface DesktopContextMenuProps {
	/** Whether the menu is open */
	isOpen: boolean;
	/** Position of the menu */
	position: { x: number; y: number };
	/** Callback to close the menu */
	onClose: () => void;
	/** Callback to enable browser context menu on next right-click */
	onRequestBrowserMenu: () => void;
}

interface MenuItemProps {
	icon: React.ReactNode;
	label: string;
	onClick?: () => void;
	disabled?: boolean;
}

const MenuItem = memo(function MenuItem({ icon, label, onClick, disabled = false }: MenuItemProps) {
	return (
		<button
			type="button"
			onClick={disabled ? undefined : onClick}
			disabled={disabled}
			className={`
				flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm
				transition-colors duration-100
				${disabled ? "cursor-not-allowed text-white/30" : "text-white/80 hover:bg-white/10 hover:text-white"}
			`}
		>
			<span className={disabled ? "opacity-30" : "opacity-70"}>{icon}</span>
			<span>{label}</span>
		</button>
	);
});

/**
 * DesktopContextMenu — Custom right-click menu for the desktop.
 *
 * Renders a glassmorphism context menu at the specified position.
 * Closes when clicking outside or pressing Escape.
 */
export const DesktopContextMenu = memo(function DesktopContextMenu({
	isOpen,
	position,
	onClose,
	onRequestBrowserMenu,
}: DesktopContextMenuProps) {
	const menuRef = useRef<HTMLDivElement>(null);
	const [adjustedPosition, setAdjustedPosition] = useState(position);

	// Adjust position to keep menu within viewport
	useEffect(() => {
		if (isOpen && menuRef.current) {
			const menu = menuRef.current;
			const rect = menu.getBoundingClientRect();
			const viewportWidth = window.innerWidth;
			const viewportHeight = window.innerHeight;

			let x = position.x;
			let y = position.y;

			// Adjust if menu would overflow right edge
			if (x + rect.width > viewportWidth - 8) {
				x = viewportWidth - rect.width - 8;
			}

			// Adjust if menu would overflow bottom edge
			if (y + rect.height > viewportHeight - 8) {
				y = viewportHeight - rect.height - 8;
			}

			setAdjustedPosition({ x, y });
		} else {
			setAdjustedPosition(position);
		}
	}, [isOpen, position]);

	// Close on Escape key
	useEffect(() => {
		if (!isOpen) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onClose();
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, onClose]);

	// Close on click outside
	useEffect(() => {
		if (!isOpen) return;

		const handleClickOutside = (e: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
				onClose();
			}
		};

		// Use setTimeout to avoid immediate trigger from the contextmenu event
		const timeoutId = setTimeout(() => {
			document.addEventListener("click", handleClickOutside);
			document.addEventListener("contextmenu", handleClickOutside);
		}, 0);

		return () => {
			clearTimeout(timeoutId);
			document.removeEventListener("click", handleClickOutside);
			document.removeEventListener("contextmenu", handleClickOutside);
		};
	}, [isOpen, onClose]);

	const handleChangeWallpaper = useCallback(() => {
		// Placeholder action - could open wallpaper picker
		onClose();
	}, [onClose]);

	const handleRefresh = useCallback(() => {
		window.location.reload();
	}, []);

	const handleDeveloper = useCallback(() => {
		onRequestBrowserMenu();
		onClose();
	}, [onRequestBrowserMenu, onClose]);

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					ref={menuRef}
					className="fixed z-[200] min-w-[180px] overflow-hidden rounded-lg border border-white/10 bg-black/70 p-1 shadow-2xl backdrop-blur-xl"
					style={{
						left: adjustedPosition.x,
						top: adjustedPosition.y,
					}}
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					exit={{ opacity: 0, scale: 0.95 }}
					transition={{ duration: 0.1, ease: "easeOut" }}
				>
					<MenuItem
						icon={<ImageIcon size={16} />}
						label="Change Wallpaper"
						onClick={handleChangeWallpaper}
					/>
					<MenuItem icon={<RefreshCw size={16} />} label="Refresh" onClick={handleRefresh} />
					<div className="my-1 h-px bg-white/10" />
					<MenuItem icon={<Settings size={16} />} label="Properties" disabled />
					<div className="my-1 h-px bg-white/10" />
					<MenuItem icon={<Code size={16} />} label="Developer" onClick={handleDeveloper} />
				</motion.div>
			)}
		</AnimatePresence>
	);
});
