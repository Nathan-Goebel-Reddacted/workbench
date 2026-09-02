# Les deux frontends sont servis par un seul nginx, sous une origine unique :
#   /        → frontend-public
#   /admin/  → frontend-private
#   /api/    → backend
# C'est cette origine unique qui permet au cookie de session de rester en SameSite=Lax
# et qui évite tout CORS.

FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/backend/package.json          ./packages/backend/
COPY packages/shared-ui/package.json        ./packages/shared-ui/
COPY packages/content-renderer/package.json ./packages/content-renderer/
COPY packages/frontend-public/package.json  ./packages/frontend-public/
COPY packages/frontend-private/package.json ./packages/frontend-private/
# Le backend est volontairement hors périmètre : bcrypt exigerait une chaîne de
# compilation native dont aucun build Vite n'a besoin.
RUN npm ci \
      --workspace=packages/shared-ui \
      --workspace=packages/content-renderer \
      --workspace=packages/frontend-public \
      --workspace=packages/frontend-private \
      --include-workspace-root

COPY packages/shared-ui/        ./packages/shared-ui/
COPY packages/content-renderer/ ./packages/content-renderer/
COPY packages/frontend-public/  ./packages/frontend-public/
COPY packages/frontend-private/ ./packages/frontend-private/

# Vite fige ces valeurs dans le bundle : elles sont un paramètre de build, pas d'exécution.
ARG VITE_API_URL
ARG VITE_PUBLIC_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_PUBLIC_URL=$VITE_PUBLIC_URL
# Lu par packages/frontend-private/vite.config.ts : fixe à la fois le préfixe des
# assets et le basename du routeur (via import.meta.env.BASE_URL).
ENV PRIVATE_BASE_PATH=/admin/

RUN npm run build --workspace=packages/frontend-public
RUN npm run build --workspace=packages/frontend-private

# ── nginx ────────────────────────────────────────────────────────────────────
FROM nginx:1.29-alpine AS prod
COPY --from=build /app/packages/frontend-public/dist/  /usr/share/nginx/html/
COPY --from=build /app/packages/frontend-private/dist/ /usr/share/nginx/html/admin/
COPY docker/web/default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
