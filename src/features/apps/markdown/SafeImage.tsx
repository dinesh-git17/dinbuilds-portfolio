"use client";

import { ImageOff } from "lucide-react";
import { memo, useMemo } from "react";
import { validateImageSource } from "./image-validator";

export interface SafeImageProps {
	src?: string;
	alt?: string;
	title?: string;
	className?: string;
}

/**
 * SafeImage — A secure image component for markdown content.
 *
 * Validates image sources against an allowlist to prevent:
 * - Loading of external tracking pixels
 * - IP address leakage to untrusted servers
 * - Mixed content (HTTP images)
 *
 * Blocked images display a styled placeholder with alt text.
 */
export const SafeImage = memo(function SafeImage({ src, alt, title, className }: SafeImageProps) {
	const validation = useMemo(() => {
		// Get current origin for same-origin check
		const currentOrigin = typeof window !== "undefined" ? window.location.origin : "";

		return validateImageSource(src, currentOrigin);
	}, [src]);

	if (!validation.allowed) {
		return <BlockedImagePlaceholder alt={alt} reason={validation.reason} />;
	}

	// biome-ignore lint/performance/noImgElement: Markdown images require validated dynamic sources incompatible with next/image
	return <img src={src} alt={alt ?? ""} title={title} className={className} loading="lazy" />;
});

interface BlockedImagePlaceholderProps {
	alt?: string;
	reason: string;
}

/**
 * Placeholder displayed when an image is blocked.
 * Shows "Image blocked" text and the original alt text if available.
 */
function BlockedImagePlaceholder({ alt, reason }: BlockedImagePlaceholderProps) {
	return (
		<div
			className="my-6 flex flex-col items-center justify-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] px-6 py-8"
			role="img"
			aria-label={alt ?? "Blocked image"}
		>
			<div className="rounded-lg bg-white/[0.05] p-3">
				<ImageOff className="h-6 w-6 text-white/30" strokeWidth={1.5} aria-hidden="true" />
			</div>
			<div className="flex flex-col items-center gap-1 text-center">
				<span className="font-mono text-xs font-medium text-white/40">Image blocked</span>
				{alt && <span className="max-w-xs font-mono text-xs text-white/25">{alt}</span>}
			</div>
			{process.env.NODE_ENV === "development" && (
				<span className="mt-1 font-mono text-[10px] text-white/15">{reason}</span>
			)}
		</div>
	);
}
