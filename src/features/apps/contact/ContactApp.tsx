"use client";

import clsx from "clsx";
import { Radio, Server, Shield, Wifi } from "lucide-react";
import { memo, useEffect, useState } from "react";

import { ContactForm } from "./ContactForm";

/**
 * Animated status indicator with pulse effect.
 */
function StatusIndicator({ status }: { status: "online" | "offline" }) {
	const isOnline = status === "online";

	return (
		<span className="relative flex h-2 w-2">
			{isOnline && (
				<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
			)}
			<span
				className={clsx(
					"relative inline-flex h-2 w-2 rounded-full",
					isOnline ? "bg-emerald-500" : "bg-red-500",
				)}
			/>
		</span>
	);
}

/**
 * System status row displaying a metric.
 */
interface StatusRowProps {
	icon: typeof Wifi;
	label: string;
	value: string;
	status?: "online" | "offline";
}

function StatusRow({ icon: Icon, label, value, status }: StatusRowProps) {
	return (
		<div className="flex items-center justify-between gap-4 py-1.5">
			<div className="flex items-center gap-2">
				<Icon className="h-3.5 w-3.5 text-white/30" />
				<span className="font-mono text-xs text-white/50">{label}</span>
			</div>
			<div className="flex items-center gap-1.5">
				{status && <StatusIndicator status={status} />}
				<span
					className={clsx(
						"font-mono text-xs",
						status === "online" ? "text-emerald-400" : "text-white/70",
					)}
				>
					{value}
				</span>
			</div>
		</div>
	);
}

/**
 * Left sidebar showing connection status and system info.
 */
function ConnectionStatus() {
	const [latency, setLatency] = useState<number | null>(null);

	useEffect(() => {
		const measureLatency = () => {
			const start = performance.now();
			fetch("/api/contact", { method: "HEAD" })
				.then(() => {
					const end = performance.now();
					setLatency(Math.round(end - start));
				})
				.catch(() => setLatency(null));
		};

		measureLatency();
		const interval = setInterval(measureLatency, 30000);
		return () => clearInterval(interval);
	}, []);

	return (
		<aside className={clsx("flex flex-col gap-4 border-r border-white/5 p-4", "bg-white/[0.02]")}>
			{/* Header */}
			<div className="flex items-center gap-2">
				<Radio className="h-4 w-4 text-emerald-500" />
				<span className="font-mono text-xs font-medium uppercase tracking-wider text-white/70">
					Comm Link
				</span>
			</div>

			{/* Status Grid */}
			<div className="flex flex-col divide-y divide-white/5">
				<StatusRow icon={Wifi} label="Connection" value="Online" status="online" />
				<StatusRow
					icon={Server}
					label="Latency"
					value={latency !== null ? `${latency}ms` : "---"}
				/>
				<StatusRow icon={Shield} label="Encryption" value="TLS 1.3" />
			</div>

			{/* Terminal Info */}
			<div className="mt-auto rounded border border-white/5 bg-black/40 p-3">
				<p className="font-mono text-[10px] uppercase tracking-wider text-white/30">Endpoint</p>
				<p className="mt-1 break-all font-mono text-xs text-white/60">info@dineshd.dev</p>
			</div>
		</aside>
	);
}

/**
 * Contact App - Secure Communication Interface
 *
 * Split-view layout:
 * - Left: Connection status panel with system metrics
 * - Right: Contact form with terminal-style inputs
 */
export const ContactApp = memo(function ContactApp() {
	return (
		<div className="flex h-full">
			{/* Left Column - Status Panel */}
			<ConnectionStatus />

			{/* Right Column - Form Area */}
			<main className="flex flex-1 flex-col overflow-hidden">
				{/* Header */}
				<header className="border-b border-white/5 px-5 py-3">
					<h1 className="font-mono text-sm font-medium text-white/80">New Transmission</h1>
					<p className="mt-0.5 font-mono text-[10px] text-white/40">
						All fields required. Response within 24 hours.
					</p>
				</header>

				{/* Form */}
				<div className="flex-1 overflow-y-auto p-5">
					<ContactForm />
				</div>
			</main>
		</div>
	);
});
