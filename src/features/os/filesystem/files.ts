/**
 * Virtual File System (VFS) Registry
 *
 * Static data structure mapping folder IDs to file entries.
 * Emulates a filesystem without a backend by using flat Markdown files
 * stored in /public/readmes/.
 */

import type { LucideIcon } from "lucide-react";
import { FileText } from "lucide-react";

/**
 * Supported file types in the VFS.
 */
export type FileType = "md" | "txt";

/**
 * Virtual file entry definition.
 * Each file has metadata and a URL to its content.
 */
export interface VirtualFile {
	/** Unique identifier for the file */
	id: string;
	/** Display name (shown in folder grid) */
	name: string;
	/** File extension type */
	type: FileType;
	/** Lucide icon component for the file */
	icon: LucideIcon;
	/** Path to the file content in /public */
	contentUrl: string;
}

/**
 * Folder identifiers matching desktop folder apps.
 */
export type FolderId = "projects" | "experience";

/**
 * Project file definitions.
 * Each entry represents a project README in /public/readmes/.
 */
const PROJECT_FILES: VirtualFile[] = [
	{
		id: "file.yield",
		name: "Yield",
		type: "md",
		icon: FileText,
		contentUrl: "/readmes/yield.md",
	},
	{
		id: "file.passfx",
		name: "PassFX",
		type: "md",
		icon: FileText,
		contentUrl: "/readmes/passfx.md",
	},
	{
		id: "file.debate-lab",
		name: "Debate Lab",
		type: "md",
		icon: FileText,
		contentUrl: "/readmes/debate-lab.md",
	},
	{
		id: "file.imessage-wrapped",
		name: "iMessage Wrapped",
		type: "md",
		icon: FileText,
		contentUrl: "/readmes/imessage-wrapped.md",
	},
	{
		id: "file.holiday-exe",
		name: "Holiday.exe",
		type: "md",
		icon: FileText,
		contentUrl: "/readmes/holiday-exe.md",
	},
	{
		id: "file.links",
		name: "Links",
		type: "md",
		icon: FileText,
		contentUrl: "/readmes/links.md",
	},
];

/**
 * Experience file definitions.
 * Each entry represents a work experience README in /public/readmes/.
 */
const EXPERIENCE_FILES: VirtualFile[] = [
	{
		id: "file.meridian",
		name: "Meridian Credit Union",
		type: "md",
		icon: FileText,
		contentUrl: "/readmes/meridian.md",
	},
	{
		id: "file.slice-labs",
		name: "Slice Labs",
		type: "md",
		icon: FileText,
		contentUrl: "/readmes/slice-labs.md",
	},
	{
		id: "file.carleton",
		name: "Carleton University",
		type: "md",
		icon: FileText,
		contentUrl: "/readmes/carleton.md",
	},
	{
		id: "file.absa",
		name: "Absa Group",
		type: "md",
		icon: FileText,
		contentUrl: "/readmes/absa.md",
	},
];

/**
 * VFS Registry mapping folder IDs to their file contents.
 */
export const VFS_REGISTRY: Record<FolderId, VirtualFile[]> = {
	projects: PROJECT_FILES,
	experience: EXPERIENCE_FILES,
};

/**
 * Get files for a specific folder.
 * Returns empty array if folder ID is not found.
 */
export function getFilesForFolder(folderId: FolderId): VirtualFile[] {
	return VFS_REGISTRY[folderId] ?? [];
}

/**
 * Get a specific file by ID across all folders.
 * Returns undefined if file is not found.
 */
export function getFileById(fileId: string): VirtualFile | undefined {
	for (const files of Object.values(VFS_REGISTRY)) {
		const file = files.find((f) => f.id === fileId);
		if (file) return file;
	}
	return undefined;
}
