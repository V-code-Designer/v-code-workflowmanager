#!/bin/bash

# Test script for Flow CRUD API with event metadata

BASE_URL="http://localhost:3000/api/flows"

echo "=== Testing Flow CRUD API with Event Metadata ==="
echo

# Test 1: Create a flow with webhook event
echo "1. Creating a flow with webhook event..."
WEBHOOK_RESPONSE=$(curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Webhook Flow",
    "description": "A flow triggered by webhook",
    "flow": "{\"steps\": [\"step1\", \"step2\"]}",
    "event": {
      "mode": "webhook",
      "command": "/api/trigger",
      "option": "async"
    }
  }')

WEBHOOK_ID=$(echo $WEBHOOK_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
echo "Created flow with ID: $WEBHOOK_ID"
echo "Response: $WEBHOOK_RESPONSE"
echo

# Test 2: Create a flow with scheduled event
echo "2. Creating a flow with scheduled event..."
SCHEDULED_RESPONSE=$(curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Scheduled Flow",
    "description": "A flow triggered on schedule",
    "flow": "{\"steps\": [\"backup\", \"notify\"]}",
    "event": {
      "mode": "scheduled",
      "command": "0 0 * * *",
      "option": "cron"
    }
  }')

SCHEDULED_ID=$(echo $SCHEDULED_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
echo "Created flow with ID: $SCHEDULED_ID"
echo "Response: $SCHEDULED_RESPONSE"
echo

# Test 3: Create a flow with manual event
echo "3. Creating a flow with manual event..."
MANUAL_RESPONSE=$(curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Manual Flow",
    "description": "A manually triggered flow",
    "flow": "{\"steps\": [\"validate\", \"process\"]}",
    "event": {
      "mode": "manual",
      "command": "",
      "option": ""
    }
  }')

MANUAL_ID=$(echo $MANUAL_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
echo "Created flow with ID: $MANUAL_ID"
echo "Response: $MANUAL_RESPONSE"
echo

# Test 4: Get all flows
echo "4. Getting all flows..."
ALL_FLOWS=$(curl -s -X GET "$BASE_URL")
echo "All flows: $ALL_FLOWS"
echo

# Test 5: Query flows by mode = webhook
echo "5. Querying flows with mode=webhook..."
WEBHOOK_FLOWS=$(curl -s -X GET "$BASE_URL?mode=webhook")
echo "Webhook flows: $WEBHOOK_FLOWS"
echo

# Test 6: Query flows by mode = scheduled
echo "6. Querying flows with mode=scheduled..."
SCHEDULED_FLOWS=$(curl -s -X GET "$BASE_URL?mode=scheduled")
echo "Scheduled flows: $SCHEDULED_FLOWS"
echo

# Test 7: Query flows by mode = manual
echo "7. Querying flows with mode=manual..."
MANUAL_FLOWS=$(curl -s -X GET "$BASE_URL?mode=manual")
echo "Manual flows: $MANUAL_FLOWS"
echo

# Test 7b: Create a flow with empty mode
echo "7b. Creating a flow with empty mode..."
EMPTY_MODE_RESPONSE=$(curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "No Mode Flow",
    "description": "A flow with empty mode",
    "flow": "{\"steps\": [\"step1\"]}",
    "event": {
      "mode": "",
      "command": "",
      "option": ""
    }
  }')

EMPTY_MODE_ID=$(echo $EMPTY_MODE_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
echo "Created flow with ID: $EMPTY_MODE_ID"
echo "Response: $EMPTY_MODE_RESPONSE"
echo

# Test 7c: Query flows with empty mode
echo "7c. Querying flows with mode='' (empty string)..."
EMPTY_MODE_FLOWS=$(curl -s -X GET "$BASE_URL?mode=")
echo "Empty mode flows: $EMPTY_MODE_FLOWS"
echo

# Test 8: Get specific flow by ID
if [ ! -z "$WEBHOOK_ID" ]; then
  echo "8. Getting flow by ID: $WEBHOOK_ID..."
  FLOW_BY_ID=$(curl -s -X GET "$BASE_URL/$WEBHOOK_ID")
  echo "Flow: $FLOW_BY_ID"
  echo
fi

# Test 9: Update flow event metadata
if [ ! -z "$WEBHOOK_ID" ]; then
  echo "9. Updating flow event metadata..."
  UPDATE_RESPONSE=$(curl -s -X PUT "$BASE_URL/$WEBHOOK_ID" \
    -H "Content-Type: application/json" \
    -d '{
      "event": {
        "mode": "webhook",
        "command": "/api/v2/trigger",
        "option": "sync"
      }
    }')
  echo "Updated flow: $UPDATE_RESPONSE"
  echo
fi

# Test 10: Delete flows
echo "10. Cleaning up - Deleting test flows..."
if [ ! -z "$WEBHOOK_ID" ]; then
  curl -s -X DELETE "$BASE_URL/$WEBHOOK_ID"
  echo "Deleted webhook flow"
fi
if [ ! -z "$SCHEDULED_ID" ]; then
  curl -s -X DELETE "$BASE_URL/$SCHEDULED_ID"
  echo "Deleted scheduled flow"
fi
if [ ! -z "$MANUAL_ID" ]; then
  curl -s -X DELETE "$BASE_URL/$MANUAL_ID"
  echo "Deleted manual flow"
fi
if [ ! -z "$EMPTY_MODE_ID" ]; then
  curl -s -X DELETE "$BASE_URL/$EMPTY_MODE_ID"
  echo "Deleted empty mode flow"
fi
echo

echo "=== Test completed ==="
