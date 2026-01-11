/**
 * @vitest-environment jsdom
 */
/**
 * MarkdownViewerApp Tests — SSR Content Handling
 *
 * Tests that the MarkdownViewerApp correctly handles SSR content
 * to prevent hydration mismatches.
 */

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MarkdownViewerApp } from "./MarkdownViewerApp";

// Mock fetch for client-side loading tests
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("MarkdownViewerApp", () => {
	beforeEach(() => {
		mockFetch.mockReset();
	});

	afterEach(() => {
		cleanup();
	});

	describe("SSR Content Handling", () => {
		it("renders SSR content immediately without loading state", () => {
			const ssrContent = "# Hello World\n\nThis is SSR content.";

			render(
				<MarkdownViewerApp
					windowProps={{
						url: "/readmes/test.md",
						ssrContent,
					}}
				/>,
			);

			// Should render the content immediately
			expect(screen.getByRole("heading", { name: /Hello World/i })).toBeInTheDocument();
			expect(screen.getByText(/This is SSR content/i)).toBeInTheDocument();

			// Should NOT show loading state
			expect(screen.queryByText(/Loading document/i)).not.toBeInTheDocument();
		});

		it("does not fetch when SSR content is provided", async () => {
			const ssrContent = "# SSR Content";

			render(
				<MarkdownViewerApp
					windowProps={{
						url: "/readmes/test.md",
						ssrContent,
					}}
				/>,
			);

			// Wait a tick to ensure no fetch is triggered
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Fetch should not have been called
			expect(mockFetch).not.toHaveBeenCalled();
		});

		it("renders markdown formatting correctly from SSR content", () => {
			const ssrContent = `# Heading 1

## Heading 2

This is a **bold** and *italic* paragraph.

- List item 1
- List item 2

\`\`\`javascript
const code = "block";
\`\`\`
`;

			render(
				<MarkdownViewerApp
					windowProps={{
						url: "/readmes/test.md",
						ssrContent,
					}}
				/>,
			);

			// Verify headings
			expect(screen.getByRole("heading", { level: 1, name: /Heading 1/i })).toBeInTheDocument();
			expect(screen.getByRole("heading", { level: 2, name: /Heading 2/i })).toBeInTheDocument();

			// Verify list items
			expect(screen.getByText(/List item 1/i)).toBeInTheDocument();
			expect(screen.getByText(/List item 2/i)).toBeInTheDocument();
		});
	});

	describe("Client-side Fallback", () => {
		it("shows loading state when no SSR content is provided", () => {
			// Mock a pending fetch
			mockFetch.mockImplementation(() => new Promise(() => {}));

			render(
				<MarkdownViewerApp
					windowProps={{
						url: "/readmes/test.md",
					}}
				/>,
			);

			// Should show loading state
			expect(screen.getByText(/Loading document/i)).toBeInTheDocument();
		});

		it("fetches content when no SSR content is provided", async () => {
			const mockContent = "# Fetched Content";
			mockFetch.mockResolvedValueOnce({
				ok: true,
				text: () => Promise.resolve(mockContent),
			});

			render(
				<MarkdownViewerApp
					windowProps={{
						url: "/readmes/test.md",
					}}
				/>,
			);

			// Wait for fetch to complete
			await waitFor(() => {
				expect(screen.getByRole("heading", { name: /Fetched Content/i })).toBeInTheDocument();
			});

			// Verify fetch was called
			expect(mockFetch).toHaveBeenCalled();
		});

		it("shows error state when URL is not provided and no SSR content", async () => {
			render(<MarkdownViewerApp windowProps={{}} />);

			await waitFor(() => {
				expect(screen.getByText(/No file URL provided/i)).toBeInTheDocument();
			});
		});
	});
});
