import { createClient, type RedisClientType } from "redis";

const WINDOW_SECONDS = 60 * 60; // 1 hour in seconds
const MAX_REQUESTS = 3;
const KEY_PREFIX = "ratelimit:contact:";

export interface RateLimitResult {
	allowed: boolean;
	remaining: number;
	resetAt: number;
}

let redisClient: RedisClientType | null = null;
let connectionPromise: Promise<RedisClientType> | null = null;

/**
 * Get or create a Redis client connection.
 * Uses lazy initialization and connection pooling.
 */
async function getRedisClient(): Promise<RedisClientType> {
	if (redisClient?.isOpen) {
		return redisClient;
	}

	if (connectionPromise) {
		return connectionPromise;
	}

	const redisUrl = process.env.REDIS_URL;
	if (!redisUrl) {
		throw new Error("REDIS_URL environment variable is not configured");
	}

	connectionPromise = (async () => {
		redisClient = createClient({ url: redisUrl });

		redisClient.on("error", (err) => {
			if (process.env.NODE_ENV === "development") {
				console.warn("[RateLimiter] Redis client error:", err);
			}
		});

		await redisClient.connect();
		return redisClient;
	})();

	return connectionPromise;
}

/**
 * Check rate limit for a given identifier using Redis.
 * Uses atomic INCR + EXPIRE to prevent race conditions.
 * Falls open (allows request) if Redis is unavailable.
 */
export async function checkRateLimit(identifier: string): Promise<RateLimitResult> {
	const key = `${KEY_PREFIX}${identifier}`;
	const now = Math.floor(Date.now() / 1000);

	try {
		const client = await getRedisClient();

		// Atomic increment - creates key with value 1 if it doesn't exist
		const count = await client.incr(key);

		// Set expiry only on first request (when count is 1)
		// This ensures the window doesn't reset on subsequent requests
		if (count === 1) {
			await client.expire(key, WINDOW_SECONDS);
		}

		// Get TTL to calculate reset time
		const ttl = await client.ttl(key);
		const resetAt = (now + (ttl > 0 ? ttl : WINDOW_SECONDS)) * 1000;

		if (count > MAX_REQUESTS) {
			return {
				allowed: false,
				remaining: 0,
				resetAt,
			};
		}

		return {
			allowed: true,
			remaining: MAX_REQUESTS - count,
			resetAt,
		};
	} catch (error) {
		// Fail-open: allow request if Redis is unavailable
		// Log warning in development for debugging
		if (process.env.NODE_ENV === "development") {
			console.warn("[RateLimiter] Redis unavailable, failing open:", error);
		}

		// Reset connection state on error
		connectionPromise = null;

		return {
			allowed: true,
			remaining: MAX_REQUESTS - 1,
			resetAt: (now + WINDOW_SECONDS) * 1000,
		};
	}
}

/**
 * Reset rate limit for a specific identifier.
 * Useful for testing or administrative override.
 */
export async function resetRateLimit(identifier: string): Promise<void> {
	const key = `${KEY_PREFIX}${identifier}`;
	try {
		const client = await getRedisClient();
		await client.del(key);
	} catch {
		// Silently fail - reset is best-effort
	}
}

/**
 * Get current rate limit status without incrementing.
 * Useful for displaying remaining requests to users.
 */
export async function getRateLimitStatus(identifier: string): Promise<RateLimitResult | null> {
	const key = `${KEY_PREFIX}${identifier}`;
	const now = Math.floor(Date.now() / 1000);

	try {
		const client = await getRedisClient();
		const countStr = await client.get(key);

		if (countStr === null) {
			return null;
		}

		const count = Number.parseInt(countStr, 10);
		const ttl = await client.ttl(key);
		const resetAt = (now + (ttl > 0 ? ttl : WINDOW_SECONDS)) * 1000;

		return {
			allowed: count < MAX_REQUESTS,
			remaining: Math.max(0, MAX_REQUESTS - count),
			resetAt,
		};
	} catch {
		return null;
	}
}
