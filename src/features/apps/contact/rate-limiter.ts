const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS = 3;

interface RateLimitEntry {
	count: number;
	resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

function cleanupExpiredEntries(): void {
	const now = Date.now();
	for (const [key, entry] of rateLimitStore) {
		if (entry.resetAt <= now) {
			rateLimitStore.delete(key);
		}
	}
}

export interface RateLimitResult {
	allowed: boolean;
	remaining: number;
	resetAt: number;
}

export function checkRateLimit(identifier: string): RateLimitResult {
	cleanupExpiredEntries();

	const now = Date.now();
	const entry = rateLimitStore.get(identifier);

	if (!entry || entry.resetAt <= now) {
		const resetAt = now + WINDOW_MS;
		rateLimitStore.set(identifier, { count: 1, resetAt });
		return { allowed: true, remaining: MAX_REQUESTS - 1, resetAt };
	}

	if (entry.count >= MAX_REQUESTS) {
		return { allowed: false, remaining: 0, resetAt: entry.resetAt };
	}

	entry.count += 1;
	rateLimitStore.set(identifier, entry);

	return {
		allowed: true,
		remaining: MAX_REQUESTS - entry.count,
		resetAt: entry.resetAt,
	};
}
