# Image du site TrustiScore pour Hyperfluid : pages statiques + API Express (backend/).
# Construite par .github/workflows/hyperfluid-image.yml, déployée via hyperfluid.toml.

# --- Dépendances (bcrypt peut avoir besoin de compiler) ---
FROM node:22-alpine AS deps
WORKDIR /app/backend
RUN apk add --no-cache python3 make g++
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# --- Image finale ---
FROM node:22-alpine
ENV NODE_ENV=production PORT=3000
WORKDIR /app
RUN apk upgrade --no-cache \
 && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx \
           /opt/yarn-* /usr/local/bin/yarn /usr/local/bin/yarnpkg
COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY backend/package.json backend/server.js ./backend/
COPY backend/seed-config.json* ./backend/
# Pages publiques uniquement (pas les .md, scripts ni exemples de config)
COPY *.html robots.txt ./public/
COPY assets ./public/assets
# Mention « Hébergé en France par Hyperfluid » (script + logo récupéré par le workflow)
COPY deploy/hyperfluid/hosting.js ./public/assets/hosting.js
COPY deploy/hyperfluid/*.svg ./public/assets/hosting/
# server.js lit aussi ../assets/config.json (configuration par défaut)
RUN ln -s /app/public/assets /app/assets
USER node
EXPOSE 3000
CMD ["node", "backend/server.js"]
