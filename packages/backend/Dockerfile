FROM node:22-alpine AS base
# bcrypt requires native compilation
RUN apk add --no-cache python3 make g++
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/backend/package.json ./packages/backend/
COPY packages/frontend/package.json ./packages/frontend/
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
COPY packages/backend/package.json ./packages/backend/
COPY packages/frontend/package.json ./packages/frontend/
RUN npm ci --omit=dev
COPY --from=build /app/packages/backend/dist ./packages/backend/dist
EXPOSE 3000
CMD ["node", "packages/backend/dist/index.js"]
