# SEO Infrastructure Documentation

Technical reference for the SEO-01 Epic implementation in DinBuilds OS.

---

## Architecture Overview

The portfolio uses a **Hybrid State Architecture** that enables search engines to crawl a Single-Page Application (SPA) "OS" interface. URLs drive the system state server-side, ensuring every "Window" has a unique, indexable URL while maintaining the spatial OS visual metaphor.

```
URL Request → Server Component → Parse Search Params → Hydrate Store → SSR Window Content
```

---

## Phase 0: URL-Driven State Hydration

### URL Schema

| Pattern | Description | Example |
|---------|-------------|---------|
| `/` | Desktop (no windows) | `https://dineshd.dev` |
| `/?app={slug}` | App window open | `/?app=about` |
| `/?app=markdown&file={slug}` | Markdown viewer | `/?app=markdown&file=yield` |

### Implementation

**Entry Point:** `app/page.tsx`

```tsx
export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams;
  const initialState = parseURLToState(params);

  return (
    <StoreHydrator initialState={initialState}>
      <Stage />
    </StoreHydrator>
  );
}
```

**URL Parser:** `src/lib/seo/url-state.ts`

The `parseURLToState()` function maps URL parameters to a `HydrationState` object:
- Validates app slug against `APP_SLUG_MAP`
- For markdown viewer, validates file slug against `FILE_SLUG_MAP`
- Calculates SSR-appropriate window positioning
- Returns window instances with correct size, position, and props

**Store Hydrator:** `src/features/os/store/StoreHydrator.tsx`

Client component that hydrates Zustand store synchronously during first render:
- Uses ref-based approach to hydrate before React's first render cycle
- Ensures SSR content matches client-side state
- Preserves persisted preferences (wallpaper, dock config)

### Slug Mappings

**Apps:**
```
about → AppID.About
yield → AppID.Yield
debate → AppID.Debate
passfx → AppID.PassFX
terminal → AppID.Terminal
contact → AppID.Contact
settings → AppID.Settings
projects → AppID.FolderProjects
experience → AppID.FolderExperience
markdown → AppID.MarkdownViewer
```

**Files:**
```
yield → file.yield
passfx → file.passfx
debate-lab → file.debate-lab
imessage-wrapped → file.imessage-wrapped
holiday-exe → file.holiday-exe
links → file.links
meridian → file.meridian
slice-labs → file.slice-labs
carleton → file.carleton
absa → file.absa
```

---

## Phase 1: Technical SEO

### Dynamic Sitemap

**File:** `app/sitemap.ts`

Generates `sitemap.xml` from the Virtual Filesystem registry with priority hierarchy:

| Priority | Content Type |
|----------|-------------|
| 1.0 | Homepage |
| 0.9 | Project markdown files |
| 0.8 | About, Experience files |
| 0.7 | Project apps (Yield, Debate, PassFX) |
| 0.6 | Folder navigation |
| 0.5 | Utility pages (Contact, Terminal) |
| 0.3 | Settings |

### Robots.txt

**File:** `app/robots.ts`

```
User-agent: *
Allow: /
Sitemap: https://dineshd.dev/sitemap.xml
```

### Dynamic Metadata

**File:** `src/lib/seo/metadata.ts`

The `generateMetadata()` function in `app/page.tsx` produces unique metadata per URL state:

- **Title:** App-specific or file name
- **Description:** Contextual descriptions per app/file
- **Canonical URL:** Self-referencing canonical for each state
- **OpenGraph:** Dynamic OG images per app
- **Twitter Card:** Summary large image cards

### Semantic HTML

**File:** `src/features/os/window/WindowFrame.tsx`

Windows use semantic landmarks:
- `<header>` for window title bar
- `<h2>` for window title (SEO heading hierarchy)
- `<article>` for window content
- `role="dialog"` with `aria-label` for accessibility

---

## Phase 2: Schema.org Structured Data

**File:** `src/lib/seo/schema.ts`

### Person Schema

Injected in `app/layout.tsx` on every page:

```json
{
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  "mainEntity": {
    "@type": "Person",
    "@id": "https://dineshd.dev/#person",
    "name": "Dinesh Dawonauth",
    "jobTitle": "Data Engineer",
    "sameAs": [
      "https://github.com/dinesh-git17",
      "https://www.linkedin.com/in/dineshsdawonauth",
      "https://twitter.com/dinbuilds"
    ],
    "worksFor": { "@type": "Organization", "name": "Meridian Credit Union" },
    "alumniOf": [{ "@type": "EducationalOrganization", "name": "Carleton University" }],
    "knowsAbout": ["Data Engineering", "Python", "SQL", "Apache Spark", ...]
  }
}
```

