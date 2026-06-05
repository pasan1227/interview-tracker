---
name: run-interview-tracker
description: Run, launch, build, and screenshot the interview-tracker Next.js app. Use to start the dev server, log in as the seeded admin, navigate dashboard / candidates / interviews / feedback / reports / positions / settings, and capture screenshots to verify UI changes. Drives the running app via Playwright + system Chrome.
---

Next.js 16 (App Router) + Prisma 7 + next-auth v5 (credentials). All
paths below are relative to this directory (`interview-tracker/`). The
driver lives at `.claude/skills/run-interview-tracker/driver.mjs` and
talks to the dev server over HTTP — start the server first, then drive.

## Prerequisites

- Node 22.x (matches `package.json` engines via Next 16). `node -v` should print v22+.
- Yarn 4 (Berry, classic-`nodeLinker`). Comes via `corepack`; the repo ships `.yarnrc.yml` configured for `node-modules`.
- A Postgres URL in `.env` as `DATABASE_URL` (and optionally `DATABASE_URL_DIRECT`). The committed `.env` already points at a Neon dev DB that's seeded and works — no local Postgres needed for normal runs.
- Google Chrome installed at the system path (Playwright drives it via `channel: 'chrome'`). On macOS, `/Applications/Google Chrome.app` is fine; on Linux, install `google-chrome-stable`.

If you need a fully local DB instead of the committed remote one:

```bash
docker compose up -d postgres
# then in .env, set:
#   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/recruitment
#   DATABASE_URL_DIRECT=postgresql://postgres:postgres@localhost:5432/recruitment
yarn prisma migrate deploy
yarn db:seed
```

## Build

```bash
yarn install            # runs `prisma generate` via postinstall
yarn build              # production build (optional; dev server doesn't need it)
```

`prisma generate` writes its client to `lib/generated/prisma/` (configured in `prisma/schema.prisma`). That path is in the repo's `.gitignore`; if you see "Cannot find module '@/lib/generated/prisma/client'", run `yarn install` (or `yarn prisma generate`) to regenerate.

## Run — agent path (use this)

```bash
# 1. Start the dev server in the background. Keep this running for the rest of the session.
yarn dev >/tmp/it-dev.log 2>&1 &
# (or `next dev` directly via `node_modules/.bin/next dev`)

# 2. Wait for it / drive it. The driver auto-waits for /login to respond.
node .claude/skills/run-interview-tracker/driver.mjs smoke
#   → writes shots/landing.png, shots/login.png, shots/dashboard.png
#   → first run installs playwright-core into drv-node_modules/ (~150 MB,
#     ignored). No browser download — uses system Chrome.
```

Other driver commands:

```bash
# Screenshot any route (logs in first if the route needs auth)
node .claude/skills/run-interview-tracker/driver.mjs ss /dashboard/candidates
node .claude/skills/run-interview-tracker/driver.mjs ss /dashboard/interviews --out /tmp/iv.png

# Check what a route returns (no browser; pure fetch)
node .claude/skills/run-interview-tracker/driver.mjs open /dashboard
#   → "302 http://localhost:3000/dashboard -> /login?callbackUrl=%2Fdashboard"   (signed-out)

# Evaluate JS inside a logged-in page
node .claude/skills/run-interview-tracker/driver.mjs eval \
  "Array.from(document.querySelectorAll('table tbody tr')).length" \
  --route /dashboard/candidates
```

Test credentials (from `prisma/seed.ts`, password `password123` for all):

| Email | Role |
|---|---|
| `admin@company.com` | ADMIN |
| `sarah.johnson@company.com` | MANAGER |
| `alice.smith@company.com` | INTERVIEWER |

Override with `LOGIN_EMAIL=… LOGIN_PASS=… APP_URL=http://localhost:3000 node driver.mjs …`.

## Run — human path

```bash
yarn dev                # next-server on http://localhost:3000, hot reload
```

Open the browser to `/login`, sign in, navigate. Useless if you're driving from the terminal — use the agent path above.

## Test

There is no test suite (`package.json` has no `test` script). The smoke driver above IS the test — `smoke` covers landing → login → authed dashboard.

```bash
yarn lint               # ESLint over the repo
yarn tsc --noEmit       # type-check (no script alias)
```

## Gotchas

- **`.env` points at a remote Neon database by default.** It contains shared seed data plus whatever anyone else has been adding. If you're testing destructive flows (e.g. `yarn db:reset`), swap to local Postgres via the `docker compose` block above first — otherwise you wipe shared data.
- **`yarn db:reset` truncates everything before re-seeding.** It's `prisma migrate reset && yarn db:seed`. Don't run against the shared Neon DB unless you mean it.
- **Login button selector is text-based.** The form has `<input type="email">` / `<input type="password">` / `<button>Login</button>`. The driver uses `button:has-text("Login")` — if the label changes, update `login()` in `driver.mjs`.
- **`<title>` is `"Create Next App"` everywhere.** The default Next.js title was never replaced (see `app/layout.tsx`). Don't use `document.title` to detect which page you're on — use `page.url()` or DOM content.
- **Middleware redirects unauthenticated `/dashboard` → `/login?callbackUrl=…`** (`middleware.ts`). The driver follows this transparently because `login()` posts to the form before navigating to protected routes. `driver.mjs open /dashboard` deliberately shows the 302 unfollowed, so you can verify the gate.
- **Next dev compiles routes lazily.** First hit to any route can take 5–20 s while Turbopack builds. The driver uses generous 60 s timeouts. If a screenshot looks half-rendered, re-run — second hit is fast.
- **`next dev` shows a red "1 Issue" pill in the bottom corner.** That's the Next.js dev overlay, not an app bug. It appears in every screenshot taken against the dev server. To get a clean screenshot, build + `next start` instead.
- **The seeded admin is `admin@company.com`, not the email shown in your shell.** The driver hard-codes this; if you change the seed email, also update `LOGIN_EMAIL` (or the default in `driver.mjs`).
- **Two-factor confirmation can block login** (`auth.ts` `signIn` callback). Seeded users have it off; if you toggle it on, the credentials flow returns `false` and the driver's `waitForURL('/dashboard')` times out.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `FAIL: app at http://localhost:3000 did not respond within 60000ms` | `yarn dev` is not running, or it crashed. `tail /tmp/it-dev.log`. |
| `FAIL: Cannot find module '@/lib/generated/prisma/client'` (server-side, in `/tmp/it-dev.log`) | `yarn install` (postinstall runs `prisma generate`) or `yarn prisma generate`. |
| `FAIL: Executable doesn't exist at … chrome-mac` from Playwright | Driver couldn't find system Chrome. Install Google Chrome, or set `CHROME=/path/to/chrome node driver.mjs …`. |
| Login times out on `waitForURL('/dashboard')` | Wrong credentials, unverified user (`emailVerified` null), or 2FA enabled. Check the row in DB or re-seed. |
| `P1001: Can't reach database server` | `.env` `DATABASE_URL` is wrong / DB is down. For local: `docker compose up -d postgres`. |
| First screenshot is blank / partial | Turbopack still compiling that route. Re-run — second hit renders normally. |
