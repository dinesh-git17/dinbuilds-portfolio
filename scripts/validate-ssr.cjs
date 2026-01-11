#!/usr/bin/env node
/**
 * SSR Content Validation Script — SEO-01 Stories 1 & 3 + SEO-02 Story 2 + Story 4
 *
 * Validates that server-rendered content is present in HTML responses.
 * Also validates schema markup, meta tags, canonical URLs, and crawl files.
 *
 * Validates:
 * - SSR content projection (Story 1)
 * - Person/ProfilePage schema (Story 3)
 * - Open Graph meta tags (Story 3)
 * - Twitter Card meta tags (Story 3)
 * - Entity h1 alignment (Story 3)
 * - Social profile links (Story 3)
 * - Canonical URL tags (Story 2)
 * - Clean path routing (Story 2)
 * - Sitemap.xml structure (Story 4)
 * - Robots.txt syntax (Story 4)
 * - Site Index for crawlers (Story 4)
 *
 * Usage:
 *   1. Build the app: pnpm build
 *   2. Run validation: node scripts/validate-ssr.cjs
 *
 * Exit codes:
 *   0 - All validations passed
 *   1 - One or more validations failed
 */

const http = require("http");
const { spawn } = require("child_process");

// Test configuration
const PORT = 3456;
const BASE_URL = `http://localhost:${PORT}`;
const SERVER_START_TIMEOUT = 30000; // 30 seconds
const REQUEST_TIMEOUT = 10000; // 10 seconds

/**
 * Entity data for validation (must match src/lib/seo/entity.ts).
 */
const ENTITY = {
	name: "Dinesh Dawonauth",
	jobTitle: "Data Engineer",
	socialProfiles: [
		"https://github.com/dinesh-git17",
		"https://www.linkedin.com/in/dineshsdawonauth",
		"https://twitter.com/dinbuilds",
	],
};

/**
 * Test cases for SSR content validation.
 * Each case specifies a URL path and content that must be present in the HTML.
 * Uses clean canonical paths (Story 2).
 * Note: SSR content projection applies to markdown files, not dedicated apps.
 */
const TEST_CASES = [
	{
		name: "iMessage Wrapped Project",
		path: "/projects/imessage-wrapped",
		// The SSR content projection should include data attributes
		requiredContent: ["data-ssr-content", "data-ssr-projected"],
		// Verify the markdown content is rendered
		contentPatterns: [/iMessage/i],
		canonicalPath: "/projects/imessage-wrapped",
	},
	{
		name: "Holiday.exe Project",
		path: "/projects/holiday-exe",
		requiredContent: ["data-ssr-content", "data-ssr-projected"],
		contentPatterns: [/Holiday/i],
		canonicalPath: "/projects/holiday-exe",
	},
	{
		name: "Experience - Meridian",
		path: "/experience/meridian",
		requiredContent: ["data-ssr-content", "data-ssr-projected"],
		contentPatterns: [/Meridian/i],
		canonicalPath: "/experience/meridian",
	},
	{
		name: "Experience - Slice Labs",
		path: "/experience/slice-labs",
		requiredContent: ["data-ssr-content", "data-ssr-projected"],
		contentPatterns: [/Slice/i],
		canonicalPath: "/experience/slice-labs",
	},
];

/**
 * Entity verification test cases (Story 3).
 * Validates schema markup, meta tags, and identity signals.
 */
