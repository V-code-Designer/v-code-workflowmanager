# Flow Manager API

A TypeScript REST API with CRUD operations for managing workflows, featuring database abstraction and Swagger documentation.

## Features

- ✅ CRUD operations for Flow management
- ✅ Database abstraction layer (easily switch between databases)
- ✅ PostgreSQL as default database
- ✅ Swagger UI documentation
- ✅ TypeScript for type safety
- ✅ Docker Compose setup

## Architecture

```
src/
├── model/           # Data models
│   └── flow.ts
├── database/        # Database abstraction layer
│   ├── IDatabase.ts          # Database interface
│   ├── PostgresDatabase.ts   # PostgreSQL implementation
│   └── DatabaseFactory.ts    # Factory pattern for DB switching
├── routes/          # API routes
│   └── flowRoutes.ts
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

## Project Structure Benefits

1. **Database Abstraction**: Easy to switch between PostgreSQL, MongoDB, MySQL, etc.
2. **Clean Architecture**: Separation of concerns with clear layers
3. **Type Safety**: Full TypeScript support
4. **API Documentation**: Auto-generated Swagger UI
5. **Developer Experience**: Hot reload, Docker setup included

## License

ISC
