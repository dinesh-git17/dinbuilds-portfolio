## Links

Links is my personal internet command center.

It is a deliberately small project with disproportionately high standards. One page. One purpose. No excuses.

If a portfolio is meant to show how you think, this is the most honest representation of mine.

### What It Is

Links is a custom-built personal links hub, similar in spirit to Linktree, but intentionally opinionated. It exists as the single place I send people when I want them to find me, not a platform version of me.

It hosts:
- My primary online presence
- Projects, writing, and contact points
- A resume view with export support
- Subtle signals about how I approach frontend engineering

There is no CMS. No admin panel. No analytics dashboard begging for attention. Just a fast, accessible page that loads instantly and does its job.

### What It Is Not

This is not a product.  
This is not a template.  
This is not meant to be forked and deployed as-is.

Links exists for one user: me.

The repository is public because I believe good frontend code should be readable, inspectable, and learnable, especially when the scope is small enough to actually get right.

### Why It Exists

Control was the original motivation.

Third-party link services are convenient until they are not. Rate limits, feature gating, forced branding, performance compromises, and analytics you do not own all come with the territory.

Building my own meant:
- Full ownership of performance and data
- Zero external dependencies at runtime
- No visual noise or template fingerprints
- The ability to treat a “simple page” with real engineering discipline

It also solves a different problem: focus.

A links page is small enough that there is nowhere to hide. Every loading state, transition, focus ring, and layout decision matters. That makes it an ideal surface to demonstrate taste and restraint. No clever abstractions to hide behind, just decisions.

### How It Works

Links is a statically optimized Next.js application built with the App Router. There is no global state management, no complex data layer, and no unnecessary abstractions.

The architecture is intentionally boring:
- Static content where possible
- Server components where appropriate
- Client components only when interaction demands it
- Minimal JavaScript shipped to the browser

Animations are used sparingly and intentionally. Motion exists to guide attention, not to decorate. Performance budgets are treated as hard constraints, not aspirational goals.

Accessibility is built in from the start:
- Semantic HTML
- Keyboard navigation
- Visible focus states
- WCAG AA compliance as a baseline

If something fails an accessibility check, it is considered broken. Not “good enough,” just broken.

### Design Philosophy

Links reflects a few core beliefs:

- **Small scopes deserve high standards**  
  Fewer features mean fewer excuses.

- **Performance is a feature**  
  If it is slow on a mid-range phone, it is not done.

- **Motion should communicate**  
  Nothing animates unless it explains something.

- **Dark mode is the default**  
  This is a developer-facing site. Light mode exists, quietly.

- **Stop when it’s finished**  
  Overbuilding is a choice. So is restraint.

### Technical Overview

- Framework: Next.js 16 (App Router)
- Language: TypeScript (strict mode)
- Styling: Tailwind CSS v4
- Animation: Framer Motion
- Deployment: Vercel
- State Management: None, by design

The toolchain is intentionally minimal. Every dependency has to justify its existence. If it does not, it does not stay.

### Closing Note

Links is not impressive because it is complex.

It is interesting because it is not.

Anyone can over-engineer a large application. It is much harder to build something small, stop at the right moment, and still care deeply about the details.

This project exists to show how I think when the problem is simple and the bar is high.

Github: [Links Repo](https://github.com/dinesh-git17/links)