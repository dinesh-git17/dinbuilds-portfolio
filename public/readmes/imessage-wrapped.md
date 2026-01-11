## iMessage Wrapped

iMessage Wrapped is a fully local, privacy-first analysis tool that turns your macOS iMessage history into a “year in review,” inspired by Spotify Wrapped, but built for conversations instead of playlists.

It reads your existing message database, extracts meaningful patterns, and outputs a structured dataset that tells a story about how you communicate: frequency, habits, milestones, and trends over time.

No cloud.  
No uploads.  
No accounts.  
Your messages never leave your machine.

### What It Is

iMessage Wrapped is a Python CLI tool that analyzes the macOS iMessage SQLite database (`chat.db`) and generates a detailed JSON report for a specific conversation and year.

It surfaces insights such as:
- Total messages sent versus received
- Monthly, daily, and hourly messaging patterns
- Peak texting hours and busiest days
- Response time behavior
- Double and triple text frequency
- Emoji and reaction usage
- Media, links, and voice memo counts
- Late-night messaging habits
- Conversation milestones (10k, 25k, 50k messages, and beyond)
- Relationship-specific signals like “I love you” counts and pet names

The output is machine-readable and presentation-ready, making it easy to build visualizations, dashboards, or personal retrospectives on top of it.

### Why It Exists

Messaging data is deeply personal and surprisingly revealing.

Most “year in review” products require uploading your data to a third-party service and trusting them to handle it responsibly. For message history, that is a non-starter.

iMessage Wrapped was built around a simple principle:

**You should be able to analyze your own data without giving it to anyone else.**

This project lives at the intersection of curiosity, privacy, and data literacy. It is about understanding communication patterns, not monetizing them.

It is also a reminder that meaningful insights do not require machine learning models or cloud infrastructure. Sometimes, well-written SQL and careful analysis are enough.

### How It Works

macOS stores iMessage history in a local SQLite database. iMessage Wrapped reads from that database in read-only mode and performs a series of carefully constructed queries to extract statistics.

Key design decisions:
- Uses only Python’s standard library (sqlite3, datetime, collections, and more)
- No external dependencies
- Explicit SQL queries for every metric, fully documented
- Deterministic conversion of Apple timestamp formats
- No writes, mutations, or side effects on the original database

For safety and reliability, the recommended workflow is to copy `chat.db` to a working location before analysis, avoiding file locks while Messages.app is running.

Every metric is computed transparently. There are no heuristics hiding behind abstractions. If a number exists, there is a SQL query you can inspect.

### Output and Extensibility

The tool produces a single JSON file containing:
- High-level summary statistics
- Detailed breakdowns by time, sender, and category
- Event-style data for milestones and notable patterns

This makes the project intentionally composable:
- Developers can build visual dashboards
- Designers can create “Wrapped-style” slides
- Curious users can explore the raw data directly
- Analysts can extend or modify the queries for custom insights

A full SQL reference is included in the repository, documenting how each statistic is derived.

### Privacy and Security

Privacy is not a feature. It is the default.

- All analysis happens locally
- No network access
- No telemetry
- No data leaves your machine
- No databases or JSON outputs are uploaded automatically

The tool reads data, computes statistics, and exits. What you do with the output is entirely up to you.

### Technical Overview

- Language: Python 3.8+
- Platform: macOS (iMessage database)
- Interface: Command-line tool
- Storage: Local SQLite read-only access
- Output: Structured JSON
- Dependencies: Python standard library only
- License: MIT

### Who It’s For

iMessage Wrapped is for:
- Developers curious about personal data analysis
- Privacy-conscious users who want local tooling
- People interested in quantified self-style insights
- Anyone who has scrolled through their message history and wondered what it says about them

It is not a polished consumer app. It is a transparent, inspectable tool designed to be extended, forked, and learned from.

### Closing Note

iMessage Wrapped exists to prove that:
- Personal data can stay personal
- Insight does not require surveillance
- Sometimes, the most interesting stories are already sitting in a SQLite database on your laptop

Your messages already tell a story.

This tool just helps you read it.

Github: [iMessage Wrapped Repo](https://github.com/dinesh-git17/imessage-wrapped)
