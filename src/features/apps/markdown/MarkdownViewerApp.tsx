"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import { memo, useEffect, useState } from "react";
import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import type { AppComponentProps } from "@/os/window/app-registry";
import { logBlockedFetch, validateFetchUrl } from "./fetch-validator";
import { SafeImage } from "./SafeImage";

/**
 * Fetch state for markdown content.
 */
type FetchState =
	| { status: "idle" }
	| { status: "loading" }
	| { status: "success"; content: string }
	| { status: "error"; message: string };

export interface MarkdownViewerAppProps extends AppComponentProps {}

/**
 * MarkdownViewerApp — Renders markdown files from the VFS.
 *
 * A Notion/Obsidian-inspired document reader with polished typography
 * and the Focus OS dark aesthetic. Opens in fullscreen for focused reading.
 *
 * Supports Server-Side Rendering via `ssrContent` prop:
 * - When `ssrContent` is provided, renders immediately without fetching
 * - When `ssrContent` is not provided, falls back to client-side fetch
 * - This ensures content is visible to search engines without JavaScript
 */
export const MarkdownViewerApp = memo(function MarkdownViewerApp({
	windowProps,
}: MarkdownViewerAppProps) {
	const url = windowProps?.url;
	const ssrContent = windowProps?.ssrContent;

	// Initialize state based on whether we have SSR content
	// This prevents hydration mismatches by starting with the same state as server
	const [fetchState, setFetchState] = useState<FetchState>(() => {
		if (ssrContent) {
			return { status: "success", content: ssrContent };
		}
		return { status: "idle" };
	});

	useEffect(() => {
		// Skip fetching if we already have SSR content
		if (ssrContent) {
			return;
		}

		if (!url) {
			setFetchState({ status: "error", message: "No file URL provided" });
			return;
		}

		// Validate URL against allowlist before fetching
		const currentOrigin = typeof window !== "undefined" ? window.location.origin : "";
		const validation = validateFetchUrl(url, currentOrigin);

		if (!validation.allowed) {
			logBlockedFetch(url, validation.reason);
			setFetchState({
				status: "error",
				message: "This file source is not allowed",
			});
			return;
		}

		const controller = new AbortController();
		const targetUrl = validation.url;

		async function fetchContent() {
			setFetchState({ status: "loading" });

			try {
				const response = await fetch(targetUrl, { signal: controller.signal });

				if (!response.ok) {
					throw new Error(`Failed to load file (${response.status})`);
				}

				const text = await response.text();
				setFetchState({ status: "success", content: text });
			} catch (error) {
				if (error instanceof Error && error.name === "AbortError") {
					return;
				}
				const message = error instanceof Error ? error.message : "Failed to load file";
				setFetchState({ status: "error", message });
			}
		}

		fetchContent();

		return () => controller.abort();
	}, [url, ssrContent]);

	if (fetchState.status === "idle" || fetchState.status === "loading") {
		return <LoadingState />;
	}

	if (fetchState.status === "error") {
		return <ErrorState message={fetchState.message} />;
	}

	return (
		<div className="relative h-full">
			{/* Top fade gradient */}
			<div
				className="pointer-events-none absolute inset-x-0 top-0 z-10 h-8 bg-gradient-to-b from-black/60 to-transparent"
				aria-hidden="true"
			/>

			{/* Scrollable content */}
			<div className="h-full overflow-y-auto">
				<article className="mx-auto max-w-3xl px-8 py-12 pb-20">
					<Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
						{fetchState.content}
					</Markdown>
				</article>
			</div>

			{/* Bottom fade gradient */}
			<div
				className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-12 bg-gradient-to-t from-black/60 to-transparent"
				aria-hidden="true"
			/>
		</div>
	);
});

/**
 * Custom markdown component renderers.
 * Styled for the Focus OS dark theme with Notion/Obsidian aesthetics.
 */