const ENTITY_TEST_CASES = [
	{
		name: "Homepage Entity Verification",
		path: "/",
		canonicalPath: "/",
		checks: [
			// SSR Entity Card present
			{ type: "content", value: "data-ssr-entity", description: "SSR Entity Card marker" },
			// Entity h1 present
			{ type: "pattern", value: new RegExp(`<h1[^>]*>${ENTITY.name}`, "i"), description: "Entity h1 with name" },
			// Person schema present
			{ type: "pattern", value: /"@type"\s*:\s*"Person"/, description: "Person schema type" },
			{ type: "pattern", value: /"@type"\s*:\s*"ProfilePage"/, description: "ProfilePage schema type" },
			{ type: "content", value: `"name":"${ENTITY.name}"`, description: "Person name in schema" },
			{ type: "content", value: `"jobTitle":"${ENTITY.jobTitle}"`, description: "Job title in schema" },
			// sameAs URLs in schema
			{ type: "content", value: ENTITY.socialProfiles[0], description: "GitHub URL in sameAs" },
			{ type: "content", value: ENTITY.socialProfiles[1], description: "LinkedIn URL in sameAs" },
			// Social links as <a> tags
			{ type: "pattern", value: new RegExp(`<a[^>]*href="${ENTITY.socialProfiles[0]}"`, "i"), description: "GitHub link anchor" },
			{ type: "pattern", value: new RegExp(`<a[^>]*href="${ENTITY.socialProfiles[1]}"`, "i"), description: "LinkedIn link anchor" },
			// Open Graph meta tags
			{ type: "pattern", value: /<meta[^>]*property="og:title"[^>]*content="[^"]+"/i, description: "og:title meta tag" },
			{ type: "pattern", value: /<meta[^>]*property="og:description"[^>]*content="[^"]+"/i, description: "og:description meta tag" },
			{ type: "pattern", value: /<meta[^>]*property="og:image"[^>]*content="[^"]+"/i, description: "og:image meta tag" },
			{ type: "pattern", value: /<meta[^>]*property="og:url"[^>]*content="[^"]+"/i, description: "og:url meta tag" },
			{ type: "pattern", value: /<meta[^>]*property="og:type"[^>]*content="[^"]+"/i, description: "og:type meta tag" },
			// Twitter Card meta tags
			{ type: "pattern", value: /<meta[^>]*name="twitter:card"[^>]*content="[^"]+"/i, description: "twitter:card meta tag" },
			{ type: "pattern", value: /<meta[^>]*name="twitter:title"[^>]*content="[^"]+"/i, description: "twitter:title meta tag" },
			{ type: "pattern", value: /<meta[^>]*name="twitter:description"[^>]*content="[^"]+"/i, description: "twitter:description meta tag" },
			// Title alignment with entity name
			{ type: "pattern", value: new RegExp(`<title[^>]*>${ENTITY.name}`, "i"), description: "Title contains entity name" },
		],
	},
	{
		name: "Project Page Meta Tags",
		path: "/projects/imessage-wrapped",
		canonicalPath: "/projects/imessage-wrapped",
		checks: [
			// Unique title for project
			{ type: "pattern", value: /<title[^>]*>iMessage/i, description: "Project-specific title" },
			// OG tags present
			{ type: "pattern", value: /<meta[^>]*property="og:title"[^>]*content="[^"]+"/i, description: "og:title meta tag" },
			{ type: "pattern", value: /<meta[^>]*property="og:description"[^>]*content="[^"]+"/i, description: "og:description meta tag" },
			// CreativeWork schema for project
			{ type: "pattern", value: /"@type"\s*:\s*"CreativeWork"/, description: "CreativeWork schema type" },
		],
	},
];

/**
 * Canonical URL validation test cases (Story 2).
 * Validates that clean paths have correct canonical tags.
 */
const CANONICAL_TEST_CASES = [
	{ name: "Homepage", path: "/", canonicalPath: "/" },
	{ name: "About Page", path: "/about", canonicalPath: "/about" },
	{ name: "Contact Page", path: "/contact", canonicalPath: "/contact" },
	{ name: "FAQ Page", path: "/faq", canonicalPath: "/faq" },
	{ name: "Resume Page", path: "/resume", canonicalPath: "/resume" },
	{ name: "Projects Folder", path: "/projects", canonicalPath: "/projects" },
	{ name: "Experience Folder", path: "/experience", canonicalPath: "/experience" },
	{ name: "Yield App", path: "/projects/yield", canonicalPath: "/projects/yield" },
	{ name: "Debate App", path: "/projects/debate", canonicalPath: "/projects/debate" },
	{ name: "PassFX App", path: "/projects/passfx", canonicalPath: "/projects/passfx" },
];

/**
 * Legacy redirect test cases (Story 2).
 * Validates that legacy query param URLs redirect to canonical paths.
 */