### CreativeWork Schema (Projects)

Injected in `app/page.tsx` when viewing markdown files:

```json
{
  "@context": "https://schema.org",
  "@type": "CreativeWork",
  "@id": "https://dineshd.dev?app=markdown&file=yield#project",
  "name": "Yield",
  "description": "An interactive algorithm visualizer...",
  "author": { "@type": "Person", "@id": "https://dineshd.dev/#person" },
  "sameAs": "https://github.com/dinesh-git17/yield",
  "keywords": ["algorithms", "data-structures", "visualizer"]
}
```

---

## Phase 3: Performance Optimization

### Speculative Asset Preloading

**File:** `src/features/os/desktop/dock/DockIcon.tsx`

Dock icons prefetch routes on hover to reduce Interaction to Next Paint (INP):

```tsx
const handlePrefetch = useCallback(() => {
  if (hasPrefetched) return;
  const slug = APP_ID_TO_SLUG[appId];
  if (slug) {
    router.prefetch(`/?app=${slug}`);
    setHasPrefetched(true);
  }
}, [appId, hasPrefetched, router]);
```

- Preloads JS chunks and RSC payload before click
- Uses `hasPrefetched` state to prevent redundant calls
- Maps AppID to URL slugs via `APP_ID_TO_SLUG`

### Critical CSS

**File:** `app/layout.tsx`

- Font display set to `swap` for immediate text rendering
- `color-scheme: dark` meta tag prevents browser UI color flash
- Tailwind v4 + Next.js 16 handles critical CSS inlining automatically

```tsx
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});
```

### Image Optimization

**File:** `src/features/os/desktop/wallpapers.ts`

Centralized wallpaper registry with blur placeholders:

```tsx
export const WALLPAPERS: WallpaperConfig[] = [
  {
    id: "wall-9",
    name: "Dark Bloom",
    path: "/assets/wallpapers/wall-9.jpg",
    dominantColor: "#0d0d14",
    blurDataURL: generateBlurPlaceholder("#0d0d14"),
  },
  // ...
];
```

**File:** `src/features/os/desktop/Stage.tsx`

Wallpapers use blur placeholders for instant preview:

```tsx
<Image
  src={wallpaper}
  fill
  priority
  quality={85}
  sizes="100vw"
  placeholder={wallpaperConfig?.blurDataURL ? "blur" : "empty"}
  blurDataURL={wallpaperConfig?.blurDataURL}
/>
```

---

## File Structure

```
src/lib/seo/
├── index.ts          # Barrel exports
├── url-state.ts      # URL ↔ State mapping
├── metadata.ts       # Dynamic metadata generation
└── schema.ts         # Schema.org JSON-LD

src/features/os/
├── store/
│   └── StoreHydrator.tsx    # Zustand hydration
├── desktop/
│   ├── wallpapers.ts        # Wallpaper config with blur
│   └── dock/
│       └── DockIcon.tsx     # Prefetch on hover
└── window/
    └── WindowFrame.tsx      # Semantic HTML

app/
├── page.tsx          # URL parsing + hydration
├── layout.tsx        # Global metadata + Person schema
├── sitemap.ts        # Dynamic sitemap.xml
└── robots.ts         # Crawler instructions
```

---

## Verification

### Check Sitemap
```
curl https://dineshd.dev/sitemap.xml
```

### Check Robots
```
curl https://dineshd.dev/robots.txt
```

### Validate Schema
Use [Google Rich Results Test](https://search.google.com/test/rich-results) or [Schema Markup Validator](https://validator.schema.org/).

### Test URL States
```
https://dineshd.dev                           # Desktop
https://dineshd.dev?app=about                 # About window
https://dineshd.dev?app=markdown&file=yield   # Yield project
```

---

## Success Metrics

- **Index Coverage:** 100% of markdown project files indexed as distinct URLs
- **Crawl Depth:** Bots reach Level 3 depth without executing JavaScript
- **Rich Snippets:** Valid Person, ProfilePage, and CreativeWork schema
- **Core Web Vitals:** LCP < 2.5s, INP < 200ms with blur placeholders and prefetching