const markdownComponents: Components = {
	// ─── Headers ───────────────────────────────────────────────────────────────
	h1: ({ children }) => (
		<h1 className="mb-6 text-[2rem] font-bold leading-tight tracking-tight text-white first:mt-0">
			{children}
		</h1>
	),

	h2: ({ children }) => (
		<h2 className="mb-4 mt-12 border-b border-white/[0.08] pb-3 text-xl font-semibold tracking-tight text-white first:mt-0">
			{children}
		</h2>
	),

	h3: ({ children }) => (
		<h3 className="mb-3 mt-10 text-lg font-medium text-white/95 first:mt-0">{children}</h3>
	),

	h4: ({ children }) => (
		<h4 className="mb-2 mt-8 text-base font-medium text-white/90 first:mt-0">{children}</h4>
	),

	// ─── Paragraphs & Text ─────────────────────────────────────────────────────
	p: ({ children }) => <p className="mb-5 text-[15px] leading-[1.75] text-white/70">{children}</p>,

	strong: ({ children }) => <strong className="font-semibold text-white/90">{children}</strong>,

	em: ({ children }) => <em className="italic text-white/75">{children}</em>,

	// ─── Links ─────────────────────────────────────────────────────────────────
	a: ({ href, children }) => (
		<a
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			className="text-accent underline decoration-accent/30 underline-offset-[3px] transition-all duration-150 hover:text-accent-hover hover:decoration-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-2 focus:ring-offset-black"
		>
			{children}
		</a>
	),

	// ─── Lists ─────────────────────────────────────────────────────────────────
	ul: ({ children }) => <ul className="mb-5 space-y-2 pl-5">{children}</ul>,

	ol: ({ children }) => (
		<ol className="mb-5 list-decimal space-y-2 pl-5 marker:text-white/40">{children}</ol>
	),

	li: ({ children }) => (
		<li className="relative text-[15px] leading-[1.7] text-white/70 before:absolute before:-left-4 before:text-white/30 before:content-['•'] [&>ul]:mt-2 [&>ul]:mb-0">
			{children}
		</li>
	),

	// ─── Code ──────────────────────────────────────────────────────────────────
	code: ({ className, children }) => {
		const isBlock = className?.includes("language-");

		if (!isBlock) {
			return (
				<code className="rounded-md bg-white/[0.08] px-1.5 py-0.5 font-mono text-[13px] text-white/85">
					{children}
				</code>
			);
		}

		return (
			<code className="block overflow-x-auto p-4 font-mono text-[13px] leading-relaxed text-white/80">
				{children}
			</code>
		);
	},

	pre: ({ children }) => (
		<pre className="mb-5 overflow-hidden rounded-lg border border-white/[0.06] bg-black/50 shadow-lg shadow-black/20">
			{children}
		</pre>
	),

	// ─── Blockquotes ───────────────────────────────────────────────────────────
	blockquote: ({ children }) => (
		<blockquote className="relative mb-5 border-l-[3px] border-accent/50 bg-accent/[0.03] py-3 pl-5 pr-4 text-white/65 [&>p]:mb-0 [&>p]:text-[15px] [&>p]:italic">
			{children}
		</blockquote>
	),

	// ─── Horizontal Rule ───────────────────────────────────────────────────────
	hr: () => <hr className="my-10 border-0 border-t border-white/[0.08]" />,

	// ─── Images ────────────────────────────────────────────────────────────────
	img: ({ src, alt, title }) => (
		<SafeImage
			src={typeof src === "string" ? src : undefined}
			alt={alt}
			title={title}
			className="my-6 max-w-full rounded-xl shadow-xl shadow-black/30"
		/>
	),

	// ─── Tables ────────────────────────────────────────────────────────────────
	table: ({ children }) => (
		<div className="mb-5 overflow-x-auto rounded-lg border border-white/[0.06]">
			<table className="w-full border-collapse text-sm">{children}</table>
		</div>
	),

	thead: ({ children }) => <thead className="bg-white/[0.03]">{children}</thead>,

	th: ({ children }) => (
		<th className="border-b border-white/[0.08] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/60">
			{children}
		</th>
	),

	td: ({ children }) => (
		<td className="border-b border-white/[0.04] px-4 py-3 text-[14px] text-white/70">{children}</td>
	),

	tr: ({ children }) => <tr className="transition-colors hover:bg-white/[0.02]">{children}</tr>,
};

/**
 * Loading state with centered spinner.
 */
function LoadingState() {
	return (
		<div className="flex h-full flex-col items-center justify-center">
			<div className="flex flex-col items-center gap-4">
				<div className="relative">
					<div className="absolute inset-0 animate-ping rounded-full bg-accent/20" />
					<Loader2 className="relative h-8 w-8 animate-spin text-white/50" aria-hidden="true" />
				</div>
				<p className="font-mono text-sm text-white/40">Loading document...</p>
			</div>
		</div>
	);
}

/**
 * Error state with icon and message.
 */
function ErrorState({ message }: { message: string }) {
	return (
		<div className="flex h-full flex-col items-center justify-center">
			<div className="flex flex-col items-center gap-5 text-center">
				<div className="rounded-2xl bg-red-500/10 p-6 ring-1 ring-red-500/20">
					<AlertCircle className="h-12 w-12 text-red-400/70" strokeWidth={1.5} aria-hidden="true" />
				</div>
				<div className="space-y-1.5">
					<p className="font-mono text-sm font-medium text-white/70">File not found</p>
					<p className="max-w-xs font-mono text-xs text-white/30">{message}</p>
				</div>
			</div>
		</div>
	);
}
