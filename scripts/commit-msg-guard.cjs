#!/usr/bin/env node
/**
 * Commit-msg hook to detect and block AI/LLM attribution in commit messages.
 * Prevents commits containing references to AI-generated code.
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

/**
 * Check commit message for forbidden patterns
 */
function checkCommitMessage(message) {
  const violations = [];
  const lines = message.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip comment lines
    if (line.trim().startsWith('#')) continue;

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
  // Get commit message file path (passed by git as first argument)
  const commitMsgFile = process.argv[2] || path.join('.git', 'COMMIT_EDITMSG');

  if (!fs.existsSync(commitMsgFile)) {
    console.error(`Error: Commit message file not found: ${commitMsgFile}`);
    process.exit(1);
  }

  let message;
  try {
    message = fs.readFileSync(commitMsgFile, 'utf-8');
  } catch (err) {
    console.error(`Error reading commit message: ${err.message}`);
    process.exit(1);
  }

  const violations = checkCommitMessage(message);

  if (violations.length > 0) {
    console.log('\n' + '='.repeat(70));
    console.log('COMMIT MESSAGE GUARD: COMMIT BLOCKED');
    console.log('='.repeat(70));
    console.log('\nForbidden AI/LLM attribution detected in commit message:\n');

    for (const v of violations) {
      console.log(`  Line ${v.line}: '${v.matched}' in: ${v.content}`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('ACTION REQUIRED: Remove AI attribution from commit message.');
    console.log('Edit your commit message and remove references to Claude, AI, etc.');
    console.log('='.repeat(70) + '\n');
    process.exit(1);
  }

  process.exit(0);
}

main();
