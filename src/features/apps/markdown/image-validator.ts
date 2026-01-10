/**
 * Image Source Validator Module
 *
 * Validates image sources in markdown content to prevent:
 * - Loading of external tracking pixels
 * - IP address leakage to untrusted third-party servers
 * - Mixed content (HTTP images on HTTPS pages)
 *
 * Allowed sources:
 * - Same-origin (relative paths, absolute paths on current domain)
 * - Data URIs (data:image/*)
 */

export type ImageValidationResult = { allowed: true } | { allowed: false; reason: string };

/**
 * Validates whether an image source is safe to load.
 *
 * @param src - The image source URL to validate
 * @param currentOrigin - The current page origin (window.location.origin)
 * @returns Validation result with reason if blocked
 */
export function validateImageSource(
	src: string | undefined,
	currentOrigin: string,
): ImageValidationResult {
	if (!src || typeof src !== "string") {
		return { allowed: false, reason: "No image source provided" };
	}

	const trimmedSrc = src.trim();

	if (trimmedSrc === "") {
		return { allowed: false, reason: "Empty image source" };
	}

	// Allow data URIs for base64 embedded images
	if (isDataUri(trimmedSrc)) {
		return validateDataUri(trimmedSrc);
	}

	// Check for dangerous protocols
	const protocolCheck = checkDangerousProtocol(trimmedSrc);
	if (!protocolCheck.allowed) {
		return protocolCheck;
	}

	// Allow relative paths (same-origin by definition)
	if (isRelativePath(trimmedSrc)) {
		return { allowed: true };
	}

	// For absolute URLs, validate origin and protocol
	return validateAbsoluteUrl(trimmedSrc, currentOrigin);
}

/**
 * Checks if the source is a data URI.
 */
function isDataUri(src: string): boolean {
	return src.toLowerCase().startsWith("data:");
}

/**
 * Validates a data URI - only allows image/* MIME types.
 */
function validateDataUri(src: string): ImageValidationResult {
	const dataUriPattern = /^data:image\/[a-zA-Z0-9.+-]+(?:;[a-zA-Z0-9=]+)*(?:;base64)?,/i;

	if (dataUriPattern.test(src)) {
		return { allowed: true };
	}

	return {
		allowed: false,
		reason: "Data URI must be an image type (data:image/*)",
	};
}

/**
 * Checks for dangerous protocols that should never be allowed.
 */
function checkDangerousProtocol(src: string): ImageValidationResult {
	const lowerSrc = src.toLowerCase();

	const dangerousProtocols = ["javascript:", "vbscript:", "data:text/html", "data:application/"];

	for (const protocol of dangerousProtocols) {
		if (lowerSrc.startsWith(protocol)) {
			return {
				allowed: false,
				reason: `Dangerous protocol not allowed: ${protocol}`,
			};
		}
	}

	return { allowed: true };
}

/**
 * Checks if the source is a relative path.
 */
function isRelativePath(src: string): boolean {
	// Relative paths start with:
	// - "./" (current directory)
	// - "../" (parent directory)
	// - "/" (root-relative)
	// - alphanumeric (implicit relative)

	// But NOT protocol-relative URLs starting with "//"
	if (src.startsWith("//")) {
		return false;
	}

	// Check for absolute URL patterns
	const absoluteUrlPattern = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;
	return !absoluteUrlPattern.test(src);
}

/**
 * Validates an absolute URL for same-origin and HTTPS.
 */
function validateAbsoluteUrl(src: string, currentOrigin: string): ImageValidationResult {
	let url: URL;

	try {
		// Handle protocol-relative URLs
		if (src.startsWith("//")) {
			url = new URL(`https:${src}`);
		} else {
			url = new URL(src);
		}
	} catch {
		// If URL parsing fails, treat as invalid
		return {
			allowed: false,
			reason: "Invalid URL format",
		};
	}

	// Block HTTP (non-secure) URLs to prevent mixed content
	if (url.protocol === "http:") {
		return {
			allowed: false,
			reason: "HTTP images blocked (use HTTPS)",
		};
	}

	// Only allow HTTPS
	if (url.protocol !== "https:") {
		return {
			allowed: false,
			reason: `Protocol not allowed: ${url.protocol}`,
		};
	}

	// Check if the URL is same-origin
	if (url.origin === currentOrigin) {
		return { allowed: true };
	}

	// External domain - blocked
	return {
		allowed: false,
		reason: "External images are not allowed",
	};
}

/**
 * Convenience function to check if an image is allowed.
 */
export function isImageAllowed(src: string | undefined, currentOrigin: string): boolean {
	return validateImageSource(src, currentOrigin).allowed;
}
