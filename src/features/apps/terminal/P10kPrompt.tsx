/**
 * P10k Prompt Component
 *
 * TERM-01: Powerlevel10k-style command prompt.
 * Features connected segments with integrated arrow separators.
 */

import { Folder, GitBranch } from "lucide-react";
import { memo } from "react";

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
}: P10kPromptProps) {
	const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
		if (event.key === "Enter") {
			event.preventDefault();
			onSubmit();
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
			{/* Connected segments */}
			<div className="flex items-center">
				<PathSegment path={path} hasNext={Boolean(gitBranch)} />
				{gitBranch && <GitSegment branch={gitBranch} />}
			</div>

			{/* Input area */}
			<div className="ml-4 flex flex-1 items-center">
				<span className="mr-1 font-mono text-sm text-green-500">❯</span>
				<input
					ref={inputRef}
					type="text"
					value={value}
					onChange={(e) => onChange(e.target.value)}
					onKeyDown={handleKeyDown}
					className="flex-1 bg-transparent font-mono text-sm text-green-400 caret-green-400 outline-none placeholder:text-green-700"
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
