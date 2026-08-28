# AGENTS.md

## Purpose
Public privacy-first ULID generator tool (`ulid.airat.top`).

## Repository Role
- Category: `*.airat.top` (public static tool).
- Deployment platform: Cloudflare Workers (static assets).
- Deployment configuration: `wrangler.jsonc`.
- Main content directory: `public_html`.

## Content and Structure
- Main page: `public_html/index.html`.
- Styling: `public_html/styles.css`.
- Logic: `public_html/app.js`.

## Site Conventions
- Keep UI style consistent with AiratTop tools.
- Keep SEO metadata and social tags in `index.html`.
- Keep the Google Analytics counter and other required site-verification tags.
- Publish static assets from `public_html`.

## AI Working Notes
- Preserve canonical ULID semantics: a 48-bit millisecond timestamp, 80 bits of secure randomness, Crockford Base32 encoding, and monotonic batches.
- Keep local-only generation and no-backend dependency.
