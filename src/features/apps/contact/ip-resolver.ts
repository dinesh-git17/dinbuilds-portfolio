/**
 * IP Address Resolution Module
 *
 * Implements secure client IP resolution for Vercel deployments.
 * Uses the "rightmost trusted IP" pattern to prevent header spoofing attacks.
 *
 * Trust hierarchy:
 * 1. x-real-ip: Set by Vercel edge, cannot be spoofed by clients
 * 2. x-forwarded-for: Take rightmost IP (closest to our server)
 * 3. Fallback to "unknown" as last resort
 */

const IPV4_REGEX =
	/^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;

const IPV6_REGEX =
	/^(?:(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,7}:|(?:[0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,5}(?::[0-9a-fA-F]{1,4}){1,2}|(?:[0-9a-fA-F]{1,4}:){1,4}(?::[0-9a-fA-F]{1,4}){1,3}|(?:[0-9a-fA-F]{1,4}:){1,3}(?::[0-9a-fA-F]{1,4}){1,4}|(?:[0-9a-fA-F]{1,4}:){1,2}(?::[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:(?::[0-9a-fA-F]{1,4}){1,6}|:(?::[0-9a-fA-F]{1,4}){1,7}|::|::(?:[fF]{4}:)?(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)|(?:[0-9a-fA-F]{1,4}:){1,4}:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d))$/;

/**
 * Validates whether a string is a valid IPv4 or IPv6 address.
 */
export function isValidIP(ip: string): boolean {
	if (!ip || typeof ip !== "string") {
		return false;
	}

	const trimmed = ip.trim();
	return IPV4_REGEX.test(trimmed) || IPV6_REGEX.test(trimmed);
}

/**
 * Extracts the rightmost valid IP from a comma-separated x-forwarded-for header.
 *
 * The rightmost IP is the one added by the closest trusted proxy (Vercel edge),
 * while leftmost IPs can be spoofed by clients.
 */
export function extractRightmostIP(forwardedFor: string): string | null {
	if (!forwardedFor || typeof forwardedFor !== "string") {
		return null;
	}

	const ips = forwardedFor.split(",").map((ip) => ip.trim());

	// Iterate from right to left to find the first valid IP
	for (let i = ips.length - 1; i >= 0; i--) {
		const ip = ips[i];
		if (ip && isValidIP(ip)) {
			return ip;
		}
	}

	return null;
}

/**
 * Resolves the client IP address from request headers.
 *
 * Implementation follows Vercel's recommended pattern:
 * 1. Trust x-real-ip (set by Vercel edge, not spoofable)
 * 2. Fall back to rightmost x-forwarded-for IP
 * 3. Return "unknown" if no valid IP found
 *
 * @param headersList - The Headers object from the request
 * @returns The resolved client IP address or "unknown"
 */
export function resolveClientIP(headersList: Headers): string {
	// Priority 1: x-real-ip (Vercel edge header - most trustworthy)
	const realIP = headersList.get("x-real-ip");
	if (realIP) {
		const trimmed = realIP.trim();
		if (isValidIP(trimmed)) {
			return trimmed;
		}
	}

	// Priority 2: Rightmost IP from x-forwarded-for
	const forwardedFor = headersList.get("x-forwarded-for");
	if (forwardedFor) {
		const rightmostIP = extractRightmostIP(forwardedFor);
		if (rightmostIP) {
			return rightmostIP;
		}
	}

	// Fallback: No valid IP found
	return "unknown";
}
