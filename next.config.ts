import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/**
 * Content Security Policy directives.
 * Restricts sources of executable content to mitigate XSS attacks.
 *
 * Development mode is more permissive to allow Next.js hot reload.
 * Production mode enforces strict CSP.
 */
const allowedFrameSources = "'self' https://dineshd.dev https://*.dineshd.dev https://*.vercel.app";

const cspDirectives = isDev
	? [
			"default-src 'self'",
			"script-src 'self' 'unsafe-inline' 'unsafe-eval'",
			"style-src 'self' 'unsafe-inline'",
			"img-src 'self' data: blob:",
			"font-src 'self'",
			`frame-src ${allowedFrameSources}`,
			"connect-src 'self' https://api.open-meteo.com ws://localhost:* http://localhost:*",
		].join("; ")
	: [
			"default-src 'self'",
			"script-src 'self' https://va.vercel-scripts.com",
			"style-src 'self' 'unsafe-inline'",
			"img-src 'self' data:",
			"font-src 'self'",
			`frame-src ${allowedFrameSources}`,
			"frame-ancestors 'none'",
			"connect-src 'self' https://api.open-meteo.com",
		].join("; ");

/**
 * Security headers applied to all routes.
 * Implements defense-in-depth against common web vulnerabilities.
 */
const securityHeaders = [
	{
		key: "Content-Security-Policy",
		value: cspDirectives,
	},
	{
		key: "X-Content-Type-Options",
		value: "nosniff",
	},
	{
		key: "X-Frame-Options",
		value: "DENY",
	},
	{
		key: "Referrer-Policy",
		value: "strict-origin-when-cross-origin",
	},
	{
		key: "Permissions-Policy",
		value: "camera=(), microphone=(), geolocation=()",
	},
];

const nextConfig: NextConfig = {
	experimental: {
		optimizePackageImports: ["framer-motion"],
	},
	async headers() {
		return [
			{
				// Apply security headers to all routes
				source: "/:path*",
				headers: securityHeaders,
			},
		];
	},
};

export default nextConfig;
