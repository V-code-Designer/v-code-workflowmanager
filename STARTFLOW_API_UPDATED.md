# Start Flow API Documentation (Event-Based)

## Overview

The Start Flow API triggers flow execution by event mode. When you call this endpoint with an event type (e.g., "webhook"), it automatically finds **all flows** with that event mode and starts them all with the provided input data.

## Key Concept

**Event-Based Triggering**: Instead of starting a specific flow by ID, you start all flows that match an event mode. This is useful for:
- Webhook scenarios where multiple flows should process the same incoming data
- Broadcasting events to all interested flows
- Parallel processing of the same input by different flows

## Endpoint

**POST** `/api/startflow`

## Request Format

### Required Fields

```json
{
  "inputData": {
    // Key-value pairs with your data
  },
  "event": "string",
  "arrayType": boolean
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `inputData` | object | Yes | Input data as key-value pairs (e.g., `{"a1":"2", "a2":"3"}`) |
| `event` | string | Yes | Event mode to match flows against (e.g., "webhook", "scheduled", "manual") |
| `arrayType` | boolean | No | Whether to process input data as an array (default: false) |

### Examples

#### Basic Example
```json
{
  "inputData": {
    "a1": "2",
    "a2": "3"
  },
  "event": "webhook",
  "arrayType": false
}
```

#### Order Processing Example
```json
{
  "inputData": {
    "orderId": "ORD-12345",
    "customerId": "CUST-67890",
    "totalAmount": "150.50",
    "items": "3"
  },
  "event": "webhook",
  "arrayType": false
}
```

#### Batch Processing Example
```json
{
  "inputData": {
    "batchId": "BATCH-001",
    "records": ["rec1", "rec2", "rec3"],
    "count": "3"
  },
  "event": "scheduled",
  "arrayType": true
}
```

## Response Format

### Success Response (202 Accepted)

When flows are found and started:

```json
{
  "message": "Flow start events published successfully",
  "topic": "flow.start",
  "eventId": "flow-1697123456789-abc123",
  "timestamp": "2026-10-15T12:00:00.000Z",
  "flowsStarted": 2,
  "flows": [
    {
      "flowId": "550e8400-e29b-41d4-a716-446655440000",
      "flowName": "Order Processing Flow"
    },
    {
      "flowId": "660e8400-e29b-41d4-a716-446655440001",
      "flowName": "Payment Processing Flow"
    }
  ],
  "inputData": {
    "a1": "2",
    "a2": "3"
  },
  "arrayType": false
}
```

### Error Responses

#### 400 Bad Request - Empty Body
```json
{
  "error": "Bad Request",
  "message": "Request body cannot be empty"
}
```

#### 400 Bad Request - Missing event
```json
{
  "error": "Bad Request",
  "message": "event is required"
}
```

#### 400 Bad Request - Missing or invalid inputData
```json
{
  "error": "Bad Request",
  "message": "inputData is required and must be an object"
}
```

#### 404 Not Found - No Matching Flows
```json
{
  "error": "Not Found",
  "message": "No flows found with event mode 'webhook'"
}
```

#### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "Failed to publish flow start event"
}
```

## Status Codes

| Code | Description |
|------|-------------|
| 202 | Accepted - Event(s) published successfully |
| 400 | Bad Request - Invalid or missing data |
| 404 | Not Found - No flows match the event mode |
| 500 | Internal Server Error - Event store failure |

## How It Works

```
1. Client sends request with event mode and inputData
   ↓
2. API queries database for all flows with event.mode = {event}
   ↓
3. If flows found:
   - For each flow:
     - Create event payload with flow details
     - Publish to event store
   - Return success with list of started flows
   ↓
4. If no flows found:
   - Return 404 error
```

## Usage Examples

### cURL Examples

#### Start All Webhook Flows
```bash
curl -X POST http://localhost:3000/api/startflow \
  -H "Content-Type: application/json" \
  -d '{
    "inputData": {
      "a1": "2",
      "a2": "3",
      "orderId": "ORD-12345"
    },
    "event": "webhook",
    "arrayType": false
  }'
```

#### Start All Scheduled Flows
```bash
curl -X POST http://localhost:3000/api/startflow \
  -H "Content-Type: application/json" \
  -d '{
    "inputData": {
      "backupType": "full",
      "timestamp": "2026-10-15T02:00:00Z"
    },
    "event": "scheduled",
    "arrayType": false
  }'
```

