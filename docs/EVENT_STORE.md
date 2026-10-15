# Event Store Abstraction Layer

## Overview

The Event Store abstraction layer provides a unified interface for working with different event streaming and messaging systems. This allows you to switch between Kafka, in-memory storage, or other event systems without changing your application code.

## Architecture

```
┌─────────────────────────────────────────┐
│         Application Layer               │
│  (index.ts, routes, services)          │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│       IEventStore Interface             │
│  (Common contract for all stores)       │
└──────────────┬──────────────────────────┘
               │
       ┌───────┴────────┐
       ▼                ▼
┌──────────────┐  ┌─────────────────┐
│ KafkaEvent   │  │ InMemoryEvent   │
│   Store      │  │    Store        │
└──────────────┘  └─────────────────┘
```

## Interface Definition

All event stores implement the `IEventStore` interface:

```typescript
interface IEventStore {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  publish(topic: string, message: any, key?: string): Promise<void>;
  subscribe(topic: string, handler: EventHandler): Promise<void>;
  createTopic(topic: string, options?: any): Promise<void>;
  isConnected(): boolean;
}
```

## Available Implementations

### 1. Kafka Event Store

**Production-ready**, distributed event streaming platform.

**Features:**
- Durable message storage
- High throughput
- Horizontal scalability
- Message replay capability
- Consumer groups for load balancing

**Configuration:**
```env
EVENT_STORE_TYPE=kafka
KAFKA_BROKERS=localhost:9093,localhost:9094,localhost:9095
KAFKA_CLIENT_ID=flow-manager
KAFKA_CONSUMER_GROUP=flow-manager-group
```

**Use Case:** Production environments requiring reliability, scalability, and message persistence.

### 2. In-Memory Event Store

**Development/Testing** solution with no external dependencies.

**Features:**
- Zero configuration
- Fast performance
- Message replay from stored history
- Multiple subscribers per topic
- Topic management

**Configuration:**
```env
EVENT_STORE_TYPE=inmemory
```

**Use Case:** 
- Local development
- Unit testing
- CI/CD pipelines
- Rapid prototyping

## Usage Examples

### Basic Setup

```typescript
import { EventStoreFactory, EventStoreType, IEventStore } from './eventstore';

// Create event store
const eventStoreType: EventStoreType = 'kafka'; // or 'inmemory'
const eventStore: IEventStore = EventStoreFactory.createEventStore(eventStoreType);

// Connect
await eventStore.connect();

// Create topics
await eventStore.createTopic('flow.start');
await eventStore.createTopic('flow.complete');
```

### Publishing Events

```typescript
// Simple publish
await eventStore.publish('flow.start', {
  flowId: 'flow-123',
  action: 'start',
  timestamp: new Date().toISOString()
});

// Publish with key (for Kafka partitioning)
await eventStore.publish('flow.start', 
  { flowId: 'flow-123', action: 'start' },
  'flow-123' // key
);
```

### Subscribing to Events

```typescript
// Subscribe to a topic
await eventStore.subscribe('flow.start', async (message) => {
  console.log('Received message:', message);
  
  // Process the event
  await processFlowStart(message);
});

// Multiple subscribers
await eventStore.subscribe('flow.start', handleMetrics);
await eventStore.subscribe('flow.start', handleLogging);
await eventStore.subscribe('flow.start', handleNotifications);
```

### Error Handling

```typescript
try {
  await eventStore.publish('flow.start', message);
} catch (error) {
  console.error('Failed to publish event:', error);
  // Implement retry logic or fallback
}
```

### Graceful Shutdown

```typescript
process.on('SIGINT', async () => {
  console.log('Shutting down...');
  await eventStore.disconnect();
  process.exit(0);
});
```

## API Reference

### `connect(): Promise<void>`

Establishes connection to the event store.

```typescript
await eventStore.connect();
```

### `disconnect(): Promise<void>`

Closes all connections and cleans up resources.

```typescript
await eventStore.disconnect();
```

### `publish(topic: string, message: any, key?: string): Promise<void>`

Publishes a message to a topic.

**Parameters:**
- `topic`: Topic name
- `message`: Message payload (will be JSON stringified)
- `key`: Optional partition key (Kafka only)

```typescript
await eventStore.publish('user.created', {
  userId: '123',
  email: 'user@example.com'
}, 'user-123');
```

### `subscribe(topic: string, handler: EventHandler): Promise<void>`

Subscribes to messages from a topic.

**Parameters:**
- `topic`: Topic name to subscribe to
- `handler`: Async function to process messages

```typescript
await eventStore.subscribe('user.created', async (message) => {
  await sendWelcomeEmail(message.email);
});
```

### `createTopic(topic: string, options?: any): Promise<void>`

Creates a new topic if it doesn't exist.

**Parameters:**
- `topic`: Topic name
- `options`: Optional configuration (implementation-specific)

```typescript
// Basic creation
await eventStore.createTopic('orders.created');

// With options (Kafka)
await eventStore.createTopic('orders.created', {
  numPartitions: 3,
  replicationFactor: 2
});
```

