# Start Flow API Documentation

## Overview

The Start Flow API allows you to trigger flow execution by publishing flow start events to the event store. This endpoint validates the flow exists and publishes an event that can be consumed by flow execution workers.

## Endpoint

**POST** `/api/startflow`

## Architecture

```
Client Request → API → Validate Flow → Event Store → Flow Execution Workers
```

The API follows an asynchronous event-driven pattern:
1. Client sends start flow request
2. API validates the flow exists in the database
3. API publishes event to event store (Kafka/In-Memory)
4. API returns 202 Accepted immediately
5. Flow execution happens asynchronously by workers subscribing to events

## Request Format

### Required Fields

```json
{
  "flowId": "string (UUID)"
}
```

### Optional Fields

```json
{
  "flowId": "string (UUID)",
  "inputData": {
    // Any JSON object with input data for the flow
  },
  "metadata": {
    // Any JSON object with metadata about the execution
  }
}
```

### Complete Example

```json
{
  "flowId": "550e8400-e29b-41d4-a716-446655440000",
  "inputData": {
    "orderId": "ORD-12345",
    "customerId": "CUST-67890",
    "items": [
      {
        "productId": "PROD-001",
        "quantity": 2,
        "price": 50.00
      },
      {
        "productId": "PROD-002",
        "quantity": 1,
        "price": 50.50
      }
    ],
    "totalAmount": 150.50
  },
  "metadata": {
    "source": "webhook",
    "priority": "high",
    "requestId": "REQ-1697123456789",
    "correlationId": "CORR-ABC123"
  }
}
```

## Response Format

### Success Response (202 Accepted)

```json
{
  "message": "Flow start event published successfully",
  "topic": "flow.start",
  "eventId": "flow-1697123456789-abc123",
  "timestamp": "2026-10-15T12:00:00.000Z",
  "data": {
    "flowId": "550e8400-e29b-41d4-a716-446655440000",
    "flowName": "Order Processing Flow",
    "inputData": {
      "orderId": "ORD-12345"
    },
    "metadata": {
      "source": "webhook"
    }
  }
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

#### 400 Bad Request - Missing flowId
```json
{
  "error": "Bad Request",
  "message": "flowId is required"
}
```

#### 404 Not Found - Flow Not Found
```json
{
  "error": "Not Found",
  "message": "Flow with ID 550e8400-e29b-41d4-a716-446655440000 not found"
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
| 202 | Accepted - Event published successfully |
| 400 | Bad Request - Invalid or missing data |
| 404 | Not Found - Flow doesn't exist |
| 500 | Internal Server Error - Event store failure |

## Usage Examples

### cURL Examples

#### Basic Flow Start
```bash
curl -X POST http://localhost:3000/api/startflow \
  -H "Content-Type: application/json" \
  -d '{
    "flowId": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

#### Flow Start with Input Data
```bash
curl -X POST http://localhost:3000/api/startflow \
  -H "Content-Type: application/json" \
  -d '{
    "flowId": "550e8400-e29b-41d4-a716-446655440000",
    "inputData": {
      "orderId": "ORD-12345",
      "customerId": "CUST-67890",
      "totalAmount": 150.50
    },
    "metadata": {
      "source": "webhook",
      "priority": "high"
    }
  }'
