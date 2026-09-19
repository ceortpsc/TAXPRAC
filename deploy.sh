#!/bin/bash
set -e
echo "[RTPSC Deployment] Initializing deployment sequence for CAF: 0316-76228R..."

if [ ! -f .env.production ]; then
    cat <<EOF > .env.production
EXPO_PUBLIC_SUPABASE_URL=https://tpiuxyxofggsossstyik.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=sb_publishable_Fus5iPRQ5-jIV3ePOVxneg_0s8VLQtf
REDIS_URL=redis://redis-broker:6379/0
CAF_NUMBER=0316-76228R
EOF
fi

docker-compose build --no-cache
docker-compose up -d
echo "[RTPSC Deployment] SUCCESS: RTPSC Platform is LIVE."
