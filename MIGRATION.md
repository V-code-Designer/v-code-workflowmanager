# Migration Guide: KafkaService to Event Store Abstraction

## Overview

This guide helps you migrate from the legacy `KafkaService` to the new event store abstraction layer.

## Why Migrate?

The event store abstraction provides:

✅ **Flexibility**: Switch between Kafka, In-Memory, or other event stores without code changes  
✅ **Testability**: Use in-memory store for tests without running Kafka  
✅ **Consistency**: Unified interface across all event storage systems  
✅ **Future-proof**: Easy to add new event store implementations  

## Migration Steps

### Step 1: Update Imports

**Before:**
```typescript
import { KafkaService } from './services/kafkaService';
```

**After:**
```typescript
import { EventStoreFactory, EventStoreType, IEventStore } from './eventstore';
```

### Step 2: Update Initialization

**Before:**
```typescript
const kafkaService = new KafkaService();
```

**After:**
```typescript
const eventStoreType = (process.env.EVENT_STORE_TYPE as EventStoreType) || 'kafka';
const eventStore: IEventStore = EventStoreFactory.createEventStore(eventStoreType);
```

### Step 3: Update Connection

**Before:**
```typescript
await kafkaService.connect();
```

**After:**
```typescript
await eventStore.connect();
```

### Step 4: Update Topic Creation

**Before:**
```typescript
await kafkaService.createTopic('flow.start');
```

**After:**
```typescript
await eventStore.createTopic('flow.start');

// With options (optional)
await eventStore.createTopic('flow.start', {
  numPartitions: 3,
  replicationFactor: 2
});
```

### Step 5: Update Publishing

**Before:**
```typescript
await kafkaService.publish('flow.start', {
  flowId: 'flow-123',
  action: 'start'
});
```

**After:**
```typescript
// Basic publish
await eventStore.publish('flow.start', {
  flowId: 'flow-123',
  action: 'start'
});

// With key for partitioning
await eventStore.publish('flow.start', {
  flowId: 'flow-123',
  action: 'start'
}, 'flow-123'); // key parameter
```

### Step 6: Update Subscriptions

**Before:**
```typescript
await kafkaService.subscribe('flow.start', async (message) => {
  console.log('Received:', message);
  // Handle message
});
```

**After:**
```typescript
await eventStore.subscribe('flow.start', async (message) => {
  console.log('Received:', message);
  // Handle message
});
```

### Step 7: Update Disconnection

**Before:**
```typescript
await kafkaService.disconnect();
```

**After:**
```typescript
await eventStore.disconnect();
```

### Step 8: Update Connection Checks

**Before:**
```typescript
if (kafkaService.isConnected) {
  // do something
}
```

**After:**
```typescript
if (eventStore.isConnected()) {  // Note: it's a method now
  // do something
}
```

## Complete Example: Before and After

### Before (Using KafkaService)

```typescript
import express from 'express';
import { KafkaService } from './services/kafkaService';

const app = express();
const kafkaService = new KafkaService();

async function startServer() {
  try {
    // Initialize Kafka
    await kafkaService.connect();
    await kafkaService.createTopic('flow.start');

    // Subscribe
    await kafkaService.subscribe('flow.start', async (message) => {
      console.log('Received flow.start:', message);
      await processFlow(message);
    });

    // Publish endpoint
    app.post('/api/startflow', async (req, res) => {
      try {
        await kafkaService.publish('flow.start', req.body);
        res.status(202).json({ message: 'Event published' });
      } catch (error) {
        res.status(500).json({ error: 'Failed to publish' });
      }
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await kafkaService.disconnect();
      process.exit(0);
    });

    app.listen(3000);
  } catch (error) {
    console.error('Failed to start:', error);
    process.exit(1);
  }
}

startServer();
```

### After (Using Event Store Abstraction)

```typescript
import express from 'express';
import { EventStoreFactory, EventStoreType, IEventStore } from './eventstore';

const app = express();

// Now configurable via environment variable!
const eventStoreType = (process.env.EVENT_STORE_TYPE as EventStoreType) || 'kafka';
const eventStore: IEventStore = EventStoreFactory.createEventStore(eventStoreType);

async function startServer() {
  try {
    // Initialize Event Store
    await eventStore.connect();
    await eventStore.createTopic('flow.start');

    // Subscribe
    await eventStore.subscribe('flow.start', async (message) => {
      console.log('Received flow.start:', message);
      await processFlow(message);
    });

    // Publish endpoint
    app.post('/api/startflow', async (req, res) => {
      try {
        await eventStore.publish('flow.start', req.body);
        res.status(202).json({ message: 'Event published' });
      } catch (error) {
        res.status(500).json({ error: 'Failed to publish' });
      }
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await eventStore.disconnect();
      process.exit(0);
    });

    app.listen(3000);
  } catch (error) {
    console.error('Failed to start:', error);
    process.exit(1);
  }
}

startServer();
```

