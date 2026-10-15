# Event Store Setup Documentation

## Overview

The Event Store setup has been refactored into a separate module (`eventstore/eventStoreSetup.ts`) to manage all topics and subscriptions in a centralized, maintainable way.

## Architecture

```
index.ts
  ↓
eventStoreSetup.ts
  ↓
├─ Create Topics
├─ Setup Subscriptions
└─ Handle Events
```

## Event Topics

All event topics are defined in the `EVENT_TOPICS` constant:

| Topic | Purpose |
|-------|---------|
| `flow.start` | Trigger flow execution |
| `flow.end` | Complete flow execution |
| `flow.error` | Handle flow errors |
| `task.start` | Start individual task |
| `task.end` | Complete individual task |
| `task.error` | Handle task errors |
| `notification` | Send notifications |
| `audit.log` | Audit logging |

## File Structure

```
src/
├── eventstore/
│   ├── eventStoreSetup.ts       (NEW - Topic & Subscription Management)
│   ├── IEventStore.ts
│   ├── EventStoreFactory.ts
│   ├── InMemoryEventStore.ts
│   └── KafkaEventStore.ts
└── index.ts                      (SIMPLIFIED - Uses eventStoreSetup)
```

## Usage in index.ts

### Before
```typescript
// index.ts was cluttered with event store setup
await eventStore.connect();
await eventStore.createTopic('flow.start');
await eventStore.subscribe('flow.start', async (message) => {
  console.log('Received flow.start event:', message);
  FlowService.startFlow(eventStore, database, message);
});
// ... repeated for each topic
```

### After
```typescript
// Clean and simple
import { initializeEventStore, shutdownEventStore } from './eventstore/eventStoreSetup';

// Initialize all topics and subscriptions
await initializeEventStore(eventStore, database);

// Graceful shutdown
await shutdownEventStore(eventStore);
```

## Event Flow

### 1. Flow Start Event
```
POST /api/startflow
  ↓
Publish 'flow.start' event
  ↓
FlowService.startFlow()
  ↓
Create FlowInstance
  ↓
Publish 'task.start' event
```

### 2. Task Processing
```
'task.start' event
  ↓
Create TaskInstance
  ↓
Process Task
  ↓
Publish 'task.end' event
```

### 3. Flow Completion
```
All tasks completed
  ↓
Publish 'flow.end' event
  ↓
Update FlowInstance status
  ↓
Store output data
```

### 4. Error Handling
```
Error occurs
  ↓
Publish 'flow.error' or 'task.error'
  ↓
Update status to FAILED
  ↓
Store error details
```

## Event Payloads

### flow.start
```json
{
  "flowId": "uuid",
  "flowName": "Order Processing",
  "flowDefinition": "{}",
  "inputData": {},
  "arrayType": false,
  "event": "webhook",
  "timestamp": "2026-10-15T12:00:00.000Z",
  "eventId": "flow-123456-abc"
}
```

### flow.end
```json
{
  "flowId": "uuid",
  "instanceId": "uuid",
  "outputData": {},
  "timestamp": "2026-10-15T12:05:00.000Z"
}
```

### flow.error
```json
{
  "flowId": "uuid",
  "instanceId": "uuid",
  "error": "Error message",
  "errorStack": "Stack trace",
  "timestamp": "2026-10-15T12:03:00.000Z"
}
```

### task.start
```json
{
  "taskId": "uuid",
  "flowInstanceId": "uuid",
  "inputData": {},
  "namespace": "com.veracode.start",
  "timestamp": "2026-10-15T12:01:00.000Z"
}
```

### task.end
```json
{
  "taskInstanceId": "uuid",
  "outputData": {},
  "timestamp": "2026-10-15T12:02:00.000Z"
}
```

### task.error
```json
{
  "taskInstanceId": "uuid",
  "error": "Error message",
  "errorStack": "Stack trace",
  "timestamp": "2026-10-15T12:02:30.000Z"
}
```

### notification
```json
{
  "type": "email|slack|sms",
  "recipient": "user@example.com",
  "message": "Flow completed successfully",
  "metadata": {},
  "timestamp": "2026-10-15T12:05:00.000Z"
}
```

### audit.log
```json
{
  "action": "flow.create|flow.start|flow.delete",
  "user": "user@example.com",
  "resource": "flow:uuid",
  "details": {},
  "timestamp": "2026-10-15T12:00:00.000Z"
}
```

## Adding New Topics and Subscriptions

### Step 1: Add Topic to EVENT_TOPICS
```typescript
export const EVENT_TOPICS = {
  // ... existing topics
  MY_NEW_TOPIC: 'my.new.topic',
} as const;
```

### Step 2: Create Topic in createTopics()
Topics are automatically created from `EVENT_TOPICS`. No additional code needed!

### Step 3: Add Subscription in setupSubscriptions()
```typescript
await eventStore.subscribe(EVENT_TOPICS.MY_NEW_TOPIC, async (message) => {
  console.log('Received my.new.topic event:', message);
  try {
    // Your event handling logic here
    await handleMyNewEvent(message);
  } catch (error) {
    console.error('Error processing my.new.topic event:', error);
    await publishErrorEvent(eventStore, EVENT_TOPICS.MY_NEW_TOPIC, message, error);
  }
});
console.log(`  ✓ Subscribed to: ${EVENT_TOPICS.MY_NEW_TOPIC}`);
```

