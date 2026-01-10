import { type ComponentType, lazy } from "react";

import { AboutApp } from "@/apps/about";
import { AppID, type WindowProps } from "@/os/store";

// Lazy-loaded app components (code-split for performance)
const ContactApp = lazy(() => import("@/apps/contact").then((m) => ({ default: m.ContactApp })));
const DebateApp = lazy(() => import("@/apps/debate").then((m) => ({ default: m.DebateApp })));
const FAQApp = lazy(() => import("@/apps/faq").then((m) => ({ default: m.FAQApp })));
const FolderApp = lazy(() => import("@/apps/folder").then((m) => ({ default: m.FolderApp })));
const MarkdownViewerApp = lazy(() =>
	import("@/apps/markdown").then((m) => ({ default: m.MarkdownViewerApp })),
);
const PassFXApp = lazy(() => import("@/apps/passfx").then((m) => ({ default: m.PassFXApp })));
const SettingsApp = lazy(() => import("@/apps/settings").then((m) => ({ default: m.SettingsApp })));
const TerminalApp = lazy(() => import("@/apps/terminal").then((m) => ({ default: m.TerminalApp })));
const YieldApp = lazy(() => import("@/apps/yield").then((m) => ({ default: m.YieldApp })));

/**
 * Props passed to app components that accept window props.
 */
export interface AppComponentProps {
	windowProps?: WindowProps;
}

/**
 * App manifest definition.
 * Each registered app provides metadata and its component.
 */
export interface AppManifest {
	/** Display name shown in window title bar */
	name: string;
	/** The component to render inside the window */
	component: ComponentType<AppComponentProps>;
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
	[AppID.MarkdownViewer]: {
		name: "Markdown",
		component: MarkdownViewerApp,
	},
	[AppID.FAQ]: {
		name: "System Manual",
		component: FAQApp,
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