```

### JavaScript/Fetch

```javascript
async function startFlow(flowId, inputData = {}, metadata = {}) {
  const response = await fetch('http://localhost:3000/api/startflow', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      flowId,
      inputData,
      metadata,
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
  const result = await startFlow(
    '550e8400-e29b-41d4-a716-446655440000',
    { orderId: 'ORD-12345' },
    { source: 'api' }
  );
  console.log('Flow started:', result.eventId);
} catch (error) {
  console.error('Failed to start flow:', error.message);
}
```

### TypeScript Client

```typescript
interface StartFlowRequest {
  flowId: string;
  inputData?: Record<string, any>;
  metadata?: Record<string, any>;
}

interface StartFlowResponse {
  message: string;
  topic: string;
  eventId: string;
  timestamp: string;
  data: {
    flowId: string;
    flowName: string;
    inputData?: Record<string, any>;
    metadata?: Record<string, any>;
  };
}

class FlowStartClient {
  constructor(private baseUrl: string = 'http://localhost:3000') {}

  async startFlow(request: StartFlowRequest): Promise<StartFlowResponse> {
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
const result = await client.startFlow({
  flowId: '550e8400-e29b-41d4-a716-446655440000',
  inputData: {
    orderId: 'ORD-12345',
    customerId: 'CUST-67890',
  },
  metadata: {
    source: 'webhook',
    priority: 'high',
  },
});

console.log(`Flow started with event ID: ${result.eventId}`);
```

### Python

```python
import requests
import json

def start_flow(flow_id, input_data=None, metadata=None):
    url = "http://localhost:3000/api/startflow"
    
    payload = {
        "flowId": flow_id
    }
    
    if input_data:
        payload["inputData"] = input_data
    
    if metadata:
        payload["metadata"] = metadata
    
    response = requests.post(
        url,
        headers={"Content-Type": "application/json"},
        data=json.dumps(payload)
    )
    
    response.raise_for_status()
    return response.json()

# Usage
try:
    result = start_flow(
        flow_id="550e8400-e29b-41d4-a716-446655440000",
        input_data={
            "orderId": "ORD-12345",
            "customerId": "CUST-67890"
        },
        metadata={
            "source": "api",
            "priority": "high"
        }
    )
    print(f"Flow started: {result['eventId']}")
except requests.HTTPError as e:
    print(f"Failed to start flow: {e.response.json()['message']}")
```

## Event Store Payload

When a flow is started, the following event is published to the event store:

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
    "orderId": "ORD-12345"
  },
  "metadata": {
    "source": "webhook"
  },
  "timestamp": "2026-10-15T12:00:00.000Z",
  "eventId": "flow-1697123456789-abc123"
}
```

## Use Cases

### 1. Webhook Triggered Flows
```bash
# When a webhook is received, start the corresponding flow
curl -X POST http://localhost:3000/api/startflow \
  -H "Content-Type: application/json" \
  -d '{
    "flowId": "webhook-flow-id",
    "inputData": {
      "webhookPayload": {...}
    },
    "metadata": {
      "source": "webhook",
      "webhookId": "WH-12345"
    }
  }'
```

### 2. Manual Flow Execution
```bash
# Manually trigger a flow from admin panel
curl -X POST http://localhost:3000/api/startflow \
  -H "Content-Type: application/json" \
  -d '{
    "flowId": "manual-flow-id",
    "inputData": {
      "userId": "admin-123"
    },
    "metadata": {
      "source": "manual",
      "executedBy": "admin@example.com"
    }
  }'
```

### 3. Scheduled Flow Execution
```bash
# Cron job triggers flow at scheduled time
curl -X POST http://localhost:3000/api/startflow \
  -H "Content-Type: application/json" \
  -d '{
    "flowId": "scheduled-flow-id",
    "inputData": {
      "scheduleTime": "2026-10-15T02:00:00Z"
    },
    "metadata": {
      "source": "scheduler",
      "cronExpression": "0 2 * * *"
    }
  }'
```

### 4. Batch Processing
```bash
# Process multiple items by starting flow for each
for item in item1 item2 item3; do
  curl -X POST http://localhost:3000/api/startflow \
    -H "Content-Type: application/json" \
    -d "{
      \"flowId\": \"batch-flow-id\",
      \"inputData\": {
        \"itemId\": \"$item\"
      },
      \"metadata\": {
        \"source\": \"batch\",
        \"batchId\": \"BATCH-123\"
      }
    }"
done
```

## Best Practices

### 1. Include Correlation IDs
Always include a correlation ID in metadata for tracing:
```json
{
  "metadata": {
    "correlationId": "CORR-ABC123",
    "requestId": "REQ-1697123456789"
  }
}
```

### 2. Set Priority
Use metadata to indicate execution priority:
```json
{
  "metadata": {
    "priority": "high",
    "sla": "immediate"
  }
}
```

### 3. Include Source Information
Track where the flow was triggered from:
```json
{
  "metadata": {
    "source": "webhook",
    "sourceId": "WH-12345",
    "sourceIp": "192.168.1.100"
  }
}
```

### 4. Validate Flow ID First
Before starting, verify the flow exists:
```javascript
// Get flow first
const flow = await fetch(`http://localhost:3000/api/flows/${flowId}`);
if (flow.ok) {
  // Start the flow
  await startFlow(flowId, inputData);
}
```

### 5. Handle Errors Gracefully
```javascript
try {
  const result = await startFlow(flowId, inputData);
  console.log(`Flow started: ${result.eventId}`);
} catch (error) {
  if (error.message.includes('not found')) {
    console.error('Flow does not exist');
  } else {
    console.error('Failed to start flow:', error);
  }
}
```

## Testing

Run the test script:
```bash
./examples/test-startflow-api.sh
```

The test covers:
- Valid flow start with full data
- Minimal flow start (only flowId)
- Error cases (empty body, missing flowId, invalid flowId)
- Concurrent execution
- Different flow types (webhook, scheduled, manual)

## Monitoring

### Key Metrics to Track
1. **Flow Start Rate**: Number of flows started per minute
2. **Success Rate**: Percentage of successful event publications
3. **Response Time**: API response time (should be < 100ms)
4. **Event Store Lag**: Time between publish and consumption
5. **Error Rate**: Failed flow start attempts

### Logging
Each flow start logs:
```
INFO: Flow start event published
  - eventId: flow-1697123456789-abc123
  - flowId: 550e8400-e29b-41d4-a716-446655440000
  - flowName: Order Processing Flow
  - timestamp: 2026-10-15T12:00:00.000Z
```

## Troubleshooting

### Flow Not Starting
1. Check if flow exists: `GET /api/flows/{flowId}`
2. Check event store connection
3. Verify event store consumers are running
4. Check logs for errors

### High Latency
1. Check event store performance
2. Verify database connection pool
3. Monitor network latency
4. Check for concurrent load

### Event Not Consumed
1. Verify event store topic exists
2. Check consumer subscription
3. Verify consumer is running
3. Check event store logs

## Related Documentation

- [API_GUIDE.md](API_GUIDE.md) - Complete API documentation
- [Flow Routes](src/routes/flowRoutes.ts) - Flow CRUD operations
- [Event Store](src/eventstore/) - Event store implementation