const LEGACY_REDIRECT_TEST_CASES = [
	{ name: "Legacy About", legacyPath: "/?app=about", expectedRedirect: "/about" },
	{ name: "Legacy Contact", legacyPath: "/?app=contact", expectedRedirect: "/contact" },
	{ name: "Legacy FAQ", legacyPath: "/?app=faq", expectedRedirect: "/faq" },
	{ name: "Legacy Resume", legacyPath: "/?app=resume", expectedRedirect: "/resume" },
	{ name: "Legacy Yield App", legacyPath: "/?app=yield", expectedRedirect: "/projects/yield" },
	{ name: "Legacy Debate App", legacyPath: "/?app=debate", expectedRedirect: "/projects/debate" },
	{ name: "Legacy PassFX App", legacyPath: "/?app=passfx", expectedRedirect: "/projects/passfx" },
	{ name: "Legacy Projects Folder", legacyPath: "/?app=projects", expectedRedirect: "/projects" },
	{ name: "Legacy Experience Folder", legacyPath: "/?app=experience", expectedRedirect: "/experience" },
	{ name: "Legacy Folder-Projects", legacyPath: "/?app=folder-projects", expectedRedirect: "/projects" },
	{ name: "Legacy Folder-Experience", legacyPath: "/?app=folder-experience", expectedRedirect: "/experience" },
	{ name: "Legacy Meridian Markdown", legacyPath: "/?app=markdown&file=meridian", expectedRedirect: "/experience/meridian" },
	{ name: "Legacy iMessage Wrapped", legacyPath: "/?app=markdown&file=imessage-wrapped", expectedRedirect: "/projects/imessage-wrapped" },
	{ name: "Legacy Resume Markdown", legacyPath: "/?app=markdown&file=resume", expectedRedirect: "/resume" },
];

/**
 * Expected URLs in sitemap (Story 4).
 */
const EXPECTED_SITEMAP_URLS = [
	"https://dineshd.dev",
	"https://dineshd.dev/about",
	"https://dineshd.dev/contact",
	"https://dineshd.dev/faq",
	"https://dineshd.dev/resume",
	"https://dineshd.dev/projects",
	"https://dineshd.dev/projects/yield",
	"https://dineshd.dev/projects/debate",
	"https://dineshd.dev/projects/passfx",
	"https://dineshd.dev/experience",
];

/**
 * Site Index validation - checks for sr-only navigation (Story 4).
 */
const SITE_INDEX_TEST = {
	name: "Site Index",
	path: "/",
	checks: [
		// SiteIndex nav element should exist
		{ type: "pattern", value: /<nav[^>]*aria-label="Site index for search engines"/, description: "Site Index nav element" },
		// Should have sr-only class for visual hiding
		{ type: "pattern", value: /<nav[^>]*class="sr-only"/, description: "Site Index sr-only class" },
		// Should contain links to major sections
		{ type: "content", value: 'href="https://dineshd.dev/about"', description: "About link in Site Index" },
		{ type: "content", value: 'href="https://dineshd.dev/projects"', description: "Projects link in Site Index" },
		{ type: "content", value: 'href="https://dineshd.dev/experience"', description: "Experience link in Site Index" },
	],
};

/**
 * Wait for the server to be ready by polling the health endpoint.
 */
async function waitForServer(url, timeout) {
	const startTime = Date.now();
	const pollInterval = 500;

	while (Date.now() - startTime < timeout) {
		try {
			await fetchWithTimeout(url, 2000);
			return true;
		} catch {
			// Server not ready yet, wait and retry
			await sleep(pollInterval);
		}
	}

	return false;
}

/**
 * Fetch a URL with timeout.
 */
function fetchWithTimeout(url, timeout) {
	return new Promise((resolve, reject) => {
		const req = http.get(url, (res) => {
			let data = "";
			res.on("data", (chunk) => {
				data += chunk;
			});
			res.on("end", () => {
				resolve({ statusCode: res.statusCode, body: data });
			});
		});

		req.on("error", reject);
		req.setTimeout(timeout, () => {
			req.destroy();
			reject(new Error("Request timeout"));
		});
	});
}

