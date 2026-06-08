# Conventions

## Git commits
- Do NOT add a `Co-Authored-By: Claude ...` trailer to commits. Write the commit body only.

## Dev server
- If `next dev` (Turbopack) starts throwing `PrismaClientKnownRequestError: Invalid …db.user.findUnique() invocation` after hot-reloads, restart the dev server. Turbopack occasionally loses the Prisma client module reference on long-running sessions; a fresh `yarn dev` clears it. Does not reproduce under `next build` / `next start`.

