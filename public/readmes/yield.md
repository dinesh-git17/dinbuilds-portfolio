## Yield

Yield is an interactive algorithm visualizer built to answer a simple question I kept running into as a developer:

“What is this algorithm actually doing, step by step?”

Most learning resources explain algorithms using pseudocode, diagrams, or static animations. That works up to a point. There is always a gap between the explanation and the real implementation. Yield exists to close that gap.

Instead of animating pre-scripted steps, Yield executes real algorithms and visualizes exactly what the code does as it runs. Every comparison, swap, rotation, traversal, or decision you see on screen comes directly from the algorithm’s implementation.

If the code behaves unexpectedly, the visualization does too.

### What It Is

Yield is a desktop-first platform for visualizing data structures and algorithms in real time. It is designed for developers, students, educators, and interview preparation, but it also works well for anyone who is simply curious about how algorithms behave under the hood.

The focus is not on memorizing time complexity charts. It is on understanding behavior.

You can:
- Step through algorithms one operation at a time
- Pause, rewind, and replay execution deterministically
- See the currently executing line of code highlighted in sync with the visualization
- Adjust input sizes and playback speed
- Share exact visualization states via URL

### How It Came To Be

This project started as a personal frustration.

As a data engineer, I do not spend my day writing sorting algorithms. Over time, I noticed that while I could still reason about complexity and patterns, the intuition behind many classic algorithms had faded. Most visualizers I found felt either too abstract or too polished in ways that hid the messy parts.

So I built a tool for myself.

The initial goal was simple: write algorithms the way you would in production code and expose every meaningful step they take. No shortcuts. No hand-waving. No animation scripts pretending to be logic.

Yield grew from there into a full visualization platform once it became clear how useful that level of transparency actually is.

Bubble Sort looking inefficient is not a bug. It is the feature.

### How It Works

At the core of Yield is a generator-driven execution engine.

Each algorithm is implemented as a JavaScript generator function. Instead of returning a result immediately, the algorithm yields structured steps as it runs. Each yield represents a real operation such as a comparison, swap, rotation, node visit, or edge relaxation.

The visualization engine consumes these steps and updates the UI incrementally. This design enables:
- Precise stepping without re-running logic
- Deterministic playback
- Clear separation between algorithm logic and rendering
- Perfect synchronization between code and visuals

Because the visualization is driven by execution rather than animation, what you see is always truthful. Occasionally uncomfortable. Always accurate.

### What It Covers

Yield currently supports multiple categories of algorithms and data structures, including:
- Sorting algorithms with adjustable input sizes
- Pathfinding algorithms with interactive grids and heuristics
- Tree data structures with explicit rotations and traversals
- Graph algorithms with editable nodes and edges
- Interview-style problems designed to surface edge cases

Each algorithm includes a learning page with explanations, complexity analysis, and preset demos that can be launched directly.

### Why It Is Different

Yield does not try to make algorithms look impressive.

It tries to make them honest.

The platform is built around the idea that understanding comes from watching algorithms struggle, recover, and sometimes do exactly what you hoped they would not do. That honesty makes the learning stick.

If an algorithm is slow, it will look slow.  
If a decision is costly, you will feel it.  
If a data structure rebalances itself, you will see every step.

### Technical Overview

- Framework: Next.js with App Router
- Language: TypeScript in strict mode
- UI: React with a desktop-first layout
- Styling: Tailwind CSS
- State Management: Zustand with domain-specific slices
- Animation: Framer Motion for GPU-accelerated transitions
- Testing: Vitest
- Monitoring and Analytics: Sentry and GA4 with consent gating

Performance, accessibility, and determinism were treated as first-class concerns throughout the build.

### Closing Note

Yield is both a learning tool and a personal statement about how I like to build software.

Clear behavior beats clever abstractions.  
Visuals should never lie.  
If something looks inefficient, it probably is.

This project is still growing, but its core principle remains unchanged: let the code speak for itself.

Github: [Yield Repo](https://github.com/dinesh-git17/yield)
