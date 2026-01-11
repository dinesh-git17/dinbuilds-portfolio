# Architecture

## 1. Overview

DinBuilds OS is a portfolio that behaves like a windowed desktop environment. The core problem it solves is discoverability and engagement: it lets visitors explore projects, experience, and utilities through an OS metaphor rather than a linear page. The architectural philosophy is to keep the UI rich and stateful in the browser while still being indexable and linkable through URL driven state and server rendered metadata.

## 2. High-Level Architecture

The system is organized into a small number of clear layers. The Next.js App Router layer handles routing, metadata, and API endpoints. A client side OS layer implements boot flow, the desktop stage, the window manager, and persistent system preferences. Individual apps are isolated components loaded through a registry and rendered inside windows. Content is sourced from a virtual filesystem that maps to static Markdown files in public assets. Server side work is intentionally thin, limited to SEO, the contact form API, and optional external integrations.

## 3. Application Flow

A request to `/` or a URL with `?app=` and optional `?file=` lands in `app/page.tsx` where search parameters are parsed into initial window state. The server also generates metadata based on the same URL state. On the client, `StoreHydrator` seeds the Zustand system store before the first render to avoid hydration mismatches. `BootManager` advances the boot state machine, while `Stage` renders the desktop layers and `WindowManager` renders the active windows. Each window resolves its app component through the registry, which lazy loads the app bundle.

User interactions flow through the system store. Launching an app creates or focuses a window, window position and size updates are stored in memory, and a small subset of preferences such as wallpaper and dock configuration persist to localStorage. Apps trigger their own side effects, for example the Markdown viewer fetches a document from the allowlisted public file set, and the contact form posts to the API route which invokes a server action that validates, rate limits, and sends email via Resend when configured.

## 4. Key Architectural Decisions

URL driven state is the foundation for SEO and deep links. The server parses query parameters to open the correct app and generate page specific metadata, while the client hydrates the same state to match the SSR output.

The OS state is centralized in Zustand with a clear split between ephemeral window state and persisted preferences. This keeps interactivity fast while preserving only the user settings that matter across sessions.

Apps are lazy loaded through an explicit registry. This keeps initial boot light while providing a single place to manage app metadata and availability.

Content is treated as a virtual filesystem backed by static Markdown files. This removes backend dependencies for most content and keeps the build simple.

External integrations are optional and fail safe. The contact flow validates input, rate limits via Redis, sanitizes HTML, and falls back gracefully if external services are not configured or fail.

## 5. Project Structure

The `app/` directory contains Next.js routes, root layout, metadata, sitemap, and the contact API route. The OS implementation lives in `src/features/os/` with submodules for boot, desktop, windows, store, onboarding, notifications, filesystem, and configuration. Individual apps live under `src/features/apps/` and are rendered inside window frames. `src/lib/` contains shared concerns like analytics and SEO helpers. Static content and assets live in `public/`, including `public/readmes/` for the Markdown documents rendered in the portfolio.

## 6. State, Data, and Side Effects

System state is managed with Zustand stores. The system store tracks boot phase, window stack, active and fullscreen windows, and preferences. The onboarding store manages a small guided tour state machine and only persists completion status. Hydration is explicit to avoid SSR and client divergence.

Data is primarily static. The virtual filesystem maps folder IDs to files in `public/readmes/`. The Markdown viewer fetches content from these allowlisted URLs on the client. Side effects are localized: analytics events are emitted from user actions, and the contact form posts to a server action that performs validation, rate limiting, and email delivery.

## 7. Performance, Security, and Reliability Considerations

Performance relies on code splitting via lazy loaded apps, predictable window sizing, and motion settings that respect reduced motion preferences. The boot and welcome sequences are orchestrated to avoid large layout shifts, and background assets are served through Next.js image optimization.

Security assumes a public, read only portfolio. There is no authentication or user data storage. The Markdown viewer validates fetch URLs against an allowlist. The contact form sanitizes HTML, uses a honeypot field, and rate limits via Redis when available.

Reliability favors graceful degradation. Analytics failures are silent. Contact delivery falls back to a safe error response. Redis is treated as optional and fails open to avoid blocking the site.

## 8. What This Architecture Optimizes For

This architecture optimizes for an interactive, app like browsing experience that is still SEO friendly. It favors clarity of state flow, small server responsibilities, and fast iteration on UI experiments. It does not optimize for multi user data, complex backend workflows, or persistent per user sessions. Window state is intentionally ephemeral to keep the experience responsive and low maintenance.

## 9. Future Evolution

The architecture can evolve by adding more apps to the registry, expanding the virtual filesystem, or introducing a content API if content volume grows beyond static Markdown. If richer personalization is needed, persisted preferences can be extended or moved to a backend store. As the project scales, additional server routes could provide search, content indexing, or analytics enrichment, while the OS layer remains a client side shell that composes app modules.
