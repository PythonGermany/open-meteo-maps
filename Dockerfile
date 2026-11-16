# Self-hosted build: the static site served by static-web-server, with the
# response headers from static/_headers.
#
# The build needs the git metadata (see below). A git URL context drops .git
# unless BuildKit is told to keep it:
#   docker build --build-arg BUILDKIT_CONTEXT_KEEP_GIT_DIR=1 https://github.com/open-meteo/maps.git#main
#
# Base images are pinned by version and digest and updated by hand.
FROM node:26.13.1@sha256:e18c3ccdf7d71619990b0e85639f506e2028a95410999cab24cc373cbd10e0ac AS build
WORKDIR /src
# Optional data endpoint override (src/lib/helpers.ts); empty keeps the default
ARG VITE_DATA_BASE_URI
# Basemap TileJSON (OpenMapTiles schema, src/lib/map-controls.ts); the default
# tiles.open-meteo.com only allows the origin maps.open-meteo.com
ARG VITE_BASEMAP_TILES_URL=https://tiles.openfreemap.org/planet
COPY . .
# The build version comes from the commit (vite.config.ts); SvelteKit's update
# check depends on it
RUN git rev-parse HEAD
RUN npm ci && npm run build
RUN awk -f docker/headers.awk static/_headers >> docker/sws.toml

FROM joseluisq/static-web-server:2.44.2@sha256:23be6c04d474979d6e738081918f5874f88502a150d1123fd000719101a0f05c
COPY --from=build /src/build /public
COPY --from=build /src/docker/sws.toml /sws.toml
ENV SERVER_CONFIG_FILE=/sws.toml
