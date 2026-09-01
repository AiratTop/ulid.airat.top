# ulid.airat.top

[![ulid.airat.top](https://raw.githubusercontent.com/AiratTop/ulid.airat.top/main/public_html/screenshot.png)](https://ulid.airat.top/)

Static, privacy-first ULID generator that runs fully in the browser. Deployed as static assets on Cloudflare Workers.

- Live site: https://ulid.airat.top
- Status page: https://status.airat.top

## Advantages

- Canonical 26-character ULIDs using the Crockford Base32 alphabet.
- 48-bit Unix timestamp in milliseconds plus 80 bits of secure randomness.
- Monotonic generation for correctly ordered IDs created within the same millisecond.
- Batch generation from 1 to 10,000 values.
- One-click copy, regenerate, and `.txt` download actions.
- Generated values stay in the browser and are never stored or sent to a backend.
- Only the selected count is saved locally between visits.
- Mobile-first layout that scales to desktop.
- Offline-friendly static files for easy hosting.

## What is inside

- `public_html/index.html` - layout and metadata.
- `public_html/styles.css` - theme, layout, and animations.
- `public_html/app.js` - dependency-free ULID generator and UI wiring.
- `wrangler.jsonc` - Cloudflare Worker and static asset configuration.

## How generation works

Each ULID contains a 48-bit timestamp and 80 bits of randomness from `crypto.getRandomValues()`. When multiple values are generated in the same millisecond, the random component is incremented as an unsigned big-endian integer. This preserves lexical ordering across a generated batch while keeping the implementation local and dependency-free.

## Local development

Open `public_html/index.html` directly in a modern browser, or serve the directory with any static file server.

## Deployment

Cloudflare Workers Builds deploys the contents of `public_html` as static assets. The project has no build step; deployment uses `npx wrangler deploy` with the settings in `wrangler.jsonc`.

## License

The original source code, configuration, and documentation in this repository are licensed under
the [Apache License 2.0](LICENSE), with copyright details in [NOTICE](NOTICE).

---

## Author

**AiratTop (Airat Halitov)**

- Website: [airat.top](https://airat.top)
- GitHub: [@AiratTop](https://github.com/AiratTop)
- Email: [mail@airat.top](mailto:mail@airat.top)
- Repository: [ulid.airat.top](https://github.com/AiratTop/ulid.airat.top)
