# Lunchbox Feedback

A personal mobile one-pager on which the teacher grades the lunchbox of the day; an Angular 22 SSR app whose Express server forwards every report card to a Discord channel.

## Design source of truth

The templates and the theme tokens in `src/styles.css` are the design; the original design handoff is no longer part of the repository.

## Code layout

- `src/app/report-card/`: the only page (`ReportCardPage`) with its components, the client-side photo shrinking and `ReportCardClient`.
- `src/shared/`: used by browser and server – subjects, endpoint and limits (`report-card.ts`), grading, `formatBerlinDay`.
- `src/server/`: the API – `POST /api/report-cards` router, validation, Discord message and webhook.
- `src/server.ts`: the Express entry – API router, static files from `browser/`, Angular SSR.
- `hosting/app.cjs`: the Passenger startup file, published next to `browser/` and `server/`.
- `.github/workflows/deploy.yml`: tests, builds and publishes to the branch `deployment/production`; setup and chain are in `README.md`.

`npm start` runs the real API: with `DISCORD_WEBHOOK_URL` set, a submission in development posts to that Discord channel; without it, the page works and every submission fails with 502.

## Invariants

- **Neither the Discord webhook URL, the production domain nor the teacher's name enters the repository**, which is public along with its branch `deployment/production`. In production all three come from Plesk custom environment variables: `DISCORD_WEBHOOK_URL`, read by `postToDiscord` on every delivery; `NG_ALLOWED_HOSTS`, Angular SSR's runtime host allowlist (`security.allowedHosts` in `angular.json` stays empty); and `TEACHER_NAME`, which `app.config.server.ts` reads on every render and hands to the browser through TransferState (`teacherNameKey`). Without `TEACHER_NAME` the page greets neutrally and drops the signature. The workflow polls the site through the repository secret `PRODUCTION_URL`. Violation: the teacher's name is public, or anyone can find the page, which has no login, and post to the channel.
- **`src/server.ts` also listens when `IN_PASSENGER === '1'`.** Passenger starts the app through its own loader (`argv[1]` is `node-loader.js`), so `isMainModule` is false, with or without `hosting/app.cjs`. Violation: the app never calls `listen()` under Passenger, which aborts with a spawn timeout.
- **The export `reqHandler` in `src/server.ts` keeps its name** (an Angular build contract, exempt from the no-abbreviations rule). Violation: `ng serve` warns and falls back to its internal SSR middleware, so the API routes are gone in development.
- **Angular SSR answers 400 for every host missing from `NG_ALLOWED_HOSTS`.** A local run of the build needs `NG_ALLOWED_HOSTS=localhost`. Violation: the page answers 400.
- **Critical CSS inlining stays off (`inlineCritical: false` in the production `optimization` of `angular.json`).** Beasties 0.5.4, pinned by `@angular/build`, writes a `;` after every `@property` block of the inlined CSS, so the browser drops all but the first, and the inlined CSS has no `@font-face`. Violation: cold loads first paint without Tailwind borders, shadows and fonts, then shift once the stylesheet arrives.
- **`RenderMode.Server`, not `Prerender`** (`src/app/app.routes.server.ts`): the page shows today's date. Violation: the served HTML shows the day of the build.
- **Days are formatted with `formatBerlinDay` (`Europe/Berlin`) on server and client**, including the Discord title. SSR runs in the server's time zone. Violation: the date changes after hydration or shows the wrong day around midnight.
- **The photo data URL is capped at `maximumPhotoDataUrlLength` (900_000 characters), the route's `express.json` limit is `1mb`.** The shared host's ModSecurity WAF may reject JSON bodies over 1 MiB. Violation: large submissions fail at the WAF before they reach the app.
- **`postToDiscord` rebuilds the configured URL as the API v10 URL with `?wait=true`, the payload keeps `allowed_mentions: { parse: [] }`.** The URL Discord copies has no version and hits the deprecated API v6. Violation: without `wait=true` Discord answers with a fire-and-forget 204 instead of the message or an error, so failures go unnoticed; without the empty parse list, mentions such as `@everyone` in the free texts ping the channel.

## Testing

Specs under `src/server/` start with `// @vitest-environment node`, so they run on Node's own `fetch`, `FormData` and `Blob` like the production server; the unit-test builder's default jsdom environment replaces or wraps them. Keep the directive in new server specs.

## Negative knowledge

- OnPush is the default change detection in Angular 22 – never set `changeDetection` (OnPush rules in older convention templates predate v22).
- Angular's `DatePipe` takes no IANA zone names such as `Europe/Berlin`, only fixed offsets – use `formatBerlinDay`.

## Commands

- `npm test -- --watch=false`: single test run, as in CI.
- `npm run build`: production build into `dist/lunchbox-feedback/`.
