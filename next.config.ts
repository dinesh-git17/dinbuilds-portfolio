import type { NextConfig } from "next";

/**
 * Next.js configuration.
 *
 * Security headers (CSP, X-Frame-Options, etc.) are handled by middleware.ts
 * to enable nonce-based CSP for inline scripts.
 */
const nextConfig: NextConfig = {
	experimental: {
		optimizePackageImports: ["framer-motion"],
	},
};

export default nextConfig;
