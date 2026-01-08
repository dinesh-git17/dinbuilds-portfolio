"use client";

import { ExternalLink, RefreshCw, WifiOff } from "lucide-react";
import { memo, useCallback, useRef, useState } from "react";

import { BrowserChrome } from "@/apps/yield/BrowserChrome";

const PASSFX_URL = "https://passfx.dineshd.dev";

type LoadState = "loading" | "loaded" | "error";

/**
 * PassFX App - Browser Simulator
 *
 * Embeds the live PassFX application within a simulated
 * browser chrome. This maintains the "OS" immersion while giving
 * users full access to the interactive application.
 *
 * Features:
 * - Browser Chrome UI (address bar, refresh, secure indicator)
 * - Iframe embedding with proper sandbox permissions
 * - Loading state with animated skeleton
 * - Error fallback with "Open in New Tab" escape hatch
 */
export const PassFXApp = memo(function PassFXApp() {
	const [loadState, setLoadState] = useState<LoadState>("loading");
	const [iframeKey, setIframeKey] = useState(0);
	const iframeRef = useRef<HTMLIFrameElement>(null);

	const handleLoad = useCallback(() => {
		setLoadState("loaded");
	}, []);

	const handleError = useCallback(() => {
		setLoadState("error");
	}, []);

	const handleRefresh = useCallback(() => {
		setLoadState("loading");
		setIframeKey((prev) => prev + 1);
	}, []);

	const handleOpenExternal = useCallback(() => {
		window.open(PASSFX_URL, "_blank", "noopener,noreferrer");
	}, []);

	return (
		<div className="flex h-full flex-col">
			<BrowserChrome
				url={PASSFX_URL}
				onRefresh={handleRefresh}
				isLoading={loadState === "loading"}
			/>

			<div className="relative flex-1 overflow-hidden">
				{/* Loading State */}
				{loadState === "loading" && (
					<div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-background">
						<div className="relative">
							<div className="h-8 w-8 animate-spin rounded-full border-2 border-foreground-muted border-t-accent" />
						</div>
						<p className="font-mono text-sm text-foreground-muted">
							Connecting to passfx.dineshd.dev...
						</p>
					</div>
				)}

				{/* Error State */}
				{loadState === "error" && (
					<div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 bg-background p-8">
						<div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
							<WifiOff size={32} className="text-red-400" />
						</div>
						<div className="text-center">
							<h3 className="mb-2 font-mono text-sm font-medium text-foreground">
								Connection Refused
							</h3>
							<p className="max-w-xs text-xs text-foreground-muted">
								Unable to establish a secure connection to the application.
							</p>
						</div>
						<div className="flex gap-3">
							<button
								type="button"
								onClick={handleRefresh}
								className="flex items-center gap-2 rounded-md bg-white/5 px-4 py-2 font-mono text-xs text-foreground-subtle transition-colors hover:bg-white/10"
							>
								<RefreshCw size={14} />
								Retry
							</button>
							<button
								type="button"
								onClick={handleOpenExternal}
								className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 font-mono text-xs text-white transition-colors hover:bg-accent/90"
							>
								<ExternalLink size={14} />
								Open in New Tab
							</button>
						</div>
					</div>
				)}

				{/* Iframe */}
				<iframe
					key={iframeKey}
					ref={iframeRef}
					src={PASSFX_URL}
					title="PassFX"
					className="h-full w-full border-0"
					sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
					loading="lazy"
					onLoad={handleLoad}
					onError={handleError}
				/>
			</div>
		</div>
	);
});
