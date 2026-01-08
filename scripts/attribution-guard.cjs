#!/usr/bin/env node
/**
 * Pre-commit hook to detect and block AI/LLM attribution in source files.
 * Prevents accidental commits containing references to AI-generated code.
 */

const fs = require('fs');
const path = require('path');

// Patterns that indicate AI attribution (case-insensitive)
const FORBIDDEN_PATTERNS = [
  /\bclaude\b/i,
  /\banthropic\b/i,
  /\bgenerated\s+by\s+claude\b/i,
  /\bgenerated\s+by\s+ai\b/i,
  /\bgenerated\s+with\s+claude\b/i,
  /\bclaude[\s-]*code\b/i,
  /\bai[- ]generated\b/i,
  /\bllm[- ]generated\b/i,
  /\bgenerated\s+by\s+llm\b/i,
  /\bgenerated\s+by\s+gpt\b/i,
  /\bgenerated\s+by\s+copilot\b/i,
  /\bco-authored-by:.*claude\b/i,
  /\bco-authored-by:.*anthropic\b/i,
  /\bwritten\s+by\s+ai\b/i,
  /\bai\s+assistant\b/i,
  /\bchatgpt\b/i,
  /\bopenai\b/i,
];

// Whitelisted contexts where forbidden patterns are allowed (legitimate uses)
const WHITELISTED_CONTEXTS = [
  /LLM\s+Integration\s*\(/i, // e.g., "LLM Integration (OpenAI, Anthropic)"
  /integration.*openai/i, // Technical skill mentions
  /integration.*anthropic/i,
  /api.*openai/i,
  /api.*anthropic/i,
  /sdk.*openai/i,
  /sdk.*anthropic/i,
];

// Files to exclude from checking
const EXCLUDED_FILES = new Set([
  'CLAUDE.md',
  'attribution-guard.cjs',
  'commit-msg-guard.cjs',
  'README.md',
  '.claude/settings.json',
]);

// Directories to exclude
const EXCLUDED_DIRS = ['.git', 'node_modules', '.next', 'dist', 'build'];

/**
 * Check if file should be excluded
 */
function shouldExclude(filepath) {
  const basename = path.basename(filepath);
  if (EXCLUDED_FILES.has(basename)) return true;

  for (const dir of EXCLUDED_DIRS) {
    if (
      filepath.includes(`${path.sep}${dir}${path.sep}`) ||
      filepath.startsWith(`${dir}${path.sep}`)
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Check if a line matches a whitelisted context
 */
function isWhitelisted(line) {
  for (const pattern of WHITELISTED_CONTEXTS) {
    if (pattern.test(line)) return true;
  }
  return false;
}

/**
 * Check a file for forbidden patterns
 */
function checkFile(filepath) {
  if (shouldExclude(filepath)) return [];

  let content;
  try {
    content = fs.readFileSync(filepath, 'utf-8');
  } catch {
    return [];
  }

  const violations = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip whitelisted contexts
    if (isWhitelisted(line)) continue;

    for (const pattern of FORBIDDEN_PATTERNS) {
      const match = line.match(pattern);
      if (match) {
        violations.push({
          line: i + 1,
          content: line.trim().slice(0, 60) + (line.length > 60 ? '...' : ''),
          matched: match[0],
        });
        break;
      }
    }
  }

  return violations;
}

/**
 * Main entry point
 */
function main() {
  const files = process.argv.slice(2);

  if (files.length === 0) {
    console.log('Usage: attribution-guard.js <file1> [file2] ...');
    process.exit(1);
  }

  const allViolations = new Map();

  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    const stat = fs.statSync(file);
    if (!stat.isFile()) continue;

    const violations = checkFile(file);
    if (violations.length > 0) {
      allViolations.set(file, violations);
    }
  }

  if (allViolations.size > 0) {
    console.log('\n' + '='.repeat(70));
    console.log('ATTRIBUTION GUARD: COMMIT BLOCKED');
    console.log('='.repeat(70));
    console.log('\nForbidden AI/LLM attribution detected in the following files:\n');

    for (const [filepath, violations] of allViolations) {
      console.log(`  ${filepath}:`);
      for (const v of violations) {
        console.log(`    Line ${v.line}: '${v.matched}' in: ${v.content}`);
      }
      console.log();
    }

    console.log('='.repeat(70));
    console.log('ACTION REQUIRED: Remove all AI attribution references before committing.');
    console.log('='.repeat(70) + '\n');
    process.exit(1);
  }

  process.exit(0);
}

main();