### `isConnected(): boolean`

Checks if the event store is connected.

```typescript
if (eventStore.isConnected()) {
  await eventStore.publish('test.topic', { data: 'test' });
}
```

## Event Message Structure

Events automatically include metadata:

```typescript
{
  // Your data
  ...message,
  
  // Metadata (added automatically)
  _timestamp: "2024-10-15T10:30:00.000Z",
  _topic: "flow.start",
  _key?: "optional-key"
}
```

## Comparison Matrix

| Feature | Kafka | In-Memory |
|---------|-------|-----------|
| **Durability** | ✅ Persistent | ❌ Volatile |
| **Scalability** | ✅ Horizontal | ⚠️ Single process |
| **Performance** | ⚡ High | ⚡⚡ Very High |
| **Setup Complexity** | 🔧 Moderate | ✅ Zero config |
| **Message Replay** | ✅ Yes | ✅ Yes (session) |
| **Production Ready** | ✅ Yes | ❌ Dev/Test only |
| **External Dependencies** | ☑️ Kafka cluster | ✅ None |
| **Consumer Groups** | ✅ Yes | ⚠️ Basic |
| **Partitioning** | ✅ Yes | ❌ No |

## Best Practices

### 1. Topic Naming

Use a clear hierarchical naming convention:

```typescript
// Good
'flow.started'
'flow.completed'
'task.created'
'task.failed'

// Avoid
'flows'
'event'
'data'
```

### 2. Message Structure

Keep messages self-contained and versioned:

```typescript
{
  version: '1.0',
  eventType: 'flow.started',
  eventId: 'evt-123',
  timestamp: '2024-10-15T10:30:00Z',
  data: {
    flowId: 'flow-123',
    // ...
  },
  metadata: {
    userId: 'user-456',
    correlationId: 'req-789'
  }
}
```

### 3. Error Handling

Always handle errors in subscribers:

```typescript
await eventStore.subscribe('flow.start', async (message) => {
  try {
    await processFlow(message);
  } catch (error) {
    console.error('Failed to process flow:', error);
    // Log to monitoring system
    // Send to dead letter queue
    // Implement retry logic
  }
});
```

### 4. Connection Management

Check connection status before operations:

```typescript
if (!eventStore.isConnected()) {
  await eventStore.connect();
}
await eventStore.publish('topic', message);
```

### 5. Testing

Use in-memory store for tests:

```typescript
// test.ts
const eventStore = EventStoreFactory.createEventStore('inmemory');
await eventStore.connect();

// Test your logic
await eventStore.publish('test.event', testData);
```

## Migration Guide

### From KafkaService to EventStore

**Before:**
```typescript
import { KafkaService } from './services/kafkaService';

const kafka = new KafkaService();
await kafka.connect();
await kafka.publish('topic', message);
```

**After:**
```typescript
import { EventStoreFactory, EventStoreType } from './eventstore';

const eventStore = EventStoreFactory.createEventStore('kafka');
await eventStore.connect();
await eventStore.publish('topic', message);
```

## Adding New Event Store Implementations

To add support for a new event store (e.g., RabbitMQ, Redis Streams):

1. **Create implementation:**

```typescript
// src/eventstore/RabbitMQEventStore.ts
import { IEventStore, EventHandler } from './IEventStore';

export class RabbitMQEventStore implements IEventStore {
  async connect(): Promise<void> {
    // Implementation
  }
  
  async disconnect(): Promise<void> {
    // Implementation
  }
  
  async publish(topic: string, message: any, key?: string): Promise<void> {
    // Implementation
  }
  
  async subscribe(topic: string, handler: EventHandler): Promise<void> {
    // Implementation
  }
  
  async createTopic(topic: string, options?: any): Promise<void> {
    // Implementation
  }
  
  isConnected(): boolean {
    // Implementation
  }
}
```

2. **Update factory:**

```typescript
// src/eventstore/EventStoreFactory.ts
export type EventStoreType = 'kafka' | 'inmemory' | 'rabbitmq';

case 'rabbitmq':
  return new RabbitMQEventStore(config);
```

3. **Update environment:**

```env
EVENT_STORE_TYPE=rabbitmq
RABBITMQ_URL=amqp://localhost:5672
```

## Troubleshooting

### Kafka Connection Issues

```bash
# Check Kafka is running
docker ps | grep kafka

# Check network connectivity
telnet localhost 9093

# View Kafka logs
docker logs kafka-container
```

### Message Not Received

1. Verify topic exists
2. Check consumer is subscribed before publishing
3. Check error logs in subscriber handler
4. Verify connection status

### Performance Issues

1. **Kafka**: Increase partitions, tune batch size
2. **In-Memory**: Consider switching to Kafka for production scale

## Environment Variables Reference

```env
# Event Store Type
EVENT_STORE_TYPE=kafka|inmemory

# Kafka Configuration
KAFKA_BROKERS=localhost:9093,localhost:9094
KAFKA_CLIENT_ID=flow-manager
KAFKA_CONSUMER_GROUP=flow-manager-group
```

## License

ISC
