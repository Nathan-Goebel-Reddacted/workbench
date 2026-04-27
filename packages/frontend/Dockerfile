FROM node:22-alpine AS base
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/backend/package.json ./packages/backend/
COPY packages/frontend/package.json ./packages/frontend/
RUN npm ci

# ── dev ──────────────────────────────────────────────────────────────────────
FROM base AS dev
CMD ["npm", "run", "dev:frontend"]

# ── build ────────────────────────────────────────────────────────────────────
FROM base AS build
COPY packages/frontend/ ./packages/frontend/
RUN npm run build --workspace=packages/frontend

# ── prod ─────────────────────────────────────────────────────────────────────
FROM nginx:alpine AS prod
COPY --from=build /app/packages/frontend/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
