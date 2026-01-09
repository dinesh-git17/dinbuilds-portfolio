"use client";

import Image from "next/image";
import { memo, useEffect, useState } from "react";

/**
 * System specification row configuration.
 */
interface SystemSpec {
	label: string;
	value: string | React.ReactNode;
}

/**
 * Format uptime into human-readable string.
 * Displays days, hours, minutes, seconds as appropriate.
 */
function formatUptime(seconds: number): string {
	const days = Math.floor(seconds / 86400);
	const hours = Math.floor((seconds % 86400) / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const secs = seconds % 60;

	const parts: string[] = [];
	if (days > 0) parts.push(`${days}d`);
	if (hours > 0) parts.push(`${hours}h`);
	if (minutes > 0) parts.push(`${minutes}m`);
	parts.push(`${secs}s`);

	return parts.join(" ");
}

/**
 * Hook to track uptime since page load.
 * Uses performance.now() which measures time since navigation start.
 */
function useUptime(): number {
	const [uptime, setUptime] = useState(() => Math.floor(performance.now() / 1000));

	useEffect(() => {
		const interval = setInterval(() => {
			setUptime(Math.floor(performance.now() / 1000));
		}, 1000);

		return () => clearInterval(interval);
	}, []);

	return uptime;
}

/**
 * About Panel - System identity display.
 *
 * Displays system information in a clean layout:
 * - Large OS logo centered at top
 * - System specs table (Name, Version, Uptime, Kernel)
 */
export const AboutPanel = memo(function AboutPanel() {
	const uptime = useUptime();

	const specs: SystemSpec[] = [
		{ label: "Name", value: "DineshOS" },
		{ label: "Version", value: "1.0.0 (Built late at night)" },
		{ label: "Uptime", value: formatUptime(uptime) },
		{ label: "Kernel", value: "Coffee Powered" },
	];

	return (
		<div className="flex h-full flex-col items-center justify-center gap-8">
			{/* OS Logo */}
			<div className="flex flex-col items-center gap-4">
				<div className="relative flex size-24 items-center justify-center rounded-2xl bg-gradient-to-br from-white/10 to-white/5 shadow-lg ring-1 ring-white/10">
					<Image
						src="/assets/task_bar/task_bar_logo.png"
						alt="DineshOS Logo"
						width={64}
						height={64}
						className="size-16 object-contain"
						priority
					/>
				</div>
				<h1 className="font-mono text-lg font-medium text-white">DineshOS</h1>
			</div>

			{/* System Specs Table */}
			<div className="w-full max-w-xs">
				<dl className="divide-y divide-white/10 rounded-lg border border-white/10 bg-white/5">
					{specs.map((spec) => (
						<div key={spec.label} className="flex items-center justify-between px-4 py-3">
							<dt className="text-sm text-white/50">{spec.label}</dt>
							<dd className="font-mono text-sm text-white">{spec.value}</dd>
						</div>
					))}
				</dl>
			</div>
		</div>
	);
});
