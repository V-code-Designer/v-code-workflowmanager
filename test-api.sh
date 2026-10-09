#!/bin/bash

echo "================================================"
echo "Flow Manager API Testing Script"
echo "================================================"
echo ""

BASE_URL="http://localhost:3000"

echo "1. Testing API Root Endpoint"
echo "----------------------------"
curl -s $BASE_URL | jq .
echo ""

echo "2. Creating a New Flow"
echo "----------------------"
RESPONSE=$(curl -s -X POST $BASE_URL/api/flows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Data Processing Pipeline",
    "description": "ETL workflow for data processing",
    "flow": "{\"steps\": [\"extract\", \"transform\", \"load\"], \"schedule\": \"daily\"}"
  }')
echo "$RESPONSE" | jq .
FLOW_ID=$(echo "$RESPONSE" | jq -r '.id')
echo ""

echo "3. Creating Another Flow"
echo "------------------------"
curl -s -X POST $BASE_URL/api/flows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "User Onboarding Flow",
    "description": "Automated user onboarding process",
    "flow": "{\"steps\": [\"register\", \"verify_email\", \"setup_profile\", \"welcome_email\"]}"
  }' | jq .
echo ""

echo "4. Getting All Flows"
echo "--------------------"
curl -s $BASE_URL/api/flows | jq .
echo ""

echo "5. Getting Flow by ID"
echo "---------------------"
curl -s $BASE_URL/api/flows/$FLOW_ID | jq .
echo ""

echo "6. Updating a Flow"
echo "------------------"
curl -s -X PUT $BASE_URL/api/flows/$FLOW_ID \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Enhanced Data Processing Pipeline",
    "description": "Updated ETL workflow with error handling"
  }' | jq .
echo ""

echo "7. Verifying Update"
echo "-------------------"
curl -s $BASE_URL/api/flows/$FLOW_ID | jq .
echo ""

echo "8. Deleting a Flow"
echo "------------------"
curl -s -X DELETE $BASE_URL/api/flows/$FLOW_ID | jq .
echo ""

echo "9. Verifying Deletion (should return 404)"
echo "------------------------------------------"
curl -s $BASE_URL/api/flows/$FLOW_ID | jq .
echo ""

echo "10. Final List of Flows"
echo "-----------------------"
curl -s $BASE_URL/api/flows | jq .
echo ""

echo "================================================"
echo "Testing Complete!"
echo ""
echo "Swagger UI: $BASE_URL/api-docs/"
echo "API Spec JSON: $BASE_URL/api-docs.json"
echo "================================================"
