#!/usr/bin/env bash

set -euo pipefail;

PORT="${1:-${SAT_TRACKER_PORT:-8987}}";

export HOST_UID="$(id -u)";
export HOST_GID="$(id -g)";
export SAT_TRACKER_PORT="$PORT";

docker compose up -d --build;
