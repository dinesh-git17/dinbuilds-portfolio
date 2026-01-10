/**
 * P10k Prompt Component
 *
 * TERM-01: Powerlevel10k-style command prompt.
 * Features connected segments with integrated arrow separators.
 * Mobile: Simplified prompt to prevent line wrapping.
 */

import { Folder, GitBranch } from "lucide-react";
import { memo } from "react";

import { useDeviceType } from "@/os/desktop/dock/useDeviceType";

export interface P10kPromptProps {
	/** Current working directory path */
	path?: string;
	/** Git branch name (null if not in repo) */
	gitBranch?: string;
	/** Current input value */
	value: string;
	/** Input change handler */
	onChange: (value: string) => void;
	/** Enter key submission handler */
	onSubmit: () => void;
	/** Up arrow handler for history navigation */
	onHistoryUp: () => void;
	/** Down arrow handler for history navigation */
	onHistoryDown: () => void;
	/** Reference to the input element */
	inputRef: React.RefObject<HTMLInputElement | null>;
	/** Focus handler - called when input receives focus (e.g., keyboard opens) */
	onFocus?: () => void;
}

/** Arrow width in pixels for consistent sizing */
const ARROW_WIDTH = 10;

/**
 * SVG arrow shape for segment transitions.
 * Points right, fills with the segment's background color.
 */
function SegmentArrow({ color }: { color: string }) {
	return (
		<svg
			className="absolute right-0 top-0 h-full translate-x-full"
			style={{ width: ARROW_WIDTH }}
			viewBox="0 0 10 24"
			preserveAspectRatio="none"
			aria-hidden="true"
		>
			<polygon points="0,0 10,12 0,24" fill={color} />
		</svg>
	);
}

/**
 * Path segment - Blue background with folder icon and integrated arrow.
 */
function PathSegment({ path, hasNext }: { path: string; hasNext: boolean }) {
	return (
		<div
			className="relative flex h-6 items-center gap-1.5 bg-blue-600 pl-2.5"
			style={{ paddingRight: hasNext ? 8 : 12 }}
		>
			<Folder className="size-3.5" aria-hidden="true" />
			<span className="font-mono text-xs font-medium text-white">{path}</span>
			<SegmentArrow color="#2563eb" />
		</div>
	);
}

/**
 * Git segment - Green background with branch icon and integrated arrow.
 * Has a notched left edge to receive the previous segment's arrow.
 */
function GitSegment({ branch }: { branch: string }) {
	return (
		<div
			className="relative flex h-6 items-center gap-1.5 bg-green-600"
			style={{
				paddingLeft: ARROW_WIDTH + 6,
				paddingRight: 8,
				marginLeft: -1,
			}}
		>
			{/* Notch cutout to receive previous arrow */}
			<svg
				className="absolute left-0 top-0 h-full"
				style={{ width: ARROW_WIDTH }}
				viewBox="0 0 10 24"
				preserveAspectRatio="none"
				aria-hidden="true"
			>
				<polygon points="0,0 10,12 0,24 0,0" fill="#2563eb" />
			</svg>
			<GitBranch className="size-3.5" aria-hidden="true" />
			<span className="font-mono text-xs font-medium text-white">git:({branch})</span>
			<SegmentArrow color="#16a34a" />
		</div>
	);
}

export const P10kPrompt = memo(function P10kPrompt({
	path = "~/portfolio",
	gitBranch = "main",
	value,
	onChange,
	onSubmit,
	onHistoryUp,
	onHistoryDown,
	inputRef,
	onFocus,
}: P10kPromptProps) {
	const deviceType = useDeviceType();
	const isMobile = deviceType === "mobile";

	const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
		if (event.key === "Enter") {
			event.preventDefault();
			onSubmit();
			// Blur input to close mobile keyboard after command submission
			inputRef.current?.blur();
		} else if (event.key === "ArrowUp") {
			event.preventDefault();
			onHistoryUp();
		} else if (event.key === "ArrowDown") {
			event.preventDefault();
			onHistoryDown();
		}
	};

	return (
		<div className="flex items-center">
			{/* Desktop: Full P10k segments | Mobile: Simplified ~ prompt */}
			{!isMobile && (
				<div className="flex items-center">
					<PathSegment path={path} hasNext={Boolean(gitBranch)} />
					{gitBranch && <GitSegment branch={gitBranch} />}
				</div>
			)}

			{/* Input area */}
			<div className={`flex h-8 flex-1 items-center ${isMobile ? "" : "ml-4"}`}>
				{/* Mobile: Show ~ prefix for context */}
				{isMobile && <span className="mr-1 font-mono text-base leading-none text-blue-400">~</span>}
				<span className="mr-1 font-mono text-base leading-none text-green-500 md:text-sm">❯</span>
				<input
					ref={inputRef}
					type="text"
					value={value}
					onChange={(e) => onChange(e.target.value)}
					onKeyDown={handleKeyDown}
					onFocus={onFocus}
					className="h-8 flex-1 bg-transparent font-mono text-base leading-none text-green-400 caret-green-400 outline-none placeholder:text-green-700 md:text-sm"
					placeholder=""
					spellCheck={false}
					autoComplete="off"
					autoCapitalize="off"
					aria-label="Terminal input"
				/>
			</div>
		</div>
	);
});
