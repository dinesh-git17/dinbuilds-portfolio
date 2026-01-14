/**
 * Next.js configuration.
 *
 * Security headers (CSP, X-Frame-Options, etc.) are handled by middleware.ts
 * to enable nonce-based CSP for inline scripts.
 *
 * @type {import('next').NextConfig}
 */
const nextConfig = {
	experimental: {
		optimizePackageImports: ["framer-motion"],
	},
};

export default nextConfig;