#### Start with Array Processing
```bash
curl -X POST http://localhost:3000/api/startflow \
  -H "Content-Type: application/json" \
  -d '{
    "inputData": {
      "items": ["item1", "item2", "item3"],
      "count": "3"
    },
    "event": "webhook",
    "arrayType": true
  }'
```

### JavaScript/Fetch

```javascript
async function startFlows(inputData, eventMode, arrayType = false) {
  const response = await fetch('http://localhost:3000/api/startflow', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputData,
      event: eventMode,
      arrayType,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return response.json();
}

// Usage
try {
  const result = await startFlows(
    { a1: '2', a2: '3', orderId: 'ORD-12345' },
    'webhook',
    false
  );
  console.log(`Started ${result.flowsStarted} flows:`, result.flows);
} catch (error) {
  console.error('Failed to start flows:', error.message);
}
```

### TypeScript Client

```typescript
interface StartFlowRequest {
  inputData: Record<string, string | number | boolean | any>;
  event: string;
  arrayType?: boolean;
}

interface FlowStarted {
  flowId: string;
  flowName: string;
}

interface StartFlowResponse {
  message: string;
  topic: string;
  eventId: string;
  timestamp: string;
  flowsStarted: number;
  flows: FlowStarted[];
  inputData: Record<string, any>;
  arrayType: boolean;
}

class FlowStartClient {
  constructor(private baseUrl: string = 'http://localhost:3000') {}

  async startFlows(request: StartFlowRequest): Promise<StartFlowResponse> {
    const response = await fetch(`${this.baseUrl}/api/startflow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    return response.json();
  }
}

// Usage
const client = new FlowStartClient();
const result = await client.startFlows({
  inputData: {
    a1: '2',
    a2: '3',
    orderId: 'ORD-12345',
  },
  event: 'webhook',
  arrayType: false,
});

console.log(`Started ${result.flowsStarted} flows`);
result.flows.forEach(flow => {
  console.log(`  - ${flow.flowName} (${flow.flowId})`);
});
```

### Python

```python
import requests
import json

def start_flows(input_data, event_mode, array_type=False):
    url = "http://localhost:3000/api/startflow"
    
    payload = {
        "inputData": input_data,
        "event": event_mode,
        "arrayType": array_type
    }
    
    response = requests.post(
        url,
        headers={"Content-Type": "application/json"},
        data=json.dumps(payload)
    )
    
    response.raise_for_status()
    return response.json()

# Usage
try:
    result = start_flows(
        input_data={
            "a1": "2",
            "a2": "3",
            "orderId": "ORD-12345"
        },
        event_mode="webhook",
        array_type=False
    )
    
    print(f"Started {result['flowsStarted']} flows:")
    for flow in result['flows']:
        print(f"  - {flow['flowName']} ({flow['flowId']})")
        
except requests.HTTPError as e:
    print(f"Failed to start flows: {e.response.json()['message']}")
```

## Event Store Payload

For each flow that matches the event mode, the following event is published:

### Topic
```
flow.start
```

### Event Payload
```json
{
  "flowId": "550e8400-e29b-41d4-a716-446655440000",
  "flowName": "Order Processing Flow",
  "flowDefinition": "{\"steps\": [...]}",
  "inputData": {
    "a1": "2",
    "a2": "3"
  },
  "arrayType": false,
  "event": "webhook",
  "timestamp": "2026-10-15T12:00:00.000Z",
  "eventId": "flow-1697123456789-abc123-550e8400-e29b-41d4-a716-446655440000"
}
```

## Use Cases

### 1. Webhook Processing
When a webhook arrives, start all flows configured for webhook processing:
```bash
curl -X POST http://localhost:3000/api/startflow \
  -H "Content-Type: application/json" \
  -d '{
    "inputData": {
      "webhookId": "WH-12345",
      "payload": "...",
      "source": "stripe"
    },
    "event": "webhook",
    "arrayType": false
  }'
```

### 2. Scheduled Jobs
Cron job triggers all scheduled flows at specific times:
```bash
# Run at 2 AM daily
0 2 * * * curl -X POST http://localhost:3000/api/startflow \
  -H "Content-Type: application/json" \
  -d '{
    "inputData": {
      "scheduleTime": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
      "jobType": "daily"
    },
    "event": "scheduled",
    "arrayType": false
  }'
