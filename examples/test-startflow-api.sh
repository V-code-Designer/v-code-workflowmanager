#!/bin/bash

# Test script for Start Flow API (Event-based)

BASE_URL="http://localhost:3000"
FLOWS_URL="$BASE_URL/api/flows"
STARTFLOW_URL="$BASE_URL/api/startflow"

echo "=== Testing Start Flow API (Event-Based) ==="
echo

# Test 1: Create test flows with different event modes
echo "1. Creating test flows with webhook event..."
WEBHOOK_FLOW_1=$(curl -s -X POST "$FLOWS_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Order Processing Flow",
    "description": "Process customer orders via webhook",
    "flow": "{\"steps\": [{\"id\": \"validate\", \"type\": \"validator\"}, {\"id\": \"process\", \"type\": \"processor\"}]}",
    "event": {
      "mode": "webhook",
      "command": "/api/orders",
      "option": "async"
    }
  }')

WEBHOOK_FLOW_ID_1=$(echo $WEBHOOK_FLOW_1 | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
echo "Created webhook flow 1: $WEBHOOK_FLOW_ID_1"

WEBHOOK_FLOW_2=$(curl -s -X POST "$FLOWS_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Payment Processing Flow",
    "description": "Process payments via webhook",
    "flow": "{\"steps\": [{\"id\": \"validatePayment\", \"type\": \"validator\"}]}",
    "event": {
      "mode": "webhook",
      "command": "/api/payments",
      "option": "sync"
    }
  }')

WEBHOOK_FLOW_ID_2=$(echo $WEBHOOK_FLOW_2 | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
echo "Created webhook flow 2: $WEBHOOK_FLOW_ID_2"
echo

# Test 2: Start flows by event mode with inputData
echo "2. Starting all webhook flows with inputData..."
START_RESPONSE=$(curl -s -X POST "$STARTFLOW_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "inputData": {
      "a1": "2",
      "a2": "3",
      "orderId": "ORD-12345",
      "amount": "150.50"
    },
    "event": "webhook",
    "arrayType": false
  }')

echo "Start Flow Response: $START_RESPONSE"
echo

# Test 3: Try to start flow with empty body (should fail)
echo "3. Testing with empty body (should fail with 400)..."
ERROR_RESPONSE=$(curl -s -X POST "$STARTFLOW_URL" \
  -H "Content-Type: application/json" \
  -d '{}')

echo "Error Response: $ERROR_RESPONSE"
echo

# Test 4: Try to start flow without event field (should fail)
echo "4. Testing without event field (should fail with 400)..."
ERROR_RESPONSE=$(curl -s -X POST "$STARTFLOW_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "inputData": {
      "a1": "2"
    }
  }')

echo "Error Response: $ERROR_RESPONSE"
echo

# Test 5: Try to start flow without inputData (should fail)
echo "5. Testing without inputData (should fail with 400)..."
ERROR_RESPONSE=$(curl -s -X POST "$STARTFLOW_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "webhook"
  }')

echo "Error Response: $ERROR_RESPONSE"
echo

# Test 6: Try to start flows for non-existent event mode (should fail)
echo "6. Testing with non-existent event mode (should fail with 404)..."
ERROR_RESPONSE=$(curl -s -X POST "$STARTFLOW_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "inputData": {
      "a1": "2"
    },
    "event": "nonexistent",
    "arrayType": false
  }')

echo "Error Response: $ERROR_RESPONSE"
echo

# Test 7: Create and start a scheduled flow
echo "7. Creating a scheduled flow..."
SCHEDULED_FLOW=$(curl -s -X POST "$FLOWS_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Daily Backup Flow",
    "description": "Automated daily backup",
    "flow": "{\"steps\": [{\"id\": \"backup\", \"type\": \"backup\"}]}",
    "event": {
      "mode": "scheduled",
      "command": "0 2 * * *",
      "option": "cron"
    }
  }')

SCHEDULED_FLOW_ID=$(echo $SCHEDULED_FLOW | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
echo "Created scheduled flow: $SCHEDULED_FLOW_ID"

START_SCHEDULED=$(curl -s -X POST "$STARTFLOW_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "inputData": {
      "backupType": "full",
      "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
    },
    "event": "scheduled",
    "arrayType": false
  }')

echo "Scheduled Flow Start Response: $START_SCHEDULED"
echo

# Test 8: Start with arrayType = true
echo "8. Starting flows with arrayType = true..."
ARRAY_RESPONSE=$(curl -s -X POST "$STARTFLOW_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "inputData": {
      "items": ["item1", "item2", "item3"],
      "processAll": "true"
    },
    "event": "webhook",
    "arrayType": true
  }')

echo "Array Type Response: $ARRAY_RESPONSE"
echo

# Test 9: Start flow multiple times (simulating concurrent webhook calls)
echo "9. Starting webhook flows multiple times (concurrent test)..."
for i in {1..3}; do
  curl -s -X POST "$STARTFLOW_URL" \
    -H "Content-Type: application/json" \
    -d '{
      "inputData": {
        "batchId": "BATCH-'$i'",
        "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
      },
      "event": "webhook",
      "arrayType": false
    }' &
done

wait
echo "All concurrent requests completed"
echo

# Test 10: Verify flows still exist
echo "10. Verifying flows..."
VERIFY_WEBHOOK=$(curl -s -X GET "$FLOWS_URL/$WEBHOOK_FLOW_ID_1")
echo "Webhook Flow 1: $(echo $VERIFY_WEBHOOK | grep -o '"name":"[^"]*"')"
echo

# Test 11: Query flows by mode
echo "11. Querying all webhook flows..."
ALL_WEBHOOK_FLOWS=$(curl -s -X GET "$FLOWS_URL?mode=webhook")
WEBHOOK_COUNT=$(echo $ALL_WEBHOOK_FLOWS | grep -o '"id"' | wc -l)
echo "Found $WEBHOOK_COUNT webhook flows"
echo

# Test 12: Cleanup
echo "12. Cleaning up test flows..."
if [ ! -z "$WEBHOOK_FLOW_ID_1" ]; then
  curl -s -X DELETE "$FLOWS_URL/$WEBHOOK_FLOW_ID_1"
  echo "Deleted flow: $WEBHOOK_FLOW_ID_1"
fi

if [ ! -z "$WEBHOOK_FLOW_ID_2" ]; then
  curl -s -X DELETE "$FLOWS_URL/$WEBHOOK_FLOW_ID_2"
  echo "Deleted flow: $WEBHOOK_FLOW_ID_2"
fi

if [ ! -z "$SCHEDULED_FLOW_ID" ]; then
  curl -s -X DELETE "$FLOWS_URL/$SCHEDULED_FLOW_ID"
  echo "Deleted flow: $SCHEDULED_FLOW_ID"
fi
echo

echo "=== Test completed ==="
echo
echo "Summary:"
echo "- Created multiple flows with different event modes"
echo "- Started flows by event mode (not by flowId)"
echo "- Tested error handling (empty body, missing fields, invalid event)"
echo "- Tested with arrayType true/false"
echo "- Tested concurrent execution"
echo "- All flows matching event mode are started"
echo "- Cleaned up test data"
