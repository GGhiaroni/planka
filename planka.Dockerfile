# Custom Planka image: official base + our backend modifications + rebuilt client.
#
# Stage 1: build the client with INDEX_FORMAT=ejs (the format Planka expects in production)
FROM node:22-alpine AS client-builder

WORKDIR /build

# Install build deps separately so npm install is cached
COPY client/package.json client/package-lock.json* ./
RUN npm install

# Copy the rest of the client source
COPY client/ ./

# Build to dist/
RUN INDEX_FORMAT=ejs npm run build


# Stage 2: official Planka image with our overlays
FROM ghcr.io/plankanban/planka:latest

# --- Backend overlays (logging + table view + custom field actions) ---
COPY server/api/models/Action.js /app/api/models/Action.js
COPY server/api/models/Board.js  /app/api/models/Board.js
COPY server/api/helpers/cards/update-one.js                                /app/api/helpers/cards/update-one.js
COPY server/api/helpers/card-labels/create-one.js                          /app/api/helpers/card-labels/create-one.js
COPY server/api/helpers/card-labels/delete-one.js                          /app/api/helpers/card-labels/delete-one.js
COPY server/api/helpers/custom-field-values/create-or-update-one.js        /app/api/helpers/custom-field-values/create-or-update-one.js

# --- Client overlays (table view, drag/drop, autocomplete, activity log) ---
COPY --from=client-builder /build/dist/assets/   /app/public/assets/
COPY --from=client-builder /build/dist/index.ejs /app/views/index.ejs
