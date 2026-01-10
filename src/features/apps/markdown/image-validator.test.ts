import { describe, expect, it } from "vitest";
import { isImageAllowed, validateImageSource } from "./image-validator";

const TEST_ORIGIN = "https://example.com";

describe("image-validator", () => {
	describe("validateImageSource", () => {
		describe("same-origin images (allowed)", () => {
			it("allows relative paths", () => {
				const result = validateImageSource("images/photo.jpg", TEST_ORIGIN);
				expect(result.allowed).toBe(true);
			});

			it("allows root-relative paths", () => {
				const result = validateImageSource("/images/photo.jpg", TEST_ORIGIN);
				expect(result.allowed).toBe(true);
			});

			it("allows current directory paths", () => {
				const result = validateImageSource("./photo.jpg", TEST_ORIGIN);
				expect(result.allowed).toBe(true);
			});

			it("allows parent directory paths", () => {
				const result = validateImageSource("../images/photo.jpg", TEST_ORIGIN);
				expect(result.allowed).toBe(true);
			});

			it("allows same-origin absolute URLs", () => {
				const result = validateImageSource("https://example.com/images/photo.jpg", TEST_ORIGIN);
				expect(result.allowed).toBe(true);
			});

			it("allows same-origin URLs with port", () => {
				const originWithPort = "https://example.com:3000";
				const result = validateImageSource(
					"https://example.com:3000/images/photo.jpg",
					originWithPort,
				);
				expect(result.allowed).toBe(true);
			});
		});

		describe("data URIs (allowed)", () => {
			it("allows base64 PNG data URIs", () => {
				const dataUri =
					"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
				const result = validateImageSource(dataUri, TEST_ORIGIN);
				expect(result.allowed).toBe(true);
			});

			it("allows base64 JPEG data URIs", () => {
				const dataUri = "data:image/jpeg;base64,/9j/4AAQSkZJRg==";
				const result = validateImageSource(dataUri, TEST_ORIGIN);
				expect(result.allowed).toBe(true);
			});

			it("allows base64 GIF data URIs", () => {
				const dataUri =
					"data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==";
				const result = validateImageSource(dataUri, TEST_ORIGIN);
				expect(result.allowed).toBe(true);
			});

			it("allows base64 WebP data URIs", () => {
				const dataUri =
					"data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=";
				const result = validateImageSource(dataUri, TEST_ORIGIN);
				expect(result.allowed).toBe(true);
			});

			it("allows base64 SVG data URIs", () => {
				const dataUri =
					"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciLz4=";
				const result = validateImageSource(dataUri, TEST_ORIGIN);
				expect(result.allowed).toBe(true);
			});

			it("allows non-base64 data URIs", () => {
				const dataUri = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E";
				const result = validateImageSource(dataUri, TEST_ORIGIN);
				expect(result.allowed).toBe(true);
			});

			it("is case-insensitive for data URI prefix", () => {
				const dataUri = "DATA:IMAGE/PNG;base64,iVBORw0KGgo=";
				const result = validateImageSource(dataUri, TEST_ORIGIN);
				expect(result.allowed).toBe(true);
			});
		});

		describe("external domains (blocked)", () => {
			it("blocks external HTTPS URLs", () => {
				const result = validateImageSource("https://external-site.com/image.jpg", TEST_ORIGIN);
				expect(result.allowed).toBe(false);
				expect(result.allowed === false && result.reason).toContain("External");
			});

			it("blocks external subdomains", () => {
				const result = validateImageSource("https://cdn.external-site.com/image.jpg", TEST_ORIGIN);
				expect(result.allowed).toBe(false);
			});

			it("blocks tracking pixels", () => {
				const result = validateImageSource(
					"https://tracker.analytics.com/pixel.gif?user=123",
					TEST_ORIGIN,
				);
				expect(result.allowed).toBe(false);
			});

			it("blocks protocol-relative URLs to external domains", () => {
				const result = validateImageSource("//external-site.com/image.jpg", TEST_ORIGIN);
				expect(result.allowed).toBe(false);
			});
		});

		describe("HTTP images (blocked)", () => {
			it("blocks HTTP URLs (mixed content)", () => {
				const result = validateImageSource("http://example.com/image.jpg", TEST_ORIGIN);
				expect(result.allowed).toBe(false);
				expect(result.allowed === false && result.reason).toContain("HTTP");
			});

			it("blocks HTTP URLs even for same domain", () => {
				const result = validateImageSource("http://example.com/image.jpg", "https://example.com");
				expect(result.allowed).toBe(false);
			});

			it("blocks HTTP external URLs", () => {
				const result = validateImageSource("http://insecure-site.com/image.jpg", TEST_ORIGIN);
				expect(result.allowed).toBe(false);
			});
		});

		describe("dangerous protocols (blocked)", () => {
			it("blocks javascript: protocol", () => {
				const result = validateImageSource("javascript:alert(1)", TEST_ORIGIN);
				expect(result.allowed).toBe(false);
				expect(result.allowed === false && result.reason).toContain("Dangerous");
			});

			it("blocks vbscript: protocol", () => {
				const result = validateImageSource("vbscript:msgbox(1)", TEST_ORIGIN);
				expect(result.allowed).toBe(false);
			});

			it("blocks data:text/html (XSS vector)", () => {
				const result = validateImageSource("data:text/html,<script>alert(1)</script>", TEST_ORIGIN);
				expect(result.allowed).toBe(false);
			});

			it("blocks data:application/* (non-image)", () => {
				const result = validateImageSource("data:application/javascript,alert(1)", TEST_ORIGIN);
				expect(result.allowed).toBe(false);
			});
		});

		describe("invalid inputs (blocked)", () => {
			it("blocks undefined src", () => {
				const result = validateImageSource(undefined, TEST_ORIGIN);
				expect(result.allowed).toBe(false);
			});

			it("blocks empty string", () => {
				const result = validateImageSource("", TEST_ORIGIN);
				expect(result.allowed).toBe(false);
			});

			it("blocks whitespace-only string", () => {
				const result = validateImageSource("   ", TEST_ORIGIN);
				expect(result.allowed).toBe(false);
			});

			it("handles malformed URLs gracefully", () => {
				const result = validateImageSource("https://[invalid-url", TEST_ORIGIN);
				expect(result.allowed).toBe(false);
			});
		});

		describe("edge cases", () => {
			it("handles URLs with query parameters", () => {
				const result = validateImageSource("/images/photo.jpg?size=large&format=webp", TEST_ORIGIN);
				expect(result.allowed).toBe(true);
			});

			it("handles URLs with fragments", () => {
				const result = validateImageSource("/images/photo.jpg#section", TEST_ORIGIN);
				expect(result.allowed).toBe(true);
			});

			it("handles URLs with encoded characters", () => {
				const result = validateImageSource("/images/photo%20with%20spaces.jpg", TEST_ORIGIN);
				expect(result.allowed).toBe(true);
			});

			it("handles different port as different origin", () => {
				const result = validateImageSource(
					"https://example.com:8080/image.jpg",
					"https://example.com",
				);
				expect(result.allowed).toBe(false);
			});

			it("handles localhost during development", () => {
				const localhostOrigin = "http://localhost:3000";
				const result = validateImageSource("/images/photo.jpg", localhostOrigin);
				expect(result.allowed).toBe(true);
			});
		});
	});

	describe("isImageAllowed", () => {
		it("returns true for allowed images", () => {
			expect(isImageAllowed("/images/photo.jpg", TEST_ORIGIN)).toBe(true);
		});

		it("returns false for blocked images", () => {
			expect(isImageAllowed("https://external.com/image.jpg", TEST_ORIGIN)).toBe(false);
		});
	});
});
