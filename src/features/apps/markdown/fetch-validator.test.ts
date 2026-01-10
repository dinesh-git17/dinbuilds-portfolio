import { describe, expect, it } from "vitest";
import { isFetchAllowed, validateFetchUrl } from "./fetch-validator";

const TEST_ORIGIN = "https://example.com";

describe("fetch-validator", () => {
	describe("validateFetchUrl", () => {
		describe("GitHub raw URLs (allowed)", () => {
			it("allows raw.githubusercontent.com URLs", () => {
				const result = validateFetchUrl(
					"https://raw.githubusercontent.com/user/repo/main/README.md",
					TEST_ORIGIN,
				);
				expect(result.allowed).toBe(true);
			});

			it("allows gist.githubusercontent.com URLs", () => {
				const result = validateFetchUrl(
					"https://gist.githubusercontent.com/user/abc123/raw/file.md",
					TEST_ORIGIN,
				);
				expect(result.allowed).toBe(true);
			});

			it("allows GitHub raw URLs with complex paths", () => {
				const result = validateFetchUrl(
					"https://raw.githubusercontent.com/org/repo/feature/branch/docs/guide.md",
					TEST_ORIGIN,
				);
				expect(result.allowed).toBe(true);
			});

			it("allows GitHub raw URLs with query parameters", () => {
				const result = validateFetchUrl(
					"https://raw.githubusercontent.com/user/repo/main/file.md?token=abc",
					TEST_ORIGIN,
				);
				expect(result.allowed).toBe(true);
			});
		});

		describe("same-origin URLs (allowed)", () => {
			it("allows relative paths", () => {
				const result = validateFetchUrl("/docs/readme.md", TEST_ORIGIN);
				expect(result.allowed).toBe(true);
			});

			it("allows root-relative paths", () => {
				const result = validateFetchUrl("/api/content", TEST_ORIGIN);
				expect(result.allowed).toBe(true);
			});

			it("allows current directory paths", () => {
				const result = validateFetchUrl("./readme.md", TEST_ORIGIN);
				expect(result.allowed).toBe(true);
			});

			it("allows implicit relative paths", () => {
				const result = validateFetchUrl("docs/readme.md", TEST_ORIGIN);
				expect(result.allowed).toBe(true);
			});

			it("allows same-origin absolute URLs", () => {
				const result = validateFetchUrl("https://example.com/docs/readme.md", TEST_ORIGIN);
				expect(result.allowed).toBe(true);
			});

			it("allows same-origin URLs with query strings", () => {
				const result = validateFetchUrl("/api/content?id=123&format=md", TEST_ORIGIN);
				expect(result.allowed).toBe(true);
			});
		});

		describe("external domains (blocked)", () => {
			it("blocks arbitrary external HTTPS URLs", () => {
				const result = validateFetchUrl("https://evil-site.com/malicious.md", TEST_ORIGIN);
				expect(result.allowed).toBe(false);
				if (!result.allowed) {
					expect(result.reason).toContain("Domain not allowed");
				}
			});

			it("blocks other GitHub domains (not raw)", () => {
				const result = validateFetchUrl(
					"https://github.com/user/repo/blob/main/file.md",
					TEST_ORIGIN,
				);
				expect(result.allowed).toBe(false);
			});

			it("blocks CDN domains", () => {
				const result = validateFetchUrl(
					"https://cdn.jsdelivr.net/npm/package/file.md",
					TEST_ORIGIN,
				);
				expect(result.allowed).toBe(false);
			});

			it("blocks internal/private network addresses", () => {
				const internalUrls = [
					"https://192.168.1.1/secret.md",
					"https://10.0.0.1/internal.md",
					"https://localhost:8080/file.md",
					"https://127.0.0.1/file.md",
				];

				for (const url of internalUrls) {
					const result = validateFetchUrl(url, TEST_ORIGIN);
					expect(result.allowed).toBe(false);
				}
			});

			it("blocks protocol-relative URLs to external domains", () => {
				const result = validateFetchUrl("//evil-site.com/file.md", TEST_ORIGIN);
				expect(result.allowed).toBe(false);
			});
		});

		describe("path traversal (blocked)", () => {
			it("blocks ../ path traversal", () => {
				const result = validateFetchUrl("/docs/../../../etc/passwd", TEST_ORIGIN);
				expect(result.allowed).toBe(false);
				if (!result.allowed) {
					expect(result.reason).toContain("Path traversal");
				}
			});

			it("blocks URL-encoded ..%2f traversal", () => {
				const result = validateFetchUrl("/docs/..%2f..%2fetc/passwd", TEST_ORIGIN);
				expect(result.allowed).toBe(false);
			});

			it("blocks URL-encoded ..%2F traversal (uppercase)", () => {
				const result = validateFetchUrl("/docs/..%2F..%2Fetc/passwd", TEST_ORIGIN);
				expect(result.allowed).toBe(false);
			});

			it("blocks backslash traversal ..\\", () => {
				const result = validateFetchUrl("/docs/..\\..\\etc\\passwd", TEST_ORIGIN);
				expect(result.allowed).toBe(false);
			});

			it("blocks encoded backslash ..%5c traversal", () => {
				const result = validateFetchUrl("/docs/..%5c..%5cetc%5cpasswd", TEST_ORIGIN);
				expect(result.allowed).toBe(false);
			});

			it("blocks path traversal in GitHub URLs", () => {
				const result = validateFetchUrl(
					"https://raw.githubusercontent.com/user/repo/../../../etc/passwd",
					TEST_ORIGIN,
				);
				expect(result.allowed).toBe(false);
			});

			it("blocks path traversal in query strings", () => {
				const result = validateFetchUrl("/api?file=../../../etc/passwd", TEST_ORIGIN);
				expect(result.allowed).toBe(false);
			});
		});

		describe("dangerous protocols (blocked)", () => {
			it("blocks javascript: protocol", () => {
				const result = validateFetchUrl("javascript:alert(1)", TEST_ORIGIN);
				expect(result.allowed).toBe(false);
				if (!result.allowed) {
					expect(result.reason).toContain("Protocol not allowed");
				}
			});

			it("blocks data: protocol", () => {
				const result = validateFetchUrl("data:text/html,<script>alert(1)</script>", TEST_ORIGIN);
				expect(result.allowed).toBe(false);
			});

			it("blocks file: protocol", () => {
				const result = validateFetchUrl("file:///etc/passwd", TEST_ORIGIN);
				expect(result.allowed).toBe(false);
			});

			it("blocks ftp: protocol", () => {
				const result = validateFetchUrl("ftp://ftp.example.com/file.md", TEST_ORIGIN);
				expect(result.allowed).toBe(false);
			});

			it("blocks http: protocol (non-secure)", () => {
				const result = validateFetchUrl("http://example.com/file.md", TEST_ORIGIN);
				expect(result.allowed).toBe(false);
			});
		});

		describe("invalid inputs (blocked)", () => {
			it("blocks undefined URL", () => {
				const result = validateFetchUrl(undefined, TEST_ORIGIN);
				expect(result.allowed).toBe(false);
			});

			it("blocks empty string", () => {
				const result = validateFetchUrl("", TEST_ORIGIN);
				expect(result.allowed).toBe(false);
			});

			it("blocks whitespace-only string", () => {
				const result = validateFetchUrl("   ", TEST_ORIGIN);
				expect(result.allowed).toBe(false);
			});

			it("handles malformed URLs gracefully", () => {
				const result = validateFetchUrl("https://[invalid", TEST_ORIGIN);
				expect(result.allowed).toBe(false);
			});
		});

		describe("edge cases", () => {
			it("handles URLs with fragments", () => {
				const result = validateFetchUrl("/docs/readme.md#section", TEST_ORIGIN);
				expect(result.allowed).toBe(true);
			});

			it("handles URLs with special characters", () => {
				const result = validateFetchUrl("/docs/file%20with%20spaces.md", TEST_ORIGIN);
				expect(result.allowed).toBe(true);
			});

			it("is case-insensitive for protocols", () => {
				const result = validateFetchUrl(
					"HTTPS://raw.githubusercontent.com/user/repo/main/file.md",
					TEST_ORIGIN,
				);
				expect(result.allowed).toBe(true);
			});

			it("handles localhost origin during development", () => {
				const devOrigin = "http://localhost:3000";
				const result = validateFetchUrl("/docs/readme.md", devOrigin);
				expect(result.allowed).toBe(true);
			});

			it("treats different ports as different origins", () => {
				const result = validateFetchUrl("https://example.com:8080/file.md", "https://example.com");
				expect(result.allowed).toBe(false);
			});
		});
	});

	describe("isFetchAllowed", () => {
		it("returns true for allowed URLs", () => {
			expect(isFetchAllowed("/docs/readme.md", TEST_ORIGIN)).toBe(true);
			expect(
				isFetchAllowed("https://raw.githubusercontent.com/user/repo/main/file.md", TEST_ORIGIN),
			).toBe(true);
		});

		it("returns false for blocked URLs", () => {
			expect(isFetchAllowed("https://evil-site.com/file.md", TEST_ORIGIN)).toBe(false);
			expect(isFetchAllowed("/docs/../../../etc/passwd", TEST_ORIGIN)).toBe(false);
		});
	});
});