## Environment Configuration

### Before

```env
KAFKA_BROKERS=localhost:9093
```

### After

```env
# Choose your event store type
EVENT_STORE_TYPE=kafka  # or 'inmemory'

# Kafka configuration (only needed if using Kafka)
KAFKA_BROKERS=localhost:9093
KAFKA_CLIENT_ID=flow-manager
KAFKA_CONSUMER_GROUP=flow-manager-group
```

## Testing Migration

### Running with In-Memory Store (for tests)

```bash
# Set environment variable
export EVENT_STORE_TYPE=inmemory

# Run your application
npm run dev
```

### Running with Kafka (production)

```bash
# Set environment variable
export EVENT_STORE_TYPE=kafka

# Run your application
npm start
```

## Common Migration Issues

### Issue 1: isConnected is not a function

**Error:**
```
TypeError: kafkaService.isConnected is not a function
```

**Solution:**
Change property access to method call:
```typescript
// Before
if (kafkaService.isConnected) { }

// After
if (eventStore.isConnected()) { }
```

### Issue 2: Message key parameter

**Before (implicit):**
```typescript
await kafkaService.publish('topic', message);
```

**After (explicit):**
```typescript
// Without key
await eventStore.publish('topic', message);

// With key
await eventStore.publish('topic', message, 'key-123');
```

### Issue 3: Connection errors with Kafka

If you see connection errors after migration:

1. Check `EVENT_STORE_TYPE` is set correctly
2. Verify Kafka is running if using `kafka` type
3. Try switching to `inmemory` for local development

## Testing Your Migration

Create a simple test file:

```typescript
// test-migration.ts
import { EventStoreFactory } from './eventstore';

async function test() {
  const eventStore = EventStoreFactory.createEventStore('inmemory');
  
  await eventStore.connect();
  console.log('✅ Connected:', eventStore.isConnected());
  
  await eventStore.createTopic('test.topic');
  console.log('✅ Topic created');
  
  await eventStore.subscribe('test.topic', async (msg) => {
    console.log('✅ Received:', msg);
  });
  
  await eventStore.publish('test.topic', { test: true });
  console.log('✅ Published');
  
  await new Promise(resolve => setTimeout(resolve, 100));
  await eventStore.disconnect();
  console.log('✅ Disconnected');
}

test().catch(console.error);
```

Run it:
```bash
npx ts-node test-migration.ts
```

## Rollback Plan

If you need to rollback:

1. Keep the old `KafkaService` file
2. Switch imports back to `KafkaService`
3. Set `EVENT_STORE_TYPE=kafka` in production

The new abstraction is backward compatible with Kafka, so no data loss occurs.

## Benefits After Migration

✅ **Unit Tests**: Run tests without Kafka using in-memory store  
✅ **Local Development**: Faster startup without external dependencies  
✅ **CI/CD**: Simpler pipeline without Kafka containers  
✅ **Flexibility**: Easy to try other event stores (RabbitMQ, Redis, etc.)  
✅ **Type Safety**: Strong typing with TypeScript interface  

## Need Help?

- Check `docs/EVENT_STORE.md` for detailed documentation
- See `examples/eventstore-usage.ts` for usage examples
- Review `src/index.ts` for a complete integration example

## Checklist

- [ ] Updated imports to use event store abstraction
- [ ] Replaced `KafkaService` instances with `EventStoreFactory`
- [ ] Added `EVENT_STORE_TYPE` to environment configuration
- [ ] Updated connection status checks to use `isConnected()` method
- [ ] Tested with in-memory store locally
- [ ] Verified Kafka integration in staging
- [ ] Updated documentation and team
- [ ] Removed old `KafkaService` references (optional)

## Next Steps

After migration:

1. **Add tests** using in-memory event store
2. **Monitor** production for any issues
3. **Consider** adding new event store implementations
4. **Document** team-specific patterns and practices

Happy migrating! 🚀
