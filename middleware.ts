import { type NextRequest, NextResponse } from "next/server";

const isDev = process.env.NODE_ENV === "development";

/**
 * Generates a cryptographic nonce for CSP.
 * Uses Web Crypto API (available in Edge Runtime).
 */
function generateNonce(): string {
	const bytes = new Uint8Array(16);
	crypto.getRandomValues(bytes);
	return btoa(String.fromCharCode(...bytes));
}

/**
 * Builds CSP directives based on environment.
 * Development: permissive for hot reload
 * Production: strict with nonce-based script execution
 */
function buildCsp(nonce: string): string {
	const frameSrc = "'self' https://dineshd.dev https://*.dineshd.dev https://*.vercel.app";

	if (isDev) {
		return [
			"default-src 'self'",
			"script-src 'self' 'unsafe-inline' 'unsafe-eval'",
			"style-src 'self' 'unsafe-inline'",
			"img-src 'self' data: blob:",
			"font-src 'self'",
			`frame-src ${frameSrc}`,
			"connect-src 'self' https://api.open-meteo.com ws://localhost:* http://localhost:*",
		].join("; ");
	}

	return [
		"default-src 'self'",
		`script-src 'self' 'unsafe-inline' 'nonce-${nonce}' 'strict-dynamic' https://va.vercel-scripts.com`,
		"style-src 'self' 'unsafe-inline'",
		"img-src 'self' data:",
		"font-src 'self'",
		`frame-src ${frameSrc}`,
		"frame-ancestors 'none'",
		"connect-src 'self' https://api.open-meteo.com",
	].join("; ");
}

/**
 * Security headers applied to all routes.
 * CSP uses nonces for inline scripts instead of 'unsafe-inline'.
 */
function buildSecurityHeaders(nonce: string): Headers {
	const headers = new Headers();

	headers.set("Content-Security-Policy", buildCsp(nonce));
	headers.set("X-Content-Type-Options", "nosniff");
	headers.set("X-Frame-Options", "DENY");
	headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
	headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

	// Pass nonce to the application via custom header
	headers.set("x-nonce", nonce);

	return headers;
}

export function middleware(_request: NextRequest) {
	const nonce = generateNonce();
	const securityHeaders = buildSecurityHeaders(nonce);

	const response = NextResponse.next();

	// Apply security headers to response
	for (const [key, value] of securityHeaders.entries()) {
		response.headers.set(key, value);
	}

	return response;
}

/**
 * Matcher configuration.
 * Apply middleware to all routes except static assets and API routes.
 */
export const config = {
	matcher: [
		/*
		 * Match all request paths except:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico, sitemap.xml, robots.txt (metadata files)
		 * - assets folder (public assets)
		 */
		"/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|assets/).*)",
	],
};
