#!/usr/bin/env bash
set -euo pipefail

echo "[RTPSC TAXPRAC] Local container validation only."
echo "[RTPSC TAXPRAC] Production infrastructure is deployed through reviewed IaC/CI."

if [[ "${ALLOW_LOCAL_COMPOSE:-false}" != "true" ]]; then
  echo "Refusing to start local containers without ALLOW_LOCAL_COMPOSE=true."
  exit 1
fi

required_vars=(
  SUPABASE_URL
  SUPABASE_PUBLISHABLE_KEY
)

for name in "${required_vars[@]}"; do
  if [[ -z "${!name:-}" ]]; then
    echo "Missing required environment variable: ${name}"
    exit 1
  fi
done

docker compose config --quiet
docker compose build --no-cache
docker compose up -d

echo "[RTPSC TAXPRAC] Local validation stack started."
echo "[RTPSC TAXPRAC] This output is not evidence of a production deployment."