/**
 * Sleep helper.
 */
function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Run a single SSR content test case.
 */
async function runTestCase(testCase) {
	const url = `${BASE_URL}${testCase.path}`;
	const errors = [];

	try {
		const response = await fetchWithTimeout(url, REQUEST_TIMEOUT);

		if (response.statusCode !== 200) {
			errors.push(`HTTP ${response.statusCode} (expected 200)`);
			return { passed: false, errors };
		}

		const html = response.body;

		// Check required content strings
		for (const content of testCase.requiredContent) {
			if (!html.includes(content)) {
				errors.push(`Missing required content: "${content}"`);
			}
		}

		// Check content patterns
		for (const pattern of testCase.contentPatterns) {
			if (!pattern.test(html)) {
				errors.push(`Missing pattern: ${pattern}`);
			}
		}

		return { passed: errors.length === 0, errors };
	} catch (error) {
		errors.push(`Request failed: ${error.message}`);
		return { passed: false, errors };
	}
}

/**
 * Run a single entity verification test case.
 */
async function runEntityTestCase(testCase) {
	const url = `${BASE_URL}${testCase.path}`;
	const errors = [];

	try {
		const response = await fetchWithTimeout(url, REQUEST_TIMEOUT);

		if (response.statusCode !== 200) {
			errors.push(`HTTP ${response.statusCode} (expected 200)`);
			return { passed: false, errors };
		}

		const html = response.body;

		// Run all checks
		for (const check of testCase.checks) {
			if (check.type === "content") {
				if (!html.includes(check.value)) {
					errors.push(`Missing: ${check.description}`);
				}
			} else if (check.type === "pattern") {
				if (!check.value.test(html)) {
					errors.push(`Missing: ${check.description}`);
				}
			}
		}

		return { passed: errors.length === 0, errors };
	} catch (error) {
		errors.push(`Request failed: ${error.message}`);
		return { passed: false, errors };
	}
}

/**
 * Run a single canonical URL test case.
 * Validates that the page has a canonical tag matching the expected URL.
 */
async function runCanonicalTestCase(testCase) {
	const url = `${BASE_URL}${testCase.path}`;
	const errors = [];

	try {
		const response = await fetchWithTimeout(url, REQUEST_TIMEOUT);

		if (response.statusCode !== 200) {
			errors.push(`HTTP ${response.statusCode} (expected 200)`);
			return { passed: false, errors };
		}

		const html = response.body;

		// Check for canonical tag
		const canonicalMatch = html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/i);
		if (!canonicalMatch) {
			errors.push("Missing canonical tag");
		} else {
			const canonicalUrl = canonicalMatch[1];
			const expectedUrl = testCase.canonicalPath === "/"
				? "https://dineshd.dev"
				: `https://dineshd.dev${testCase.canonicalPath}`;

			if (canonicalUrl !== expectedUrl) {
				errors.push(`Canonical mismatch: got "${canonicalUrl}", expected "${expectedUrl}"`);
			}
		}

		return { passed: errors.length === 0, errors };
	} catch (error) {
		errors.push(`Request failed: ${error.message}`);
		return { passed: false, errors };
	}
}

/**
 * Validate sitemap.xml (Story 4).
 * Checks structure and presence of expected URLs.
 */
async function validateSitemap() {
	const url = `${BASE_URL}/sitemap.xml`;
	const errors = [];

	try {
		const response = await fetchWithTimeout(url, REQUEST_TIMEOUT);

		if (response.statusCode !== 200) {
			errors.push(`HTTP ${response.statusCode} (expected 200)`);
			return { passed: false, errors };
		}

		const xml = response.body;

		// Check XML structure
		if (!xml.includes('<?xml')) {
			errors.push("Missing XML declaration");
		}

		if (!xml.includes('<urlset')) {
			errors.push("Missing <urlset> element");
		}

		// Check for expected URLs
		for (const expectedUrl of EXPECTED_SITEMAP_URLS) {
			if (!xml.includes(`<loc>${expectedUrl}</loc>`)) {
				errors.push(`Missing URL: ${expectedUrl}`);
			}
		}

		// Check for required elements in URL entries
		if (!xml.includes('<lastmod>')) {
			errors.push("Missing <lastmod> elements");
		}

		if (!xml.includes('<changefreq>')) {
			errors.push("Missing <changefreq> elements");
		}

		if (!xml.includes('<priority>')) {
			errors.push("Missing <priority> elements");
		}

		return { passed: errors.length === 0, errors };
	} catch (error) {
		errors.push(`Request failed: ${error.message}`);
		return { passed: false, errors };
	}
}

