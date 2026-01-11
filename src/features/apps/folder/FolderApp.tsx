"use client";

import { FileText, Folder } from "lucide-react";
import { memo, useCallback, useRef } from "react";

import { AnalyticsEvent, trackEvent } from "@/lib/analytics";
import { type FolderId, getFilesForFolder, type VirtualFile } from "@/os/filesystem";
import { useNavigate } from "@/os/hooks";
import { AppID } from "@/os/store";
import type { AppComponentProps } from "@/os/window/app-registry";

export interface FolderAppProps extends AppComponentProps {}

/**
 * FolderApp — Finder-style window displaying files from the VFS.
 *
 * Reads files from the Virtual File System based on folderId prop.
 * Double-clicking a file opens it in the appropriate viewer.
 */
export const FolderApp = memo(function FolderApp({ windowProps }: FolderAppProps) {
	const folderId = windowProps?.folderId as FolderId | undefined;
	const files = folderId ? getFilesForFolder(folderId) : [];

	if (files.length === 0) {
		return <EmptyState />;
	}

	return (
		<div className="relative h-full overflow-y-auto p-4">
			{/* Background grid pattern */}
			<div
				className="pointer-events-none absolute inset-0 opacity-[0.02]"
				style={{
					backgroundImage: `
						linear-gradient(to right, white 1px, transparent 1px),
						linear-gradient(to bottom, white 1px, transparent 1px)
					`,
					backgroundSize: "24px 24px",
				}}
				aria-hidden="true"
			/>

			{/* File grid */}
			<div className="relative grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2">
				{files.map((file) => (
					<FileIcon key={file.id} file={file} />
				))}
			</div>

			{/* Footer with item count */}
			<div className="absolute bottom-0 left-0 right-0 border-t border-white/[0.06] bg-black/40 px-4 py-2 backdrop-blur-sm">
				<p className="font-mono text-xs text-white/40">
					{files.length} {files.length === 1 ? "item" : "items"}
				</p>
			</div>
		</div>
	);
});

/**
 * FileIcon — Individual file icon with double-click to open.
 */
interface FileIconProps {
	file: VirtualFile;
}

function FileIcon({ file }: FileIconProps) {
	const { navigate } = useNavigate();
	const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const clickCountRef = useRef(0);

	const openFile = useCallback(() => {
		trackEvent(AnalyticsEvent.FILE_OPENED, {
			file_slug: file.id,
			file_type: file.type,
		});

		navigate(AppID.MarkdownViewer, {
			props: {
				url: file.contentUrl,
				title: file.name,
			},
			launchMethod: "app",
		});
	}, [file.contentUrl, file.id, file.name, file.type, navigate]);

	const handleClick = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			clickCountRef.current += 1;

			if (clickCountRef.current === 1) {
				// First click: set timeout
				clickTimeoutRef.current = setTimeout(() => {
					clickCountRef.current = 0;
				}, 300);
			} else if (clickCountRef.current === 2) {
				// Double click: clear timeout and open
				if (clickTimeoutRef.current) {
					clearTimeout(clickTimeoutRef.current);
					clickTimeoutRef.current = null;
				}
				clickCountRef.current = 0;
				openFile();
			}
		},
		[openFile],
	);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				openFile();
			}
		},
		[openFile],
	);

	return (
		<button
			type="button"
			onClick={handleClick}
			onKeyDown={handleKeyDown}
			className="group flex flex-col items-center gap-1.5 rounded-lg p-3 transition-colors hover:bg-white/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
			aria-label={`Open ${file.name}`}
		>
			{/* File icon with type badge */}
			<div className="relative">
				<div className="flex h-14 w-14 items-center justify-center rounded-lg bg-white/[0.03] transition-colors group-hover:bg-white/[0.06]">
					<FileText
						className="h-8 w-8 text-blue-400/80 transition-colors group-hover:text-blue-400"
						strokeWidth={1.5}
					/>
				</div>

				{/* File type badge */}
				<span className="absolute -bottom-1 -right-1 rounded bg-blue-500/90 px-1 py-0.5 font-mono text-[9px] font-bold uppercase leading-none text-white shadow-sm">
					{file.type}
				</span>
			</div>

			{/* File name */}
			<span
				className="max-w-full truncate px-1 font-mono text-xs text-white/70 transition-colors group-hover:text-white/90"
				title={file.name}
			>
				{file.name}
			</span>
		</button>
	);
}

/**
 * Empty folder state.
 */
function EmptyState() {
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
}
