"use client";

import clsx from "clsx";
import { Github, Link, Linkedin, Mail, MapPin } from "lucide-react";
import Image from "next/image";
import { memo } from "react";

/**
 * Profile action button configuration
 */
interface ProfileAction {
	label: string;
	icon: typeof Mail;
	href: string;
	ariaLabel: string;
}

const PROFILE_ACTIONS: ProfileAction[] = [
	{
		label: "Email",
		icon: Mail,
		href: "mailto:hireme@dineshd.dev",
		ariaLabel: "Send email to Dinesh",
	},
	{
		label: "GitHub",
		icon: Github,
		href: "https://github.com/dinesh-git17",
		ariaLabel: "View GitHub profile",
	},
	{
		label: "LinkedIn",
		icon: Linkedin,
		href: "https://www.linkedin.com/in/dineshsdawonauth/",
		ariaLabel: "View LinkedIn profile",
	},
	{
		label: "Links",
		icon: Link,
		href: "https://links.dineshd.dev/",
		ariaLabel: "View all links",
	},
];

/**
 * Status indicator with animated pulse effect.
 */
function OnlineIndicator() {
	return (
		<span className="relative flex h-3 w-3">
			<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
			<span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
		</span>
	);
}

/**
 * Avatar component with status indicator overlay.
 */
function Avatar() {
	return (
		<div className="relative">
			{/* Profile picture */}
			<div
				className={clsx(
					"relative h-20 w-20 overflow-hidden rounded-full",
					"ring-2 ring-white/10 ring-offset-2 ring-offset-black/40",
				)}
			>
				<Image
					src="/assets/profile_picture/din.png"
					alt="Dinesh Dawonauth"
					fill
					sizes="80px"
					className="object-cover"
					priority
				/>
			</div>
			{/* Online status badge */}
			<div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-black/60 p-1">
				<OnlineIndicator />
			</div>
		</div>
	);
}

/**
 * Action button styled as system utility control.
 */
interface ActionButtonProps {
	action: ProfileAction;
}

function ActionButton({ action }: ActionButtonProps) {
	const Icon = action.icon;

	return (
		<a
			href={action.href}
			target={action.href.startsWith("mailto:") ? undefined : "_blank"}
			rel={action.href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
			aria-label={action.ariaLabel}
			className={clsx(
				"flex w-full items-center justify-center gap-2 rounded-md px-4 py-2",
				"bg-white/5 text-white/70",
				"transition-colors duration-150",
				"hover:bg-white/10 hover:text-white",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
			)}
		>
			<Icon className="h-4 w-4" />
			<span className="text-xs font-medium">{action.label}</span>
		</a>
	);
}

export interface ProfileSidebarProps {
	className?: string;
}

/**
 * Profile sidebar component - "Player Card" style identity display.
 *
 * Features:
 * - Avatar with animated online status indicator
 * - Name, title, and location metadata
 * - Action buttons for external links (Email, GitHub, LinkedIn)
 */
export const ProfileSidebar = memo(function ProfileSidebar({ className }: ProfileSidebarProps) {
	return (
		<aside
			className={clsx(
				"flex flex-col items-center gap-4 border-r border-white/5 p-5",
				"bg-white/[0.02]",
				className,
			)}
		>
			{/* Avatar Section */}
			<Avatar />

			{/* Identity */}
			<div className="text-center">
				<h2 className="text-base font-semibold text-white">Dinesh Dawonauth</h2>
				<p className="mt-0.5 text-xs text-white/50">Data Engineer</p>
			</div>

			{/* Metadata */}
			<div className="flex flex-col gap-1.5 text-xs text-white/40">
				<div className="flex items-center gap-1.5">
					<MapPin className="h-3 w-3" />
					<span>Toronto, Canada</span>
				</div>
				<div className="flex items-center gap-1.5">
					<span className="font-mono text-[10px] uppercase tracking-wider text-white/30">TZ</span>
					<span className="font-mono">EST (UTC-5)</span>
				</div>
			</div>

			{/* Divider */}
			<div className="h-px w-full bg-white/5" />

			{/* Action Buttons */}
			<div className="flex w-full flex-col gap-2">
				{PROFILE_ACTIONS.map((action) => (
					<ActionButton key={action.label} action={action} />
				))}
			</div>
		</aside>
	);
});
