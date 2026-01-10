"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import Image from "next/image";
import { memo, useCallback, useEffect, useState } from "react";

import { selectBootTime, selectIsAboutModalOpen, useSystemStore } from "@/os/store";
import { useReducedMotion } from "@/os/window";

/**
 * Format uptime duration into human-readable string.
 * Examples: "0m", "5m", "1h 30m", "2h 0m"
 */
function formatUptime(bootTime: number): string {
	const now = Date.now();
	const diffMs = now - bootTime;
	const diffMinutes = Math.floor(diffMs / 60000);

	if (diffMinutes < 60) {
		return `${diffMinutes}m`;
	}

	const hours = Math.floor(diffMinutes / 60);
	const minutes = diffMinutes % 60;
	return `${hours}h ${minutes}m`;
}

/**
 * AboutSystemModal — Premium glassmorphic modal displaying system information.
 *
 * Features:
 * - Profile avatar, name, and role
 * - Live uptime counter (updates every minute)
 * - Spring scale entrance animation
 * - Fade + drop exit animation
 * - Backdrop click to close
 */
export const AboutSystemModal = memo(function AboutSystemModal() {
	const isOpen = useSystemStore(selectIsAboutModalOpen);
	const bootTime = useSystemStore(selectBootTime);
	const toggleAboutModal = useSystemStore((s) => s.toggleAboutModal);
	const prefersReducedMotion = useReducedMotion();

	// Live uptime state
	const [uptime, setUptime] = useState(() => formatUptime(bootTime));

	// Update uptime every minute while modal is open
	useEffect(() => {
		if (!isOpen) return;

		// Update immediately when opened
		setUptime(formatUptime(bootTime));

		const interval = setInterval(() => {
			setUptime(formatUptime(bootTime));
		}, 60000); // Update every minute

		return () => clearInterval(interval);
	}, [isOpen, bootTime]);

	// Close modal
	const handleClose = useCallback(() => {
		toggleAboutModal(false);
	}, [toggleAboutModal]);

	// Close modal on backdrop click
	const handleBackdropClick = useCallback(
		(e: React.MouseEvent) => {
			// Only close if clicking the backdrop itself, not the modal content
			if (e.target === e.currentTarget) {
				handleClose();
			}
		},
		[handleClose],
	);

	// Close on Escape key
	useEffect(() => {
		if (!isOpen) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				handleClose();
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, handleClose]);

	// Animation configuration
	const springConfig = prefersReducedMotion
		? { duration: 0.1 }
		: { type: "spring" as const, stiffness: 400, damping: 30 };

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.2 }}
					onClick={handleBackdropClick}
					role="dialog"
					aria-modal="true"
					aria-labelledby="about-system-title"
				>
					{/* Modal Card */}
					<motion.div
						className="relative w-[320px] overflow-hidden rounded-2xl border border-white/10 bg-black/70 p-8 shadow-2xl backdrop-blur-xl"
						initial={{ scale: 0.9, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						exit={{ scale: 0.98, opacity: 0, y: 10 }}
						transition={springConfig}
					>
						{/* Close Button */}
						<button
							type="button"
							onClick={handleClose}
							className="absolute top-3 right-3 rounded-full p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white/70"
							aria-label="Close modal"
						>
							<X size={16} />
						</button>

						{/* Profile Section */}
						<div className="flex flex-col items-center text-center">
							{/* Avatar */}
							<div className="relative mb-4 size-20 overflow-hidden rounded-full border-2 border-white/20 shadow-lg">
								<Image
									src="/assets/profile_picture/din.png"
									alt="Dinesh profile"
									fill
									className="object-cover"
									sizes="80px"
								/>
							</div>

							{/* Name */}
							<h2
								id="about-system-title"
								className="text-xl font-semibold tracking-tight text-white"
							>
								Dinesh Dawonauth
							</h2>

							{/* Role */}
							<p className="mt-1 font-mono text-sm text-white/60">Data Engineer</p>

							{/* Divider */}
							<div className="my-6 h-px w-full bg-white/10" />

							{/* System Stats */}
							<div className="w-full space-y-3">
								{/* Uptime */}
								<div className="flex items-center justify-between">
									<span className="font-mono text-xs text-white/40">Uptime</span>
									<span className="font-mono text-sm text-white/80">{uptime}</span>
								</div>

								{/* Version */}
								<div className="flex items-center justify-between">
									<span className="font-mono text-xs text-white/40">Version</span>
									<span className="font-mono text-sm text-white/80">1.0.0</span>
								</div>
							</div>

							{/* Divider */}
							<div className="my-6 h-px w-full bg-white/10" />

							{/* Tagline */}
							<p className="font-mono text-xs italic text-white/40">Built with intent.</p>
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
});
