# syntax=docker/dockerfile:1

# Lightweight local stack: node:22-alpine + Next standalone output.
# Web image stays small; the realtime twin has its own tiny dependency set so
# it never pulls the Next.js build layers.

FROM node:22-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time placeholders only (never copied into the runner). Real values are
# injected at runtime by docker compose / the host.
ENV NODE_ENV=production
ENV NEXT_OUTPUT_STANDALONE=1
ARG BETTER_AUTH_URL=http://localhost:3000
ARG DATABASE_URL=postgres://build:build@127.0.0.1:5432/bookloop
ARG BETTER_AUTH_SECRET=build-only-placeholder-not-a-real-secret-000000
ARG CHAT_JWT_SECRET=build-only-placeholder-not-a-real-secret-000000
ENV BETTER_AUTH_URL=$BETTER_AUTH_URL
ENV DATABASE_URL=$DATABASE_URL
ENV BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET
ENV CHAT_JWT_SECRET=$CHAT_JWT_SECRET

RUN npm run build

# Local realtime twin (socket.io + pg_notify listener). Optional profile.
# Separate tiny manifest so the image stays around the size of the base image;
# node:22 runs the single-file TypeScript server natively.
FROM node:22-alpine AS realtime
WORKDIR /app
ENV NODE_ENV=production
ENV REALTIME_PORT=4001
COPY realtime/package.json ./
RUN npm install --omit=dev --no-audit --no-fund && npm cache clean --force
COPY realtime/server.ts ./
USER node
EXPOSE 4001
CMD ["node", "server.ts"]

# Web app — keep this last: a plain build/deploy packs the final stage.
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
