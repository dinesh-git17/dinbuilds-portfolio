#!/usr/bin/env node
/**
 * SSR Content Validation Script — SEO-01 Story 1
 *
 * Validates that server-rendered content is present in HTML responses.
 * This ensures search engine crawlers can index content without JavaScript.
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
 * Run a single test case.
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
 * Main entry point.
 */
async function main() {
	console.log("SSR Content Validation");
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

		// Run all test cases
		const results = [];
		for (const testCase of TEST_CASES) {
			process.stdout.write(`  Testing: ${testCase.name}... `);
			const result = await runTestCase(testCase);
			results.push({ ...testCase, ...result });

			if (result.passed) {
				console.log("PASS");
			} else {
				console.log("FAIL");
				for (const error of result.errors) {
					console.log(`    - ${error}`);
				}
			}
		}

		// Summary
		console.log("");
		console.log("=".repeat(70));

		const passed = results.filter((r) => r.passed).length;
		const failed = results.filter((r) => !r.passed).length;

		if (failed === 0) {
			console.log(`SSR VALIDATION PASSED: ${passed}/${results.length} tests passed`);
			console.log("=".repeat(70));
			return 0;
		}

		console.log(`SSR VALIDATION FAILED: ${failed}/${results.length} tests failed`);
		console.log("=".repeat(70));
		console.log("");
		console.log("ACTION REQUIRED:");
		console.log("  - Ensure content is being fetched server-side");
		console.log("  - Verify SSRContentProjection component is rendering");
		console.log("  - Check that markdown files exist in /public/readmes/");
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
