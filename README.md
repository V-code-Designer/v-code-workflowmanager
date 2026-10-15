# Flow Manager API

A TypeScript REST API with CRUD operations for managing workflows, featuring database abstraction, event store abstraction, and Swagger documentation.

## Features

- ✅ CRUD operations for Flow management
- ✅ Database abstraction layer (easily switch between databases)
- ✅ Event store abstraction layer (Kafka, In-Memory)
- ✅ PostgreSQL as default database
- ✅ Kafka for event streaming
- ✅ Swagger UI documentation
- ✅ TypeScript for type safety
- ✅ Docker Compose setup

## Architecture

```
src/
├── model/           # Data models
│   ├── flow.ts
│   ├── task.ts
│   └── eventType.ts
├── database/        # Database abstraction layer
│   ├── IDatabase.ts          # Database interface
│   ├── PostgresDatabase.ts   # PostgreSQL implementation
│   └── DatabaseFactory.ts    # Factory pattern for DB switching
├── eventstore/      # Event store abstraction layer
│   ├── IEventStore.ts        # Event store interface
│   ├── KafkaEventStore.ts    # Kafka implementation
│   ├── InMemoryEventStore.ts # In-memory implementation
│   └── EventStoreFactory.ts  # Factory pattern for event store switching
├── routes/          # API routes
│   ├── flowRoutes.ts
│   └── taskRoutes.ts
├── services/        # Business logic services
│   ├── kafkaService.ts       # Legacy Kafka service
│   └── dataLoader.ts
├── swagger.ts       # Swagger configuration
└── index.ts         # Entry point
```

## Prerequisites

- Node.js (v18+)
- Docker & Docker Compose (for PostgreSQL)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start PostgreSQL with Docker:
```bash
npm run docker:up
```

3. Configure environment variables in `.env`:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/flowmanager
DATABASE_TYPE=postgres
PORT=3000

# Event Store Configuration
EVENT_STORE_TYPE=kafka  # Options: kafka, inmemory
KAFKA_BROKERS=localhost:9093
KAFKA_CLIENT_ID=flow-manager
KAFKA_CONSUMER_GROUP=flow-manager-group
```

## Running the Application

Development mode with auto-reload:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

Base URL: `http://localhost:3000`

### Flows

- `POST /api/flows` - Create a new flow
- `GET /api/flows` - Get all flows
- `GET /api/flows/:id` - Get a flow by ID
- `PUT /api/flows/:id` - Update a flow
- `DELETE /api/flows/:id` - Delete a flow

## API Documentation

Interactive Swagger UI is available at:
- **http://localhost:3000/api-docs**

JSON specification:
- **http://localhost:3000/api-docs.json**

## Example Requests

### Create a Flow
```bash
curl -X POST http://localhost:3000/api/flows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Workflow",
    "description": "Sample workflow description",
    "flow": "{\"steps\": [\"step1\", \"step2\"]}"
  }'
```

### Get All Flows
```bash
curl http://localhost:3000/api/flows
```

### Get Flow by ID
```bash
curl http://localhost:3000/api/flows/{flow-id}
```

### Update a Flow
```bash
curl -X PUT http://localhost:3000/api/flows/{flow-id} \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Workflow Name",
    "description": "Updated description"
  }'
```

### Delete a Flow
```bash
curl -X DELETE http://localhost:3000/api/flows/{flow-id}
```

## Switching Event Stores

The application uses an event store abstraction layer, making it easy to switch between different event storage solutions.

### Available Event Store Types

1. **Kafka** (Production): Full-featured event streaming platform
2. **InMemory** (Development/Testing): Fast, lightweight, no external dependencies

### To switch event stores:

Update `.env`:
```env
# For Kafka (production)
EVENT_STORE_TYPE=kafka
KAFKA_BROKERS=localhost:9093

# For In-Memory (development/testing)
EVENT_STORE_TYPE=inmemory
```

### To add a new event store (e.g., RabbitMQ):

1. Create a new class implementing `IEventStore`:
```typescript
// src/eventstore/RabbitMQEventStore.ts
export class RabbitMQEventStore implements IEventStore {
  async connect(): Promise<void> { /* ... */ }
  async disconnect(): Promise<void> { /* ... */ }
  async publish(topic: string, message: any, key?: string): Promise<void> { /* ... */ }
  async subscribe(topic: string, handler: EventHandler): Promise<void> { /* ... */ }
  async createTopic(topic: string, options?: any): Promise<void> { /* ... */ }
  isConnected(): boolean { /* ... */ }
}
```

2. Update `EventStoreFactory.ts`:
```typescript
case 'rabbitmq':
  return new RabbitMQEventStore(config);
```

3. Update `.env`:
```env
EVENT_STORE_TYPE=rabbitmq
RABBITMQ_URL=amqp://localhost:5672
```

## Switching Databases

The application uses a database abstraction layer, making it easy to switch between databases.

### To add a new database (e.g., MongoDB):

1. Create a new class implementing `IDatabase`:
```typescript
// src/database/MongoDatabase.ts
export class MongoDatabase implements IDatabase {
  // Implement all interface methods
}
```

2. Update `DatabaseFactory.ts`:
```typescript
case 'mongodb':
  return new MongoDatabase();
```

3. Update `.env`:
```env
DATABASE_TYPE=mongodb
DATABASE_URL=mongodb://localhost:27017/flowmanager
```

## Database Schema

### Flows Table
```sql
CREATE TABLE flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  flow TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Docker Commands

```bash
# Start services
npm run docker:up

# Stop services
npm run docker:down

# View logs
docker-compose logs -f postgres
```

## Event-Driven Architecture

The application supports event-driven workflows through the event store abstraction:

### Publishing Events
```bash
curl -X POST http://localhost:3000/api/startflow \
  -H "Content-Type: application/json" \
  -d '{
    "flowId": "flow-123",
    "action": "start",
    "metadata": {
      "user": "admin"
    }
  }'
```

### Event Flow
1. API receives request
2. Event is published to the event store (Kafka or In-Memory)
3. Subscribed handlers process the event asynchronously
4. Business logic executes based on event type

## Project Structure Benefits

1. **Database Abstraction**: Easy to switch between PostgreSQL, MongoDB, MySQL, etc.
2. **Event Store Abstraction**: Switch between Kafka, In-Memory, or other event systems
3. **Clean Architecture**: Separation of concerns with clear layers
4. **Type Safety**: Full TypeScript support
5. **API Documentation**: Auto-generated Swagger UI
6. **Developer Experience**: Hot reload, Docker setup included
7. **Event-Driven**: Async, scalable workflow processing

## License

ISC
