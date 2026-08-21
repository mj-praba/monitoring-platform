# Every final stage below runs `pnpm install --prod` against the SAME
# single root package.json/lockfile, so every process in the stack — api,
# websocket, both workers — resolves the exact same dependency versions.
# The trade-off: each image carries the full dependency set even though,
# e.g., cron-worker never touches @nestjs/swagger. Accepted deliberately —
# see backend/package.json's "keep deps centralized" rationale.

FROM node:22-slim AS base
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY tsconfig.json nest-cli.json ./
COPY apps ./apps
COPY packages ./packages

FROM base AS build
RUN pnpm build

FROM node:22-slim AS api
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile
COPY --from=build /app/dist/apps/api ./dist/apps/api
COPY --from=build /app/dist/packages ./dist/packages
EXPOSE 8001
CMD ["node", "dist/apps/api/src/main.js"]

FROM node:22-slim AS websocket
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile
COPY --from=build /app/dist/apps/websocket ./dist/apps/websocket
COPY --from=build /app/dist/packages ./dist/packages
EXPOSE 8002
CMD ["node", "dist/apps/websocket/src/main.js"]

FROM node:22-slim AS ingestion-worker
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile
COPY --from=build /app/dist/apps/workers/ingestion-worker ./dist/apps/workers/ingestion-worker
COPY --from=build /app/dist/packages ./dist/packages
CMD ["node", "dist/apps/workers/ingestion-worker/src/main.js"]

FROM node:22-slim AS cron-worker
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile
COPY --from=build /app/dist/apps/workers/cron-worker ./dist/apps/workers/cron-worker
COPY --from=build /app/dist/packages ./dist/packages
CMD ["node", "dist/apps/workers/cron-worker/src/main.js"]
