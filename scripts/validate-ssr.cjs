#!/usr/bin/env node
/**
 * SSR Content Validation Script — SEO-01 Stories 1 & 3
 *
 * Validates that server-rendered content is present in HTML responses.
 * Also validates schema markup and meta tags for search engine optimization.
 *
 * Validates:
 * - SSR content projection (Story 1)
 * - Person/ProfilePage schema (Story 3)
 * - Open Graph meta tags (Story 3)
 * - Twitter Card meta tags (Story 3)
 * - Entity h1 alignment (Story 3)
 * - Social profile links (Story 3)
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
 */
const TEST_CASES = [
	{
		name: "Yield Project",
		path: "/?app=markdown&file=yield",
		// The SSR content projection should include this text from yield.md
		requiredContent: ["data-ssr-content", "data-ssr-projected"],
		// Verify the markdown content is rendered
		contentPatterns: [/Yield/i],
	},
	{
		name: "PassFX Project",
		path: "/?app=markdown&file=passfx",
		requiredContent: ["data-ssr-content", "data-ssr-projected"],
		contentPatterns: [/PassFX/i],
	},
	{
		name: "Debate Lab Project",
		path: "/?app=markdown&file=debate-lab",
		requiredContent: ["data-ssr-content", "data-ssr-projected"],
		contentPatterns: [/Debate/i],
	},
	{
		name: "Experience - Meridian",
		path: "/?app=markdown&file=meridian",
		requiredContent: ["data-ssr-content", "data-ssr-projected"],
		contentPatterns: [/Meridian/i],
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
		path: "/?app=markdown&file=yield",
		checks: [
			// Unique title for project
			{ type: "pattern", value: /<title[^>]*>Yield/i, description: "Project-specific title" },
			// OG tags present
			{ type: "pattern", value: /<meta[^>]*property="og:title"[^>]*content="[^"]+"/i, description: "og:title meta tag" },
			{ type: "pattern", value: /<meta[^>]*property="og:description"[^>]*content="[^"]+"/i, description: "og:description meta tag" },
			// CreativeWork schema for project
			{ type: "pattern", value: /"@type"\s*:\s*"CreativeWork"/, description: "CreativeWork schema type" },
		],
	},
];

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
 * Main entry point.
 */
async function main() {
	console.log("SSR & Entity Validation — SEO-01 Stories 1 & 3");
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
		// Summary
		// ============================================
		console.log("");
		console.log("=".repeat(70));

		const allResults = [...ssrResults, ...entityResults];
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
