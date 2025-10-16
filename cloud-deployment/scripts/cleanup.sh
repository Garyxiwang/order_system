#!/usr/bin/env bash

set -euo pipefail

# Simple Docker cleanup helper
# - Lists disk usage
# - Optionally prunes unused images, containers, volumes, builder cache
# - Truncates oversized container logs
# - Rotates Nginx logs (optional) by signaling reopen
#
# Usage:
#   ./cloud-deployment/scripts/cleanup.sh --dry-run
#   ./cloud-deployment/scripts/cleanup.sh --prune --days 7
#   ./cloud-deployment/scripts/cleanup.sh --truncate-logs --max-size 200M
#   ./cloud-deployment/scripts/cleanup.sh --rotate-nginx --container order_system_nginx

DAYS=7
MAX_LOG_SIZE="200M"
DO_DRY_RUN=false
DO_PRUNE=false
DO_TRUNCATE_LOGS=false
DO_ROTATE_NGINX=false
NGINX_CONTAINER="order_system_nginx"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      DO_DRY_RUN=true
      shift ;;
    --prune)
      DO_PRUNE=true
      shift ;;
    --days)
      DAYS="$2"
      shift 2 ;;
    --truncate-logs)
      DO_TRUNCATE_LOGS=true
      shift ;;
    --max-size)
      MAX_LOG_SIZE="$2"
      shift 2 ;;
    --rotate-nginx)
      DO_ROTATE_NGINX=true
      shift ;;
    --container)
      NGINX_CONTAINER="$2"
      shift 2 ;;
    *)
      echo "Unknown option: $1" >&2
      exit 1 ;;
  esac
done

echo "== Docker disk usage =="
docker system df || true

if $DO_DRY_RUN; then
  echo "(dry-run) Listing candidates for prune older than $DAYS days"
  echo "Images:"
  docker images --format '{{.Repository}}:{{.Tag}}\t{{.ID}}\t{{.CreatedSince}}' | sort || true
  echo "Volumes (dangling):"
  docker volume ls --filter dangling=true || true
  echo "Builder cache (dry-run):"
  if docker buildx version >/dev/null 2>&1; then
    docker buildx prune --filter "until=${DAYS}d" --verbose --dry-run || true
  else
    echo "docker buildx not available; skipping cache dry-run (some docker builder versions do not support --dry-run)"
  fi
fi

if $DO_PRUNE; then
  echo "== Pruning unused Docker data (older than $DAYS days) =="
  docker container prune -f --filter "until=${DAYS}d" || true
  docker image prune -a -f || true
  docker volume prune -f || true
  if docker buildx version >/dev/null 2>&1; then
    docker buildx prune -a -f --filter "until=${DAYS}d" || true
  else
    docker builder prune -a -f --filter "until=${DAYS}d" || true
  fi
fi

if $DO_TRUNCATE_LOGS; then
  echo "== Truncating oversized container logs (> $MAX_LOG_SIZE) =="
  # Truncate JSON-file logs under /var/lib/docker/containers
  sudo find /var/lib/docker/containers -type f -name "*.log" -size +"$MAX_LOG_SIZE" -print -exec truncate -s 0 {} \; || true
  # Truncate mounted nginx logs under project logs directory (local compose)
  if [[ -d "$(pwd)/logs/nginx" ]]; then
    find "$(pwd)/logs/nginx" -type f -name "*.log" -size +"$MAX_LOG_SIZE" -print -exec truncate -s 0 {} \; || true
  fi
fi

if $DO_ROTATE_NGINX; then
  echo "== Rotating Nginx logs in container: $NGINX_CONTAINER =="
  # Move current log files to .1 and signal nginx to reopen logs
  docker exec "$NGINX_CONTAINER" sh -lc '
    set -e
    for f in /var/log/nginx/*.log; do
      [ -f "$f" ] && mv "$f" "$f.$(date +%Y%m%d%H%M%S)"
    done
    nginx -s reopen
  ' || true
fi

echo "== Cleanup complete =="