#!/bin/bash
# Quick test for Mission Control Discord webhooks
# Usage: ./test-webhook.sh [tasks|alerts|status|all]

set -e

# Load env
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

WEBHOOK_TYPE=${1:-all}

send_test() {
  local url=$1
  local name=$2
  
  if [ -z "$url" ]; then
    echo "❌ $name: No webhook URL configured"
    return
  fi
  
  echo "📤 Testing $name webhook..."
  
  curl -X POST "$url" \
    -H "Content-Type: application/json" \
    -d '{
      "username": "Mission Control Test",
      "embeds": [{
        "title": "🧪 Webhook Test",
        "description": "'"$name"' webhook is working!",
        "color": 3447003,
        "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'"
      }]
    }' && echo " ✅ Sent" || echo " ❌ Failed"
}

case $WEBHOOK_TYPE in
  tasks)
    send_test "$DISCORD_WEBHOOK_MISSION_CONTROL" "Tasks"
    ;;
  alerts)
    send_test "$DISCORD_WEBHOOK_ALERTS" "Alerts"
    ;;
  status)
    send_test "$DISCORD_WEBHOOK_STATUS" "Status"
    ;;
  all)
    send_test "$DISCORD_WEBHOOK_MISSION_CONTROL" "Tasks"
    send_test "$DISCORD_WEBHOOK_ALERTS" "Alerts"
    send_test "$DISCORD_WEBHOOK_STATUS" "Status"
    ;;
  *)
    echo "Usage: $0 [tasks|alerts|status|all]"
    exit 1
    ;;
esac