/**
 * Validate robots.txt (Story 4).
 * Checks syntax and sitemap reference.
 */
async function validateRobotsTxt() {
	const url = `${BASE_URL}/robots.txt`;
	const errors = [];

	try {
		const response = await fetchWithTimeout(url, REQUEST_TIMEOUT);

		if (response.statusCode !== 200) {
			errors.push(`HTTP ${response.statusCode} (expected 200)`);
			return { passed: false, errors };
		}

		const txt = response.body;

		// Check for User-agent directive (case-insensitive)
		if (!/User-Agent:/i.test(txt)) {
			errors.push("Missing User-Agent directive");
		}

		// Check for sitemap reference
		if (!txt.includes('Sitemap:')) {
			errors.push("Missing Sitemap directive");
		}

		// Verify sitemap URL
		if (!txt.includes('https://dineshd.dev/sitemap.xml')) {
			errors.push("Sitemap URL should be https://dineshd.dev/sitemap.xml");
		}

		return { passed: errors.length === 0, errors };
	} catch (error) {
		errors.push(`Request failed: ${error.message}`);
		return { passed: false, errors };
	}
}

/**
 * Validate Site Index component (Story 4).
 * Checks for sr-only navigation with links.
 */
async function validateSiteIndex() {
	const url = `${BASE_URL}${SITE_INDEX_TEST.path}`;
	const errors = [];

	try {
		const response = await fetchWithTimeout(url, REQUEST_TIMEOUT);

		if (response.statusCode !== 200) {
			errors.push(`HTTP ${response.statusCode} (expected 200)`);
			return { passed: false, errors };
		}

		const html = response.body;

		// Run all checks
		for (const check of SITE_INDEX_TEST.checks) {
			if (check.type === "content") {
				if (!html.includes(check.value)) {
					errors.push(`Missing: ${check.description}`);
				}
			} else if (check.type === "pattern") {
				if (!check.value.test(html)) {
					errors.push(`Missing: ${check.description}`);
				}
			}
		}

		return { passed: errors.length === 0, errors };
	} catch (error) {
		errors.push(`Request failed: ${error.message}`);
		return { passed: false, errors };
	}
}

/**
 * Run a single legacy redirect test case.
 * Validates that legacy URLs redirect to canonical paths with 301.
 */
async function runLegacyRedirectTestCase(testCase) {
	const url = `${BASE_URL}${testCase.legacyPath}`;
	const errors = [];

	try {
		// Make request without following redirects
		const response = await new Promise((resolve, reject) => {
			const req = http.get(url, { followRedirect: false }, (res) => {
				resolve({ statusCode: res.statusCode, headers: res.headers });
			});
			req.on("error", reject);
			req.setTimeout(REQUEST_TIMEOUT, () => {
				req.destroy();
				reject(new Error("Request timeout"));
			});
		});

		// Check for 301 redirect
		if (response.statusCode !== 301) {
			errors.push(`Expected 301, got ${response.statusCode}`);
			return { passed: false, errors };
		}

		// Check redirect location
		const location = response.headers.location;
		if (!location) {
			errors.push("Missing Location header");
			return { passed: false, errors };
		}

		// Normalize location (may be absolute or relative)
		const actualPath = location.startsWith("http")
			? new URL(location).pathname
			: location;

		if (actualPath !== testCase.expectedRedirect) {
			errors.push(`Redirect mismatch: got "${actualPath}", expected "${testCase.expectedRedirect}"`);
		}

		return { passed: errors.length === 0, errors };
	} catch (error) {
		errors.push(`Request failed: ${error.message}`);
		return { passed: false, errors };
	}
}

