#!/usr/bin/env node
/**
 * Markdown Link Checker
 * Validates all links in markdown files to prevent 404s and broken user journeys.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Directories containing markdown files to check
const MARKDOWN_DIRS = ['public/readmes'];
const ROOT_MD_FILES = ['README.md', 'ARCHITECTURE.md'];

// Regex to extract markdown links: [text](url)
const LINK_REGEX = /\[([^\]]*)\]\(([^)]+)\)/g;

// External URLs to skip (known valid or rate-limited)
const SKIP_EXTERNAL = [
  'mailto:',
  'tel:',
  'javascript:',
];

// Timeout for HTTP requests (ms)
const REQUEST_TIMEOUT = 10000;

// Rate limiting: delay between external requests (ms)
const REQUEST_DELAY = 100;

/**
 * Collect all markdown files to check
 */
function collectMarkdownFiles() {
  const files = [];

  // Check root markdown files
  for (const file of ROOT_MD_FILES) {
    const fullPath = path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      files.push(fullPath);
    }
  }

  // Check directories
  for (const dir of MARKDOWN_DIRS) {
    const dirPath = path.join(process.cwd(), dir);
    if (fs.existsSync(dirPath)) {
      const entries = fs.readdirSync(dirPath);
      for (const entry of entries) {
        if (entry.endsWith('.md')) {
          files.push(path.join(dirPath, entry));
        }
      }
    }
  }

  return files;
}

/**
 * Extract all links from a markdown file
 */
function extractLinks(filepath) {
  const content = fs.readFileSync(filepath, 'utf-8');
  const links = [];
  let match;

  while ((match = LINK_REGEX.exec(content)) !== null) {
    const [, text, url] = match;
    links.push({ text, url, line: content.substring(0, match.index).split('\n').length });
  }

  return links;
}

/**
 * Check if an internal/relative link exists
 */
function checkInternalLink(url, filepath) {
  // Handle anchor links
  if (url.startsWith('#')) {
    return { valid: true };
  }

  // Handle relative paths
  const basePath = path.dirname(filepath);
  let targetPath;

  if (url.startsWith('/')) {
    // Absolute path from public
    targetPath = path.join(process.cwd(), 'public', url);
  } else {
    // Relative path
    targetPath = path.join(basePath, url.split('#')[0].split('?')[0]);
  }

  if (fs.existsSync(targetPath)) {
    return { valid: true };
  }

  return { valid: false, error: `File not found: ${targetPath}` };
}

/**
 * Check if an external URL is reachable
 */
function checkExternalLink(url) {
  return new Promise((resolve) => {
    // Skip certain URL types
    for (const skip of SKIP_EXTERNAL) {
      if (url.startsWith(skip)) {
        resolve({ valid: true, skipped: true });
        return;
      }
    }

    try {
      const urlObj = new URL(url);
      const protocol = urlObj.protocol === 'https:' ? https : http;

      const req = protocol.request(
        {
          hostname: urlObj.hostname,
          port: urlObj.port,
          path: urlObj.pathname + urlObj.search,
          method: 'HEAD',
          timeout: REQUEST_TIMEOUT,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; LinkChecker/1.0)',
          },
        },
        (res) => {
          // Accept 2xx and 3xx status codes
          if (res.statusCode >= 200 && res.statusCode < 400) {
            resolve({ valid: true });
          } else {
            resolve({ valid: false, error: `HTTP ${res.statusCode}` });
          }
        }
      );

      req.on('timeout', () => {
        req.destroy();
        resolve({ valid: false, error: 'Request timeout' });
      });

      req.on('error', (err) => {
        resolve({ valid: false, error: err.message });
      });

      req.end();
    } catch (err) {
      resolve({ valid: false, error: `Invalid URL: ${err.message}` });
    }
  });
}

/**
 * Delay helper for rate limiting
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Main entry point
 */
async function main() {
  const files = collectMarkdownFiles();

  if (files.length === 0) {
    console.log('No markdown files found to check.');
    process.exit(0);
  }

  console.log(`Checking links in ${files.length} markdown file(s)...\n`);

  const allViolations = new Map();
  const checkedExternalUrls = new Map();

  for (const filepath of files) {
    const relativePath = path.relative(process.cwd(), filepath);
    const links = extractLinks(filepath);
    const violations = [];

    for (const link of links) {
      const isExternal = link.url.startsWith('http://') || link.url.startsWith('https://');

      if (isExternal) {
        // Check cache first
        if (checkedExternalUrls.has(link.url)) {
          const cached = checkedExternalUrls.get(link.url);
          if (!cached.valid) {
            violations.push({ ...link, error: cached.error });
          }
        } else {
          await delay(REQUEST_DELAY);
          const result = await checkExternalLink(link.url);
          checkedExternalUrls.set(link.url, result);

          if (!result.valid && !result.skipped) {
            violations.push({ ...link, error: result.error });
          }
        }
      } else {
        const result = checkInternalLink(link.url, filepath);
        if (!result.valid) {
          violations.push({ ...link, error: result.error });
        }
      }
    }

    if (violations.length > 0) {
      allViolations.set(relativePath, violations);
    }
  }

  if (allViolations.size > 0) {
    console.log('='.repeat(70));
    console.log('LINK CHECK FAILED: Broken links detected');
    console.log('='.repeat(70));
    console.log('');

    for (const [filepath, violations] of allViolations) {
      console.log(`  ${filepath}:`);
      for (const v of violations) {
        console.log(`    Line ${v.line}: [${v.text}](${v.url})`);
        console.log(`      Error: ${v.error}`);
      }
      console.log('');
    }

    console.log('='.repeat(70));
    console.log('ACTION REQUIRED: Fix or remove broken links before merging.');
    console.log('='.repeat(70));
    process.exit(1);
  }

  console.log('Link check passed: All links are valid.');
  process.exit(0);
}

main();
