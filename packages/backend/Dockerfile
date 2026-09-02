FROM node:22-alpine AS base
# bcrypt requires native compilation
RUN apk add --no-cache python3 make g++
WORKDIR /app

# Every workspace listed in the root package.json must be present for `npm ci` to
# validate the lockfile, even when only the backend's tree is installed.
COPY package.json package-lock.json ./
COPY packages/backend/package.json          ./packages/backend/
COPY packages/shared-ui/package.json        ./packages/shared-ui/
COPY packages/content-renderer/package.json ./packages/content-renderer/
COPY packages/frontend-public/package.json  ./packages/frontend-public/
COPY packages/frontend-private/package.json ./packages/frontend-private/
RUN npm ci

# ── dev ──────────────────────────────────────────────────────────────────────
FROM base AS dev
CMD ["npm", "run", "dev:backend"]

# ── build ────────────────────────────────────────────────────────────────────
FROM base AS build
COPY packages/backend/ ./packages/backend/
RUN npm run build --workspace=packages/backend

# ── prod ─────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS prod
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/backend/package.json          ./packages/backend/
COPY packages/shared-ui/package.json        ./packages/shared-ui/
COPY packages/content-renderer/package.json ./packages/content-renderer/
COPY packages/frontend-public/package.json  ./packages/frontend-public/
COPY packages/frontend-private/package.json ./packages/frontend-private/
# @mikro-orm/reflection lit les métadonnées au démarrage : ts-morph reste requis en prod.
RUN npm ci --omit=dev --workspace=packages/backend --include-workspace-root
COPY --from=build /app/packages/backend/dist ./packages/backend/dist
EXPOSE 3000
CMD ["node", "packages/backend/dist/index.js"]
