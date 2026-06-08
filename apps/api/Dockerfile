FROM node:22-alpine AS builder
WORKDIR /repo
RUN corepack enable
COPY package.json yarn.lock .yarnrc.yml turbo.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/
COPY packages packages
COPY apps/api apps/api
RUN yarn install --immutable
RUN yarn workspace @hiring-os/db prisma generate
RUN yarn workspace @hiring-os/api build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /repo/node_modules ./node_modules
COPY --from=builder /repo/packages ./packages
COPY --from=builder /repo/apps/api/dist ./apps/api/dist
COPY --from=builder /repo/apps/api/package.json ./apps/api/package.json
EXPOSE 4001
CMD ["node", "apps/api/dist/index.js"]
