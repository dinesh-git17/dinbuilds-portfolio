import { describe, expect, it } from "vitest";
import { extractRightmostIP, isValidIP, resolveClientIP } from "./ip-resolver";

describe("ip-resolver", () => {
	describe("isValidIP", () => {
		describe("IPv4 addresses", () => {
			it("validates standard IPv4 addresses", () => {
				expect(isValidIP("192.168.1.1")).toBe(true);
				expect(isValidIP("10.0.0.1")).toBe(true);
				expect(isValidIP("172.16.0.1")).toBe(true);
				expect(isValidIP("8.8.8.8")).toBe(true);
				expect(isValidIP("255.255.255.255")).toBe(true);
				expect(isValidIP("0.0.0.0")).toBe(true);
			});

			it("rejects invalid IPv4 addresses", () => {
				expect(isValidIP("256.1.1.1")).toBe(false);
				expect(isValidIP("192.168.1")).toBe(false);
				expect(isValidIP("192.168.1.1.1")).toBe(false);
				expect(isValidIP("192.168.1.999")).toBe(false);
				expect(isValidIP("192.168.01.1")).toBe(false); // Leading zeros rejected (octal ambiguity)
				expect(isValidIP("192.168.-1.1")).toBe(false);
			});
		});

		describe("IPv6 addresses", () => {
			it("validates full IPv6 addresses", () => {
				expect(isValidIP("2001:0db8:85a3:0000:0000:8a2e:0370:7334")).toBe(true);
				expect(isValidIP("fe80:0000:0000:0000:0000:0000:0000:0001")).toBe(true);
			});

			it("validates compressed IPv6 addresses", () => {
				expect(isValidIP("2001:db8:85a3::8a2e:370:7334")).toBe(true);
				expect(isValidIP("::1")).toBe(true);
				expect(isValidIP("::")).toBe(true);
				expect(isValidIP("fe80::1")).toBe(true);
				expect(isValidIP("2001:db8::")).toBe(true);
			});

			it("validates IPv4-mapped IPv6 addresses", () => {
				expect(isValidIP("::ffff:192.168.1.1")).toBe(true);
				expect(isValidIP("::ffff:10.0.0.1")).toBe(true);
			});

			it("rejects invalid IPv6 addresses", () => {
				expect(isValidIP("2001:db8:85a3::8a2e:370g:7334")).toBe(false);
				expect(isValidIP("2001:db8:85a3:0000:0000:8a2e:0370:7334:extra")).toBe(false);
			});
		});

		describe("edge cases", () => {
			it("rejects empty and null values", () => {
				expect(isValidIP("")).toBe(false);
				expect(isValidIP(null as unknown as string)).toBe(false);
				expect(isValidIP(undefined as unknown as string)).toBe(false);
			});

			it("rejects non-IP strings", () => {
				expect(isValidIP("localhost")).toBe(false);
				expect(isValidIP("example.com")).toBe(false);
				expect(isValidIP("not-an-ip")).toBe(false);
			});

			it("handles whitespace", () => {
				expect(isValidIP("  192.168.1.1  ")).toBe(true);
				expect(isValidIP("\t10.0.0.1\n")).toBe(true);
			});
		});
	});

	describe("extractRightmostIP", () => {
		it("extracts rightmost IP from comma-separated list", () => {
			expect(extractRightmostIP("203.0.113.50, 198.51.100.178, 192.0.2.1")).toBe("192.0.2.1");
			expect(extractRightmostIP("spoofed-ip, 198.51.100.178")).toBe("198.51.100.178");
		});

		it("handles single IP", () => {
			expect(extractRightmostIP("192.168.1.1")).toBe("192.168.1.1");
		});

		it("handles IPv6 addresses", () => {
			expect(extractRightmostIP("2001:db8::1, 2001:db8::2")).toBe("2001:db8::2");
			expect(extractRightmostIP("::1")).toBe("::1");
		});

		it("skips invalid entries and finds rightmost valid IP", () => {
			expect(extractRightmostIP("192.168.1.1, invalid, not-an-ip")).toBe("192.168.1.1");
			expect(extractRightmostIP("invalid1, invalid2, 10.0.0.1")).toBe("10.0.0.1");
		});

		it("returns null for empty or invalid input", () => {
			expect(extractRightmostIP("")).toBe(null);
			expect(extractRightmostIP("invalid, not-an-ip")).toBe(null);
			expect(extractRightmostIP(null as unknown as string)).toBe(null);
			expect(extractRightmostIP(undefined as unknown as string)).toBe(null);
		});

		it("handles extra whitespace", () => {
			expect(extractRightmostIP("  192.168.1.1  ,  10.0.0.1  ")).toBe("10.0.0.1");
		});
	});

	describe("resolveClientIP", () => {
		function createHeaders(headers: Record<string, string>): Headers {
			return new Headers(headers);
		}

		describe("x-real-ip priority (Vercel edge)", () => {
			it("uses x-real-ip when available", () => {
				const headers = createHeaders({
					"x-real-ip": "192.168.1.100",
					"x-forwarded-for": "10.0.0.1, 172.16.0.1",
				});

				expect(resolveClientIP(headers)).toBe("192.168.1.100");
			});

			it("prioritizes x-real-ip over x-forwarded-for even when both are valid", () => {
				const headers = createHeaders({
					"x-real-ip": "8.8.8.8",
					"x-forwarded-for": "1.1.1.1",
				});

				expect(resolveClientIP(headers)).toBe("8.8.8.8");
			});

			it("handles IPv6 in x-real-ip", () => {
				const headers = createHeaders({
					"x-real-ip": "2001:db8::1",
				});

				expect(resolveClientIP(headers)).toBe("2001:db8::1");
			});
		});

		describe("x-forwarded-for fallback", () => {
			it("uses rightmost x-forwarded-for when x-real-ip is missing", () => {
				const headers = createHeaders({
					"x-forwarded-for": "203.0.113.50, 198.51.100.178, 192.0.2.1",
				});

				expect(resolveClientIP(headers)).toBe("192.0.2.1");
			});

			it("handles single IP in x-forwarded-for", () => {
				const headers = createHeaders({
					"x-forwarded-for": "192.168.1.1",
				});

				expect(resolveClientIP(headers)).toBe("192.168.1.1");
			});

			it("handles IPv6 in x-forwarded-for", () => {
				const headers = createHeaders({
					"x-forwarded-for": "2001:db8::1, 2001:db8::2",
				});

				expect(resolveClientIP(headers)).toBe("2001:db8::2");
			});
		});

		describe("spoofing prevention", () => {
			it("ignores spoofed leftmost IPs in x-forwarded-for", () => {
				// Attacker adds fake IPs to the left of x-forwarded-for
				const headers = createHeaders({
					"x-forwarded-for": "spoofed-ip, another-fake, 192.168.1.1",
				});

				// Should get rightmost valid IP, not the spoofed ones
				expect(resolveClientIP(headers)).toBe("192.168.1.1");
			});

			it("falls back to x-forwarded-for when x-real-ip is invalid", () => {
				const headers = createHeaders({
					"x-real-ip": "not-a-valid-ip",
					"x-forwarded-for": "192.168.1.1",
				});

				expect(resolveClientIP(headers)).toBe("192.168.1.1");
			});

			it("cannot override x-real-ip with x-forwarded-for spoofing", () => {
				// Even if attacker tries to manipulate headers, x-real-ip wins
				const headers = createHeaders({
					"x-real-ip": "10.0.0.1",
					"x-forwarded-for": "malicious.attacker.ip, 192.168.1.1",
				});

				expect(resolveClientIP(headers)).toBe("10.0.0.1");
			});
		});

		describe("fallback behavior", () => {
			it("returns 'unknown' when no headers are present", () => {
				const headers = createHeaders({});

				expect(resolveClientIP(headers)).toBe("unknown");
			});

			it("returns 'unknown' when all headers contain invalid IPs", () => {
				const headers = createHeaders({
					"x-real-ip": "invalid",
					"x-forwarded-for": "also-invalid, not-an-ip",
				});

				expect(resolveClientIP(headers)).toBe("unknown");
			});

			it("returns 'unknown' for empty header values", () => {
				const headers = createHeaders({
					"x-real-ip": "",
					"x-forwarded-for": "",
				});

				expect(resolveClientIP(headers)).toBe("unknown");
			});
		});

		describe("IPv6 handling", () => {
			it("correctly handles full IPv6 addresses", () => {
				const headers = createHeaders({
					"x-real-ip": "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
				});

				expect(resolveClientIP(headers)).toBe("2001:0db8:85a3:0000:0000:8a2e:0370:7334");
			});

			it("correctly handles compressed IPv6 addresses", () => {
				const headers = createHeaders({
					"x-real-ip": "2001:db8::1",
				});

				expect(resolveClientIP(headers)).toBe("2001:db8::1");
			});

			it("correctly handles loopback IPv6", () => {
				const headers = createHeaders({
					"x-real-ip": "::1",
				});

				expect(resolveClientIP(headers)).toBe("::1");
			});

			it("correctly handles IPv4-mapped IPv6 addresses", () => {
				const headers = createHeaders({
					"x-real-ip": "::ffff:192.168.1.1",
				});

				expect(resolveClientIP(headers)).toBe("::ffff:192.168.1.1");
			});

			it("handles mixed IPv4 and IPv6 in x-forwarded-for", () => {
				const headers = createHeaders({
					"x-forwarded-for": "192.168.1.1, 2001:db8::1",
				});

				expect(resolveClientIP(headers)).toBe("2001:db8::1");
			});
		});
	});
});
