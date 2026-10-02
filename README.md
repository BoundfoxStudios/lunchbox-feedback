# Lunchbox Feedback

A personal mobile one-pager on which the teacher grades the lunchbox of the day; the server forwards every report card to a Discord channel.

## Local development

Requires Node.js 24 (see `.nvmrc`).

```bash
npm ci
npm start
```

Open http://localhost:4200.

> **Warning:** `npm start` runs the real API. With `DISCORD_WEBHOOK_URL=<webhook-url> npm start`, submitting a report card in development posts to that Discord channel; without the variable the page works, and every submission fails with 502.

`TEACHER_NAME=<name>` greets the teacher by name and signs the sent report card with it; without it the page uses neutral copy.

```bash
npm test                    # watch mode
npm test -- --watch=false   # single run, as in CI
```

## Production build

```bash
npm run build
NG_ALLOWED_HOSTS=localhost DISCORD_WEBHOOK_URL=<webhook-url> node dist/lunchbox-feedback/server/server.mjs
```

The server listens on `PORT` or 4000. The build is self-contained: `dist/lunchbox-feedback/` needs no `node_modules`. Angular SSR answers 400 for every host missing from the comma-separated `NG_ALLOWED_HOSTS`; `security.allowedHosts` in `angular.json` stays empty, so the production domain stays out of the repository.

## Deployment

1. A push to `main` runs `.github/workflows/deploy.yml`: it tests, builds and replaces the content of the branch `deployment/production` with the build output plus `hosting/app.cjs`, the Passenger startup file.
2. Plesk pulls `deployment/production` into `httpdocs`, triggered by a GitHub push webhook.
3. The pull rewrites `tmp/restart.txt`, so Passenger restarts the app on the next request.
4. The workflow polls `/build-id.txt` until it serves the new build, then purges the Cloudflare cache.

An unchanged build produces no commit and triggers nothing.

### One-time setup

1. Add the repository secrets `PRODUCTION_URL` (the production URL without a trailing slash, for example `https://example.com`), `CF_ZONE_ID` (the zone ID of the domain) and `CF_API_TOKEN` (an API token with the permission Zone → Cache Purge for this zone). The GitHub App credentials come from the BoundfoxStudios organization.
2. Run the workflow once (push to `main` or `gh workflow run Deploy`) so that `deployment/production` exists. The purge step of this first run fails after its poll timeout because the origin serves nothing yet.
3. In Plesk, delete the default files in `httpdocs` and create the empty folder `httpdocs/browser` in the File Manager.
4. Configure Node.js for the domain and decline Plesk's framework auto-configuration:

   | Setting                      | Value                                                                                                                                                                                                             |
   | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
   | Node.js version              | 24.x                                                                                                                                                                                                              |
   | Application Root             | `/httpdocs`                                                                                                                                                                                                       |
   | Document Root                | `/httpdocs/browser`                                                                                                                                                                                               |
   | Application Startup File     | `app.cjs`                                                                                                                                                                                                         |
   | Application Mode             | `production`                                                                                                                                                                                                      |
   | Custom environment variables | `DISCORD_WEBHOOK_URL` (the webhook URL as Discord copies it), `NG_ALLOWED_HOSTS` (the production domain, for example `example.com`), `TEACHER_NAME` (the teacher's first name for the greeting and the signature) |
   | NPM install                  | none, the build ships no `package.json`                                                                                                                                                                           |

5. Open Git for the domain and add the repository with the deployment path `/httpdocs` and automatic deployment. Use the repository's HTTPS URL; it is public, so no deploy key is needed. The dialog has no branch field, so switch to `deployment/production` afterwards via Change branch and path.
6. Add the webhook URL Plesk shows as a push webhook in the GitHub repository settings, then pull the updates once.
7. Restart the app once.

After the deployment, `<production-url>/build-id.txt` must return the content of `browser/build-id.txt` on `deployment/production`. The page itself answers 400 if `NG_ALLOWED_HOSTS` does not list the domain. Then submit one report card: it must arrive in the Discord channel. If the page shows the error state instead, the app log names the cause, for example `DISCORD_WEBHOOK_URL is not set`.