## Error Handling

All event handlers follow a consistent error handling pattern:

```typescript
await eventStore.subscribe(EVENT_TOPICS.SOME_TOPIC, async (message) => {
  try {
    // Process event
    await processEvent(message);
  } catch (error) {
    console.error('Error processing event:', error);
    // Publish error event for monitoring
    await publishErrorEvent(eventStore, EVENT_TOPICS.SOME_ERROR, message, error);
  }
});
```

### Error Event Flow
```
Event Processing Error
  ↓
publishErrorEvent()
  ↓
Publish to error topic
  ↓
Error handler updates status
  ↓
Store error details in database
```

## Helper Functions

### publishEvent()
Publish a custom event with automatic timestamp and eventId:
```typescript
import { publishEvent } from './eventstore/eventStoreSetup';

await publishEvent(eventStore, 'my.custom.topic', {
  data: 'value',
  more: 'data'
});
```

### publishErrorEvent()
Publish error events with full context:
```typescript
await publishErrorEvent(eventStore, EVENT_TOPICS.FLOW_ERROR, originalMessage, error);
```

## Configuration

### Environment Variables
```bash
EVENT_STORE_TYPE=kafka  # or 'inmemory'
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=flow-manager
```

### Topic Configuration
Topics can be configured in Kafka with:
- Partitions: For parallelism
- Replication: For fault tolerance
- Retention: For message history

## Monitoring

### What to Monitor
1. **Event Rate**: Messages per second for each topic
2. **Processing Time**: Time to process each event type
3. **Error Rate**: Failed event processing
4. **Queue Depth**: Unprocessed messages
5. **Consumer Lag**: How far behind consumers are

### Logging
Each event handler logs:
```
INFO: Received {topic} event: {message}
INFO: Successfully processed {topic} event
ERROR: Error processing {topic} event: {error}
```

### Metrics
Key metrics to track:
- `flow_start_total`: Total flows started
- `flow_end_total`: Total flows completed
- `flow_error_total`: Total flow errors
- `task_start_total`: Total tasks started
- `event_processing_duration_seconds`: Processing time histogram

## Testing

### Manual Testing
```bash
# Test flow start event
curl -X POST http://localhost:3000/api/startflow \
  -H "Content-Type: application/json" \
  -d '{
    "inputData": {"test": "data"},
    "event": "webhook",
    "arrayType": false
  }'

# Check logs for event processing
tail -f logs/application.log | grep "Received.*event"
```

### Integration Tests
```typescript
describe('Event Store Setup', () => {
  it('should initialize all topics', async () => {
    await initializeEventStore(eventStore, database);
    // Verify topics exist
  });

  it('should handle flow.start event', async () => {
    await eventStore.publish('flow.start', testPayload);
    // Verify flow instance created
  });
});
```

## Troubleshooting

### Event Not Being Consumed
1. Check if subscription was set up: `grep "Subscribed to" logs/application.log`
2. Check if topic exists: `kafka-topics.sh --list`
3. Check consumer group status
4. Verify event store connection

### High Consumer Lag
1. Check event processing time
2. Increase consumer instances
3. Optimize event handlers
4. Add caching if needed

### Events Lost
1. Check Kafka retention settings
2. Verify message acknowledgment
3. Check error logs for failures
4. Ensure proper error handling

## Migration from Old Setup

The refactoring moves all event store logic from `index.ts` to `eventStoreSetup.ts`:

**Removed from index.ts:**
- Manual topic creation
- Individual subscription setup
- Event handler implementations

**Added to eventStoreSetup.ts:**
- Centralized topic definitions
- Automatic topic creation
- All event subscriptions
- Error handling utilities

**Benefits:**
- ✅ Cleaner index.ts
- ✅ Centralized event management
- ✅ Easier to add new events
- ✅ Consistent error handling
- ✅ Better maintainability

## Future Enhancements

### Planned Features
1. **Event Replay**: Replay events from specific timestamp
2. **Dead Letter Queue**: Handle permanently failed events
3. **Event Versioning**: Support multiple event schema versions
4. **Event Filtering**: Filter events before processing
5. **Batch Processing**: Process multiple events in batches
6. **Circuit Breaker**: Prevent cascading failures

### Adding Event Versioning
```typescript
const EVENT_TOPICS = {
  FLOW_START_V1: 'flow.start.v1',
  FLOW_START_V2: 'flow.start.v2',
} as const;
```

### Adding Dead Letter Queue
```typescript
await eventStore.subscribe(EVENT_TOPICS.FLOW_START, async (message) => {
  try {
    await processFlow(message);
  } catch (error) {
    // After max retries, send to DLQ
    await eventStore.publish('dlq.flow.start', message);
  }
});
```

## Related Documentation

- [Event Store Summary](EVENT_STORE_SUMMARY.md)
- [Flow Service](src/services/flowService.ts)
- [Start Flow API](STARTFLOW_API_UPDATED.md)
