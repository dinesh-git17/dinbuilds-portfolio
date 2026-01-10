/**
 * HTML Sanitization Module
 *
 * Provides defense-in-depth HTML sanitization for user-supplied content
 * in email templates. Uses sanitize-html for battle-tested protection
 * against XSS and HTML injection attacks.
 */

import sanitizeHtml from "sanitize-html";

/**
 * Strict sanitization options that strip ALL HTML tags.
 * Used for user content that should appear as plain text in emails.
 */
const STRICT_OPTIONS: sanitizeHtml.IOptions = {
	allowedTags: [],
	allowedAttributes: {},
	disallowedTagsMode: "discard",
};

/**
 * Sanitizes user input for safe inclusion in HTML email templates.
 *
 * This function provides defense-in-depth protection:
 * 1. Strips ALL HTML tags (no user markup allowed)
 * 2. Recursively escapes any nested tag attempts
 * 3. Encodes HTML entities to prevent injection
 *
 * @param input - The user-supplied string to sanitize
 * @returns Sanitized string safe for HTML context
 */
export function sanitizeForEmail(input: string): string {
	if (!input || typeof input !== "string") {
		return "";
	}

	return sanitizeHtml(input, STRICT_OPTIONS);
}

/**
 * Detects potentially malicious content in user input.
 * Useful for logging or additional security measures.
 *
 * @param input - The user-supplied string to check
 * @returns True if suspicious patterns are detected
 */
export function containsSuspiciousContent(input: string): boolean {
	if (!input || typeof input !== "string") {
		return false;
	}

	const suspiciousPatterns = [
		/<script\b/i,
		/<iframe\b/i,
		/<object\b/i,
		/<embed\b/i,
		/<form\b/i,
		/javascript:/i,
		/vbscript:/i,
		/data:text\/html/i,
		/on\w+\s*=/i, // Event handlers like onclick=, onerror=
	];

	return suspiciousPatterns.some((pattern) => pattern.test(input));
}
