"use client";

import { Folder } from "lucide-react";
import { memo } from "react";

/**
 * FolderApp — Generic Finder-style window with empty state.
 *
 * Displays an empty folder placeholder with a subtle grid pattern
 * to indicate the folder is ready for content.
 */
export const FolderApp = memo(function FolderApp() {
	return (
		<div className="relative flex h-full flex-col items-center justify-center">
			{/* Background grid pattern */}
			<div
				className="pointer-events-none absolute inset-0 opacity-[0.03]"
				style={{
					backgroundImage: `
						linear-gradient(to right, white 1px, transparent 1px),
						linear-gradient(to bottom, white 1px, transparent 1px)
					`,
					backgroundSize: "24px 24px",
				}}
				aria-hidden="true"
			/>

			{/* Empty state content */}
			<div className="relative flex flex-col items-center gap-4 text-center">
				<div className="rounded-2xl bg-white/[0.03] p-6">
					<Folder className="h-16 w-16 text-white/20" strokeWidth={1} aria-hidden="true" />
				</div>
				<div className="space-y-1">
					<p className="font-mono text-sm text-white/40">This folder is empty</p>
					<p className="font-mono text-xs text-white/20">0 items</p>
				</div>
			</div>
		</div>
	);
});
