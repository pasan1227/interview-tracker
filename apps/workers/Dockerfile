# apps/workers/Dockerfile
#
# Multi-stage build. The first stage compiles TypeScript with the full
# workspace; the second stage ships only node_modules + compiled JS.
# Build context is the repo root: `docker build -f apps/workers/Dockerfile .`

FROM node:22-alpine AS builder
WORKDIR /repo
RUN corepack enable
COPY package.json yarn.lock .yarnrc.yml turbo.json tsconfig.base.json ./
COPY apps/workers/package.json apps/workers/
COPY packages packages
COPY apps/workers apps/workers
RUN yarn install --immutable
RUN yarn workspace @hiring-os/db prisma generate
RUN yarn workspace @hiring-os/workers build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /repo/node_modules ./node_modules
COPY --from=builder /repo/packages ./packages
COPY --from=builder /repo/apps/workers/dist ./apps/workers/dist
COPY --from=builder /repo/apps/workers/package.json ./apps/workers/package.json
EXPOSE 4002
CMD ["node", "apps/workers/dist/index.js"]
