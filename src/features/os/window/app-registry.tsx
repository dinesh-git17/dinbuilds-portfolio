import type { ComponentType } from "react";

import { AboutApp } from "@/apps/about";
import { ContactApp } from "@/apps/contact";
import { DebateApp } from "@/apps/debate";
import { FolderApp } from "@/apps/folder";
import { PassFXApp } from "@/apps/passfx";
import { SettingsApp } from "@/apps/settings";
import { TerminalApp } from "@/apps/terminal";
import { YieldApp } from "@/apps/yield";
import { AppID } from "@/os/store";

/**
 * App manifest definition.
 * Each registered app provides metadata and its component.
 */
export interface AppManifest {
	/** Display name shown in window title bar */
	name: string;
	/** The component to render inside the window */
	component: ComponentType;
}

/**
 * Registry of all available applications.
 * Maps AppID to manifest with name and component.
 *
 * Apps are registered here and lazy-loaded when needed.
 * The actual app components will live in src/features/apps/.
 */
export const APP_REGISTRY: Record<AppID, AppManifest> = {
	[AppID.Yield]: {
		name: "Yield",
		component: YieldApp,
	},
	[AppID.Debate]: {
		name: "Debate Lab",
		component: DebateApp,
	},
	[AppID.PassFX]: {
		name: "PassFX",
		component: PassFXApp,
	},
	[AppID.Terminal]: {
		name: "Terminal",
		component: TerminalApp,
	},
	[AppID.About]: {
		name: "About",
		component: AboutApp,
	},
	[AppID.Contact]: {
		name: "Contact",
		component: ContactApp,
	},
	[AppID.Settings]: {
		name: "Settings",
		component: SettingsApp,
	},
	[AppID.FolderProjects]: {
		name: "Projects",
		component: FolderApp,
	},
	[AppID.FolderExperience]: {
		name: "Experience",
		component: FolderApp,
	},
};

/**
 * Get app manifest by ID.
 * Throws if app is not registered (should never happen with typed AppID).
 */
export function getAppManifest(appId: AppID): AppManifest {
	const manifest = APP_REGISTRY[appId];
	if (!manifest) {
		throw new Error(`App not registered: ${appId}`);
	}
	return manifest;
}
