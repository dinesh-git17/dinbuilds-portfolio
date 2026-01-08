import type { ComponentType } from "react";

import { AboutApp } from "@/apps/about";
import { ContactApp } from "@/apps/contact";
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
 * Placeholder component for apps not yet implemented.
 */
function PlaceholderApp() {
	return (
		<div className="flex h-full items-center justify-center p-8">
			<p className="font-mono text-sm text-foreground-subtle">App content coming soon...</p>
		</div>
	);
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
		component: PlaceholderApp,
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
