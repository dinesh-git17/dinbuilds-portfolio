import { type NextRequest, NextResponse } from "next/server";
import { getLegacyRedirectPath } from "@/lib/seo/path-routing";

const isDev = process.env.NODE_ENV === "development";

/**
 * Builds CSP directives based on environment.
 * Development: permissive for hot reload
 * Production: standard security for portfolio site
 */
function buildCsp(): string {
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
		"script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com",
		"style-src 'self' 'unsafe-inline'",
		"img-src 'self' data:",
		"font-src 'self'",
		`frame-src ${frameSrc}`,
		"frame-ancestors 'self' https://dev.to https://*.dev.to",
		"connect-src 'self' https://api.open-meteo.com",
	].join("; ");
}

/**
 * Security headers applied to all routes.
 */
function buildSecurityHeaders(): Headers {
	const headers = new Headers();

	headers.set("Content-Security-Policy", buildCsp());
	headers.set("X-Content-Type-Options", "nosniff");
	headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
	headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

	return headers;
}

export function middleware(request: NextRequest) {
	const { searchParams, pathname } = request.nextUrl;

	// Handle legacy query parameter URLs — redirect to clean paths
	// Example: /?app=yield → /projects/yield
	// Example: /?app=markdown&file=meridian → /experience/meridian
	const appSlug = searchParams.get("app");
	if (appSlug && pathname === "/") {
		const fileSlug = searchParams.get("file") ?? undefined;
		const redirectPath = getLegacyRedirectPath(appSlug, fileSlug);

		if (redirectPath) {
			const redirectUrl = new URL(redirectPath, request.url);
			return NextResponse.redirect(redirectUrl, 301);
		}
	}

	const securityHeaders = buildSecurityHeaders();
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