/**
 * Main entry point.
 */
async function main() {
	console.log("SSR & Entity Validation — SEO-01 Stories 1 & 3 + SEO-02 Story 2");
	console.log("=".repeat(70));
	console.log("");

	// Start the Next.js server
	console.log("Starting Next.js server...");
	const serverProcess = spawn("npx", ["next", "start", "-p", String(PORT)], {
		stdio: ["ignore", "pipe", "pipe"],
	});

	let serverOutput = "";
	serverProcess.stdout.on("data", (data) => {
		serverOutput += data.toString();
	});
	serverProcess.stderr.on("data", (data) => {
		serverOutput += data.toString();
	});

	// Handle server process errors
	serverProcess.on("error", (error) => {
		console.error(`Failed to start server: ${error.message}`);
		process.exit(1);
	});

	try {
		// Wait for server to be ready
		console.log(`Waiting for server at ${BASE_URL}...`);
		const serverReady = await waitForServer(BASE_URL, SERVER_START_TIMEOUT);

		if (!serverReady) {
			console.error("Server failed to start within timeout");
			console.error("Server output:", serverOutput);
			throw new Error("Server startup timeout");
		}

		console.log("Server ready. Running tests...\n");

		// ============================================
		// Section 1: SSR Content Validation (Story 1)
		// ============================================
		console.log("--- SSR Content Validation (Story 1) ---\n");

		const ssrResults = [];
		for (const testCase of TEST_CASES) {
			process.stdout.write(`  Testing: ${testCase.name}... `);
			const result = await runTestCase(testCase);
			ssrResults.push({ ...testCase, ...result });

			if (result.passed) {
				console.log("PASS");
			} else {
				console.log("FAIL");
				for (const error of result.errors) {
					console.log(`    - ${error}`);
				}
			}
		}

		// ============================================
		// Section 2: Entity Verification (Story 3)
		// ============================================
		console.log("\n--- Entity Verification (Story 3) ---\n");

		const entityResults = [];
		for (const testCase of ENTITY_TEST_CASES) {
			process.stdout.write(`  Testing: ${testCase.name}... `);
			const result = await runEntityTestCase(testCase);
			entityResults.push({ ...testCase, ...result });

			if (result.passed) {
				console.log("PASS");
			} else {
				console.log("FAIL");
				for (const error of result.errors) {
					console.log(`    - ${error}`);
				}
			}
		}

		// ============================================
		// Section 3: Canonical URL Validation (Story 2)
		// ============================================
		console.log("\n--- Canonical URL Validation (Story 2) ---\n");

		const canonicalResults = [];
		for (const testCase of CANONICAL_TEST_CASES) {
			process.stdout.write(`  Testing: ${testCase.name}... `);
			const result = await runCanonicalTestCase(testCase);
			canonicalResults.push({ ...testCase, ...result });

			if (result.passed) {
				console.log("PASS");
			} else {
				console.log("FAIL");
				for (const error of result.errors) {
					console.log(`    - ${error}`);
				}
			}
		}

		// ============================================
		// Section 4: Legacy Redirect Validation (Story 2)
		// ============================================
		console.log("\n--- Legacy Redirect Validation (Story 2) ---\n");

		const redirectResults = [];
		for (const testCase of LEGACY_REDIRECT_TEST_CASES) {
			process.stdout.write(`  Testing: ${testCase.name}... `);
			const result = await runLegacyRedirectTestCase(testCase);
			redirectResults.push({ ...testCase, ...result });

			if (result.passed) {
				console.log("PASS");
			} else {
				console.log("FAIL");
				for (const error of result.errors) {
					console.log(`    - ${error}`);
				}
			}
		}

		// ============================================
		// Section 5: Crawl Graph Validation (Story 4)
		// ============================================
		console.log("\n--- Crawl Graph Validation (Story 4) ---\n");

		const crawlResults = [];

		// Sitemap validation
		process.stdout.write("  Testing: Sitemap.xml... ");
		const sitemapResult = await validateSitemap();
		crawlResults.push({ name: "Sitemap.xml", ...sitemapResult });
		if (sitemapResult.passed) {
			console.log("PASS");
		} else {
			console.log("FAIL");
			for (const error of sitemapResult.errors) {
				console.log(`    - ${error}`);
			}
		}

		// Robots.txt validation
		process.stdout.write("  Testing: Robots.txt... ");
		const robotsResult = await validateRobotsTxt();
		crawlResults.push({ name: "Robots.txt", ...robotsResult });
		if (robotsResult.passed) {
			console.log("PASS");
		} else {
			console.log("FAIL");
			for (const error of robotsResult.errors) {
				console.log(`    - ${error}`);
			}
		}

		// Site Index validation
		process.stdout.write("  Testing: Site Index... ");
		const siteIndexResult = await validateSiteIndex();
		crawlResults.push({ name: "Site Index", ...siteIndexResult });
		if (siteIndexResult.passed) {
			console.log("PASS");
		} else {
			console.log("FAIL");
			for (const error of siteIndexResult.errors) {
				console.log(`    - ${error}`);
			}
		}

		// ============================================
		// Summary
		// ============================================
		console.log("");
		console.log("=".repeat(70));

		const allResults = [...ssrResults, ...entityResults, ...canonicalResults, ...redirectResults, ...crawlResults];
		const passed = allResults.filter((r) => r.passed).length;
		const failed = allResults.filter((r) => !r.passed).length;

		if (failed === 0) {
			console.log(`VALIDATION PASSED: ${passed}/${allResults.length} tests passed`);
			console.log("=".repeat(70));
			return 0;
		}

		console.log(`VALIDATION FAILED: ${failed}/${allResults.length} tests failed`);
		console.log("=".repeat(70));
		console.log("");
		console.log("ACTION REQUIRED:");

		// Check which section failed
		const ssrFailed = ssrResults.filter((r) => !r.passed).length;
		const entityFailed = entityResults.filter((r) => !r.passed).length;
		const canonicalFailed = canonicalResults.filter((r) => !r.passed).length;
		const redirectFailed = redirectResults.filter((r) => !r.passed).length;
		const crawlFailed = crawlResults.filter((r) => !r.passed).length;

		if (ssrFailed > 0) {
			console.log("  SSR Content Issues:");
			console.log("    - Ensure content is being fetched server-side");
			console.log("    - Verify SSRContentProjection component is rendering");
			console.log("    - Check that markdown files exist in /public/readmes/");
		}

		if (entityFailed > 0) {
			console.log("  Entity Verification Issues:");
			console.log("    - Verify SSREntityCard is rendering on the page");
			console.log("    - Check Person/ProfilePage schema in layout.tsx");
			console.log("    - Verify OG and Twitter meta tags in metadata.ts");
			console.log("    - Ensure social links are present as <a> tags");
		}

		if (canonicalFailed > 0) {
			console.log("  Canonical URL Issues:");
			console.log("    - Verify canonical tags in page metadata");
			console.log("    - Check generatePathMetadata in path-metadata.ts");
			console.log("    - Ensure clean paths are correctly mapped");
		}

		if (redirectFailed > 0) {
			console.log("  Legacy Redirect Issues:");
			console.log("    - Check middleware.ts redirect logic");
			console.log("    - Verify getLegacyRedirectPath in path-routing.ts");
			console.log("    - Ensure all legacy ?app= params have mappings");
		}

		if (crawlFailed > 0) {
			console.log("  Crawl Graph Issues:");
			console.log("    - Check sitemap.ts for URL generation");
			console.log("    - Verify robots.ts syntax and sitemap reference");
			console.log("    - Ensure SiteIndex component is in layout.tsx");
		}

		console.log("");
		return 1;
	} finally {
		// Kill the server process
		console.log("\nShutting down server...");
		serverProcess.kill("SIGTERM");

		// Give it a moment to clean up
		await sleep(1000);

		// Force kill if still running
		if (!serverProcess.killed) {
			serverProcess.kill("SIGKILL");
		}
	}
}

// Run and exit with appropriate code
main()
	.then((exitCode) => process.exit(exitCode))
	.catch((error) => {
		console.error("Validation script error:", error.message);
		process.exit(1);
	});
