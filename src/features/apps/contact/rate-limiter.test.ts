import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Use vi.hoisted to ensure mock functions are available before vi.mock runs
const { mockIncr, mockExpire, mockTtl, mockGet, mockDel, mockConnect, mockOn } = vi.hoisted(() => ({
	mockIncr: vi.fn(),
	mockExpire: vi.fn(),
	mockTtl: vi.fn(),
	mockGet: vi.fn(),
	mockDel: vi.fn(),
	mockConnect: vi.fn(),
	mockOn: vi.fn(),
}));

// Mock redis package
vi.mock("redis", () => ({
	createClient: vi.fn(() => ({
		incr: mockIncr,
		expire: mockExpire,
		ttl: mockTtl,
		get: mockGet,
		del: mockDel,
		connect: mockConnect,
		on: mockOn,
		isOpen: true,
	})),
}));

// Set REDIS_URL for tests
vi.stubEnv("REDIS_URL", "redis://localhost:6379");

// Import after mocking
import { checkRateLimit, getRateLimitStatus, resetRateLimit } from "./rate-limiter";

describe("rate-limiter", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockConnect.mockResolvedValue(undefined);
	});

	afterEach(() => {
		vi.resetAllMocks();
		vi.unstubAllEnvs();
		// Re-stub for next test
		vi.stubEnv("REDIS_URL", "redis://localhost:6379");
	});

	describe("checkRateLimit", () => {
		it("allows first request and sets expiry", async () => {
			mockIncr.mockResolvedValue(1);
			mockExpire.mockResolvedValue(true);
			mockTtl.mockResolvedValue(3600);

			const result = await checkRateLimit("192.168.1.1");

			expect(result.allowed).toBe(true);
			expect(result.remaining).toBe(2);
			expect(mockIncr).toHaveBeenCalledWith("ratelimit:contact:192.168.1.1");
			expect(mockExpire).toHaveBeenCalledWith("ratelimit:contact:192.168.1.1", 3600);
		});

		it("allows subsequent requests within limit", async () => {
			mockIncr.mockResolvedValue(2);
			mockTtl.mockResolvedValue(3000);

			const result = await checkRateLimit("192.168.1.1");

			expect(result.allowed).toBe(true);
			expect(result.remaining).toBe(1);
			expect(mockExpire).not.toHaveBeenCalled();
		});

		it("allows third request (at limit)", async () => {
			mockIncr.mockResolvedValue(3);
			mockTtl.mockResolvedValue(2500);

			const result = await checkRateLimit("192.168.1.1");

			expect(result.allowed).toBe(true);
			expect(result.remaining).toBe(0);
		});

		it("blocks requests after limit exceeded", async () => {
			mockIncr.mockResolvedValue(4);
			mockTtl.mockResolvedValue(2000);

			const result = await checkRateLimit("192.168.1.1");

			expect(result.allowed).toBe(false);
			expect(result.remaining).toBe(0);
		});

		it("fails open when Redis is unavailable", async () => {
			mockIncr.mockRejectedValue(new Error("Redis connection failed"));

			const result = await checkRateLimit("192.168.1.1");

			expect(result.allowed).toBe(true);
			expect(result.remaining).toBe(2);
		});

		it("handles different identifiers independently", async () => {
			mockIncr.mockResolvedValue(1);
			mockExpire.mockResolvedValue(true);
			mockTtl.mockResolvedValue(3600);

			await checkRateLimit("192.168.1.1");
			await checkRateLimit("192.168.1.2");

			expect(mockIncr).toHaveBeenCalledWith("ratelimit:contact:192.168.1.1");
			expect(mockIncr).toHaveBeenCalledWith("ratelimit:contact:192.168.1.2");
		});

		it("handles IPv6 addresses", async () => {
			mockIncr.mockResolvedValue(1);
			mockExpire.mockResolvedValue(true);
			mockTtl.mockResolvedValue(3600);

			const result = await checkRateLimit("2001:0db8:85a3:0000:0000:8a2e:0370:7334");

			expect(result.allowed).toBe(true);
			expect(mockIncr).toHaveBeenCalledWith(
				"ratelimit:contact:2001:0db8:85a3:0000:0000:8a2e:0370:7334",
			);
		});

		it("calculates reset time correctly from TTL", async () => {
			const nowSeconds = Math.floor(Date.now() / 1000);
			const ttlRemaining = 1800; // 30 minutes remaining

			mockIncr.mockResolvedValue(1);
			mockExpire.mockResolvedValue(true);
			mockTtl.mockResolvedValue(ttlRemaining);

			const result = await checkRateLimit("192.168.1.1");

			// Reset time should be approximately now + TTL (in milliseconds)
			const expectedResetAt = (nowSeconds + ttlRemaining) * 1000;
			expect(result.resetAt).toBeGreaterThanOrEqual(expectedResetAt - 1000);
			expect(result.resetAt).toBeLessThanOrEqual(expectedResetAt + 1000);
		});
	});

	describe("resetRateLimit", () => {
		it("deletes the rate limit key", async () => {
			mockDel.mockResolvedValue(1);

			await resetRateLimit("192.168.1.1");

			expect(mockDel).toHaveBeenCalledWith("ratelimit:contact:192.168.1.1");
		});

		it("silently handles Redis errors", async () => {
			mockDel.mockRejectedValue(new Error("Redis error"));

			// Should not throw
			await expect(resetRateLimit("192.168.1.1")).resolves.toBeUndefined();
		});
	});

	describe("getRateLimitStatus", () => {
		it("returns null when no rate limit exists", async () => {
			mockGet.mockResolvedValue(null);

			const result = await getRateLimitStatus("192.168.1.1");

			expect(result).toBeNull();
		});

		it("returns current status without incrementing", async () => {
			mockGet.mockResolvedValue("2");
			mockTtl.mockResolvedValue(1800);

			const result = await getRateLimitStatus("192.168.1.1");

			expect(result).not.toBeNull();
			expect(result?.allowed).toBe(true);
			expect(result?.remaining).toBe(1);
			expect(mockIncr).not.toHaveBeenCalled();
		});

		it("returns not allowed when at limit", async () => {
			mockGet.mockResolvedValue("3");
			mockTtl.mockResolvedValue(1800);

			const result = await getRateLimitStatus("192.168.1.1");

			expect(result?.allowed).toBe(false);
			expect(result?.remaining).toBe(0);
		});

		it("returns null on Redis error", async () => {
			mockGet.mockRejectedValue(new Error("Redis error"));

			const result = await getRateLimitStatus("192.168.1.1");

			expect(result).toBeNull();
		});
	});
});
