"use client";

/**
 * Terminal App
 *
 * Full CLI emulator with P10k-style prompt.
 * Implements TERM-02 (Engine), TERM-03 (Commands), TERM-04 (Scroll).
 */

import clsx from "clsx";
import { memo, useCallback, useEffect, useRef, useState } from "react";

import { AppID, NotificationID, useNotificationStore, useSystemStore } from "@/os/store";

import { MatrixRain } from "./MatrixRain";
import { P10kPrompt } from "./P10kPrompt";
import type { HistoryEntry } from "./types";
import { useTerminalState } from "./use-terminal-state";

/**
 * Render a single history entry with appropriate styling.
 * Uses matrix green color scheme.
 */
function HistoryLine({ entry }: { entry: HistoryEntry }) {
	const baseClass = "font-mono text-sm whitespace-pre-wrap break-words";

	if (entry.type === "command") {
		return (
			<div className={clsx(baseClass, "text-green-400")}>
				<span className="text-green-500">❯ </span>
				{entry.content}
			</div>
		);
	}

	if (entry.type === "error") {
		return <div className={clsx(baseClass, "text-red-400")}>{entry.content}</div>;
	}

	return <div className={clsx(baseClass, "text-green-500/80")}>{entry.content}</div>;
}

/**
 * Welcome message shown on first load.
 */
function WelcomeBanner() {
	return (
		<div className="mb-4 font-mono text-sm">
			<div className="text-green-400">Welcome to DinBuilds OS Terminal v1.0.0</div>
			<div className="text-green-600">
				Type &apos;help&apos; for available commands (or type &apos;matrix&apos; for a surprise).
			</div>
		</div>
	);
}

export const TerminalApp = memo(function TerminalApp() {
	const inputRef = useRef<HTMLInputElement>(null);
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const closeWindow = useSystemStore((s) => s.closeWindow);
	const addNotification = useNotificationStore((s) => s.addNotification);
	const [showMatrix, setShowMatrix] = useState(false);

	/**
	 * Fire "Command line active" notification on terminal mount.
	 */
	useEffect(() => {
		addNotification(NotificationID.TerminalOpened);
	}, [addNotification]);

	const handleExit = useCallback(() => {
		closeWindow(AppID.Terminal);
	}, [closeWindow]);

	const handleMatrix = useCallback(() => {
		setShowMatrix(true);
		addNotification(NotificationID.MatrixEnabled);
	}, [addNotification]);

	const handleHiddenCommand = useCallback(() => {
		addNotification(NotificationID.HiddenFeature);
	}, [addNotification]);

	const {
		currentInput,
		history,
		setInput,
		executeCommand,
		navigateHistoryUp,
		navigateHistoryDown,
		clearHistory,
	} = useTerminalState({
		onExit: handleExit,
		onMatrix: handleMatrix,
		onHiddenCommand: handleHiddenCommand,
	});

	const handleMatrixComplete = useCallback(() => {
		setShowMatrix(false);
		clearHistory();
		inputRef.current?.focus();
	}, [clearHistory]);

	/**
	 * TERM-04: Auto-scroll to bottom on new content.
	 * historyLength triggers scroll when history changes.
	 */
	const historyLength = history.length;
	// biome-ignore lint/correctness/useExhaustiveDependencies: historyLength intentionally triggers scroll on history change
	useEffect(() => {
		if (scrollContainerRef.current) {
			scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
		}
	}, [historyLength]);

	/**
	 * Focus input on mount and maintain focus.
	 */
	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	/**
	 * Scroll to bottom helper - used on focus and viewport resize.
	 */
	const scrollToBottom = useCallback(() => {
		if (scrollContainerRef.current) {
			scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
		}
	}, []);

	/**
	 * Handle input focus - scroll to bottom when keyboard opens.
	 */
	const handleInputFocus = useCallback(() => {
		// Small delay to allow keyboard to finish opening
		setTimeout(scrollToBottom, 100);
	}, [scrollToBottom]);

	/**
	 * Listen to visualViewport resize for keyboard appearance.
	 * When keyboard opens, the visual viewport shrinks - scroll to keep prompt visible.
	 */
	useEffect(() => {
		const viewport = globalThis.window?.visualViewport;
		if (!viewport) return;

		const handleResize = () => {
			// Scroll to bottom when viewport shrinks (keyboard opens)
			scrollToBottom();
		};

		viewport.addEventListener("resize", handleResize);
		return () => viewport.removeEventListener("resize", handleResize);
	}, [scrollToBottom]);

	/**
	 * Focus input when clicking anywhere in terminal.
	 */
	const handleContainerClick = useCallback(() => {
		inputRef.current?.focus();
	}, []);

	/**
	 * Handle keyboard shortcuts at container level.
	 */
	const handleContainerKeyDown = useCallback(
		(event: React.KeyboardEvent) => {
			if (event.key === "l" && (event.ctrlKey || event.metaKey)) {
				event.preventDefault();
				setInput("");
			}
		},
		[setInput],
	);

	return (
		<div
			className="relative flex h-full flex-col bg-[#0d0d0d] text-white"
			onClick={handleContainerClick}
			onKeyDown={handleContainerKeyDown}
			role="application"
			aria-label="Terminal emulator"
		>
			{/* Matrix rain overlay */}
			{showMatrix && <MatrixRain duration={3000} onComplete={handleMatrixComplete} />}

			{/* Scrollable history area (hidden during matrix animation) */}
			{!showMatrix && (
				<div
					ref={scrollContainerRef}
					className="flex-1 overflow-y-auto overscroll-contain p-4 pb-2 [-webkit-overflow-scrolling:touch] md:[scrollbar-width:thin] md:[scrollbar-color:rgba(255,255,255,0.1)_transparent] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:[&::-webkit-scrollbar]:block md:[&::-webkit-scrollbar]:w-1.5 md:[&::-webkit-scrollbar-track]:transparent md:[&::-webkit-scrollbar-thumb]:rounded-full md:[&::-webkit-scrollbar-thumb]:bg-white/10"
					role="log"
					aria-live="polite"
					aria-label="Terminal output"
				>
					<WelcomeBanner />

					{/* History entries */}
					<div className="space-y-1">
						{history.map((entry) => (
							<HistoryLine key={entry.id} entry={entry} />
						))}
					</div>
				</div>
			)}

			{/* Input prompt (hidden during matrix animation) */}
			{!showMatrix && (
				<div className="shrink-0 border-t border-white/5 px-4 pb-5 pt-3 md:pb-4">
					<P10kPrompt
						value={currentInput}
						onChange={setInput}
						onSubmit={executeCommand}
						onHistoryUp={navigateHistoryUp}
						onHistoryDown={navigateHistoryDown}
						inputRef={inputRef}
						onFocus={handleInputFocus}
					/>
				</div>
			)}
		</div>
	);
});