```

### 3. Manual Triggers
Admin manually triggers all manual flows:
```bash
curl -X POST http://localhost:3000/api/startflow \
  -H "Content-Type: application/json" \
  -d '{
    "inputData": {
      "triggeredBy": "admin@example.com",
      "reason": "monthly report"
    },
    "event": "manual",
    "arrayType": false
  }'
```

### 4. Parallel Processing
Process the same data through multiple flows in parallel:
```bash
# Multiple flows will process this order simultaneously
curl -X POST http://localhost:3000/api/startflow \
  -H "Content-Type: application/json" \
  -d '{
    "inputData": {
      "orderId": "ORD-12345",
      "amount": "150.50",
      "customerId": "CUST-67890"
    },
    "event": "webhook",
    "arrayType": false
  }'
```

## Comparison with Flow-by-ID Approach

| Feature | Event-Based (Current) | Flow-by-ID |
|---------|----------------------|------------|
| Target | All flows matching event mode | Single specific flow |
| Flows Started | Multiple (0 to N) | Single (0 or 1) |
| Use Case | Broadcast, parallel processing | Specific flow execution |
| Request | `{event, inputData}` | `{flowId, inputData}` |
| Response | List of started flows | Single flow details |

## Best Practices

### 1. Use Descriptive Event Modes
```json
{
  "event": "webhook",  // ✅ Clear
  "event": "order-webhook",  // ❌ Too specific, create flow types instead
}
```

### 2. Include Correlation Data
```json
{
  "inputData": {
    "correlationId": "CORR-ABC123",
    "requestId": "REQ-1697123456789",
    "data": "..."
  },
  "event": "webhook"
}
```

### 3. Handle Multiple Flows
```javascript
const result = await startFlows(inputData, 'webhook');

if (result.flowsStarted === 0) {
  console.warn('No flows were started - check event mode');
} else if (result.flowsStarted > 1) {
  console.log(`Started ${result.flowsStarted} flows in parallel`);
}
```

### 4. Set arrayType Appropriately
```json
// Single record processing
{
  "inputData": {"orderId": "123"},
  "arrayType": false
}

// Batch processing
{
  "inputData": {"orders": ["123", "456", "789"]},
  "arrayType": true
}
```

### 5. Check Before Starting
```javascript
// First, check which flows will be started
const flows = await fetch(`http://localhost:3000/api/flows?mode=webhook`);
const flowList = await flows.json();

console.log(`About to start ${flowList.length} flows`);

// Then start them
await startFlows(inputData, 'webhook');
```

## Monitoring

### Key Metrics
1. **Flows Matched**: How many flows match each event mode
2. **Start Success Rate**: Percentage of successful event publications
3. **Event Fan-out**: Average number of flows started per request
4. **Response Time**: API response time
5. **Event Store Lag**: Time between publish and consumption

### Logging
Each start request logs:
```
INFO: Flow start events published
  - eventId: flow-1697123456789-abc123
  - event: webhook
  - flowsStarted: 2
  - flows: [Order Processing Flow, Payment Processing Flow]
  - timestamp: 2026-10-15T12:00:00.000Z
```

## Troubleshooting

### No Flows Started (404)
**Cause**: No flows found with the specified event mode

**Solutions**:
1. Check event mode spelling: `GET /api/flows?mode=webhook`
2. Verify flows exist: `GET /api/flows`
3. Check flow event configuration

### Some Flows Not Starting
**Cause**: Event mode doesn't match exactly

**Solutions**:
1. Event mode matching is case-sensitive
2. Use exact mode values: "webhook", not "Webhook" or "WEBHOOK"
3. Query flows to verify: `GET /api/flows?mode=webhook`

### High Latency
**Cause**: Too many flows matching event mode

**Solutions**:
1. Review flow organization - consider more specific event types
2. Check event store performance
3. Monitor database query performance

## Testing

Run the test script:
```bash
./examples/test-startflow-api.sh
```

The test covers:
- Creating flows with different event modes
- Starting flows by event mode
- Multiple flows starting simultaneously
- Error handling (missing fields, invalid event)
- Array type processing
- Concurrent requests

## Related Documentation

- [API_GUIDE.md](API_GUIDE.md) - Complete API documentation
- [Flow Routes](src/routes/flowRoutes.ts) - Flow CRUD operations
- [Empty Mode Query](EMPTY_MODE_QUERY.md) - Querying flows with empty mode
