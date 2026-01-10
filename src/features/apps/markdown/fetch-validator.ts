/**
 * Fetch URL Validator Module
 *
 * Validates fetch URLs against a strict allowlist to prevent SSRF attacks.
 * Only allows fetching from trusted origins (GitHub raw content, same-origin).
 *
 * Allowlist:
 * - raw.githubusercontent.com (GitHub raw file content)
 * - gist.githubusercontent.com (GitHub Gist raw content)
 * - Same-origin (relative paths, current domain)
 */

/**
 * Trusted external domains for fetching markdown content.
 */
const ALLOWED_EXTERNAL_HOSTS = ["raw.githubusercontent.com", "gist.githubusercontent.com"] as const;

/**
 * Patterns that indicate path traversal attempts.
 */
const PATH_TRAVERSAL_PATTERNS = [
	/\.\.\//, // ../
	/\.\.%2[fF]/, // ..%2f or ..%2F (URL encoded)
	/\.\.%5[cC]/, // ..%5c or ..%5C (backslash encoded)
	/\.\.\\/, // ..\
] as const;

export type FetchValidationResult =
	| { allowed: true; url: string }
	| { allowed: false; reason: string };

/**
 * Validates whether a URL is safe to fetch.
 *
 * @param url - The URL to validate
 * @param currentOrigin - The current page origin (window.location.origin)
 * @returns Validation result with normalized URL if allowed, or rejection reason
 */
export function validateFetchUrl(
	url: string | undefined,
	currentOrigin: string,
): FetchValidationResult {
	if (!url || typeof url !== "string") {
		return { allowed: false, reason: "No URL provided" };
	}

	const trimmedUrl = url.trim();

	if (trimmedUrl === "") {
		return { allowed: false, reason: "Empty URL" };
	}

	// Check for path traversal attempts before any processing
	if (containsPathTraversal(trimmedUrl)) {
		return { allowed: false, reason: "Path traversal detected" };
	}

	// Check for dangerous protocols
	const protocolCheck = checkDangerousProtocol(trimmedUrl);
	if (!protocolCheck.allowed) {
		return protocolCheck;
	}

	// Handle relative URLs (same-origin by definition)
	if (isRelativeUrl(trimmedUrl)) {
		return { allowed: true, url: trimmedUrl };
	}

	// Parse and validate absolute URLs
	return validateAbsoluteUrl(trimmedUrl, currentOrigin);
}

/**
 * Checks if URL contains path traversal patterns.
 */
function containsPathTraversal(url: string): boolean {
	return PATH_TRAVERSAL_PATTERNS.some((pattern) => pattern.test(url));
}

/**
 * Checks for dangerous protocols that should never be allowed.
 */
function checkDangerousProtocol(url: string): FetchValidationResult {
	const lowerUrl = url.toLowerCase();

	const dangerousProtocols = ["javascript:", "vbscript:", "data:", "file:", "ftp:"];

	for (const protocol of dangerousProtocols) {
		if (lowerUrl.startsWith(protocol)) {
			return {
				allowed: false,
				reason: `Protocol not allowed: ${protocol}`,
			};
		}
	}

	return { allowed: true, url };
}

/**
 * Checks if the URL is relative (same-origin).
 */
function isRelativeUrl(url: string): boolean {
	// Protocol-relative URLs are NOT relative (they specify a host)
	if (url.startsWith("//")) {
		return false;
	}

	// Check for absolute URL patterns (has protocol)
	const absoluteUrlPattern = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;
	return !absoluteUrlPattern.test(url);
}

/**
 * Validates an absolute URL against the allowlist.
 */
function validateAbsoluteUrl(url: string, currentOrigin: string): FetchValidationResult {
	let parsedUrl: URL;

	try {
		// Handle protocol-relative URLs
		if (url.startsWith("//")) {
			parsedUrl = new URL(`https:${url}`);
		} else {
			parsedUrl = new URL(url);
		}
	} catch {
		return { allowed: false, reason: "Invalid URL format" };
	}

	// Block non-HTTPS protocols
	if (parsedUrl.protocol !== "https:") {
		return {
			allowed: false,
			reason: `Protocol not allowed: ${parsedUrl.protocol}`,
		};
	}

	// Check path traversal in parsed URL (after normalization)
	if (containsPathTraversal(parsedUrl.pathname)) {
		return { allowed: false, reason: "Path traversal detected" };
	}

	// Allow same-origin
	if (parsedUrl.origin === currentOrigin) {
		return { allowed: true, url: parsedUrl.href };
	}

	// Check against allowed external hosts
	if (
		ALLOWED_EXTERNAL_HOSTS.includes(parsedUrl.hostname as (typeof ALLOWED_EXTERNAL_HOSTS)[number])
	) {
		return { allowed: true, url: parsedUrl.href };
	}

	// Not in allowlist
	return {
		allowed: false,
		reason: `Domain not allowed: ${parsedUrl.hostname}`,
	};
}

/**
 * Convenience function to check if a fetch URL is allowed.
 */
export function isFetchAllowed(url: string | undefined, currentOrigin: string): boolean {
	return validateFetchUrl(url, currentOrigin).allowed;
}

/**
 * Logs blocked fetch attempts in development mode.
 */
export function logBlockedFetch(url: string, reason: string): void {
	if (process.env.NODE_ENV === "development") {
		console.warn(`[FetchValidator] Blocked fetch attempt: ${url}\nReason: ${reason}`);
	}
}
