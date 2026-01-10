"use client";

import { CircleHelp } from "lucide-react";
import { memo } from "react";

/**
 * FAQ Header - Mobile-only top bar for the System Manual.
 *
 * Displays the app icon and title in a compact header format.
 * Only rendered on mobile devices (hidden on desktop via parent).
 */
export const FAQHeader = memo(function FAQHeader() {
	return (
		<header className="flex items-center gap-3 border-b border-white/5 bg-white/[0.02] px-4 py-3">
			<CircleHelp className="size-6 text-white/40" strokeWidth={1.25} />
			<div>
				<h1 className="text-sm font-semibold text-white">System Manual</h1>
				<p className="text-[10px] text-white/40">Documentation & Reference</p>
			</div>
		</header>
	);
});
