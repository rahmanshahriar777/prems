# Multi-stage production Dockerfile for Next.js Frontend
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

FROM base AS dependencies
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/web/package.json apps/web/

RUN pnpm install --frozen-lockfile

FROM dependencies AS builder
COPY packages/shared packages/shared
COPY apps/web apps/web

RUN pnpm --filter @ems/shared build
RUN pnpm --filter @ems/web build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache curl

USER node

COPY --chown=node:node --from=builder /app/apps/web/public ./public
COPY --chown=node:node --from=builder /app/apps/web/.next/standalone ./
COPY --chown=node:node --from=builder /app/apps/web/.next/static ./.next/static

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD curl -f http://localhost:3000 || exit 1

CMD ["node", "apps/web/server.js"]
