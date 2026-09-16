# Multi-stage production Dockerfile for BullMQ Worker
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

FROM base AS dependencies
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/database/package.json packages/database/
COPY apps/worker/package.json apps/worker/

RUN pnpm install --frozen-lockfile

FROM dependencies AS builder
COPY packages/shared packages/shared
COPY packages/database packages/database
COPY apps/worker apps/worker

RUN pnpm --filter @ems/shared build
RUN pnpm --filter @ems/database db:generate
RUN pnpm --filter @ems/worker build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

USER node

COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/packages/database/node_modules ./packages/database/node_modules
COPY --chown=node:node --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --chown=node:node --from=builder /app/packages/database/dist ./packages/database/dist
COPY --chown=node:node --from=builder /app/packages/database/prisma ./packages/database/prisma
COPY --chown=node:node --from=builder /app/apps/worker/dist ./apps/worker/dist
COPY --chown=node:node --from=builder /app/apps/worker/package.json ./apps/worker/package.json

CMD ["node", "apps/worker/dist/main.js"]
