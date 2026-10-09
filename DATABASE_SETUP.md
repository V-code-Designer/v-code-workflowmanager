# Database Setup Guide

This guide explains how to work with different databases in the Flow Manager API.

## Current Implementation

The project uses **PostgreSQL** by default with a database abstraction layer that makes it easy to switch to other databases.

## Architecture

```
IDatabase (Interface)
    ↓
PostgresDatabase (Implementation)
    ↓
DatabaseFactory (Creates instances)
```

## PostgreSQL (Default)

### Setup with Docker

```bash
# Start PostgreSQL
npm run docker:up

# Stop PostgreSQL
npm run docker:down
```

### Manual Setup

If you prefer to use an existing PostgreSQL instance:

1. Update `.env`:
```env
DATABASE_URL=postgresql://username:password@host:port/database
DATABASE_TYPE=postgres
```

2. Ensure the database exists:
```sql
CREATE DATABASE flowmanager;
```

The application will automatically create the `flows` table on startup.

## Adding MongoDB Support

To add MongoDB support, create a new implementation:

### Step 1: Install MongoDB Driver

```bash
npm install mongodb
npm install --save-dev @types/mongodb
```

### Step 2: Create MongoDatabase Implementation

Create `src/database/MongoDatabase.ts`:

```typescript
import { MongoClient, Db, ObjectId } from 'mongodb';
import { IDatabase } from './IDatabase';
import { Flow } from '../model/flow';

export class MongoDatabase implements IDatabase {
  private client: MongoClient;
  private db: Db | null = null;
  private readonly collectionName = 'flows';

  constructor(connectionString?: string) {
    const uri = connectionString || process.env.DATABASE_URL || 'mongodb://localhost:27017/flowmanager';
    this.client = new MongoClient(uri);
  }

  async connect(): Promise<void> {
    await this.client.connect();
    this.db = this.client.db();
    console.log('Connected to MongoDB database');
  }

  async disconnect(): Promise<void> {
    await this.client.close();
    console.log('Disconnected from MongoDB database');
  }

  async createFlow(flow: Omit<Flow, 'id'>): Promise<Flow> {
    const collection = this.db!.collection(this.collectionName);
    const result = await collection.insertOne({
      ...flow,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    return {
      id: result.insertedId.toString(),
      ...flow,
    };
  }

  async getFlowById(id: string): Promise<Flow | null> {
    const collection = this.db!.collection(this.collectionName);
    const doc = await collection.findOne({ _id: new ObjectId(id) });
    
    if (!doc) return null;
    
    return {
      id: doc._id.toString(),
      name: doc.name,
      description: doc.description,
      flow: doc.flow,
    };
  }

  async getAllFlows(): Promise<Flow[]> {
    const collection = this.db!.collection(this.collectionName);
    const docs = await collection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    
    return docs.map(doc => ({
      id: doc._id.toString(),
      name: doc.name,
      description: doc.description,
      flow: doc.flow,
    }));
  }

  async updateFlow(id: string, flow: Partial<Omit<Flow, 'id'>>): Promise<Flow | null> {
    const collection = this.db!.collection(this.collectionName);
    
    const updateDoc: any = { updatedAt: new Date() };
    if (flow.name !== undefined) updateDoc.name = flow.name;
    if (flow.description !== undefined) updateDoc.description = flow.description;
    if (flow.flow !== undefined) updateDoc.flow = flow.flow;
    
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateDoc },
      { returnDocument: 'after' }
    );
    
    if (!result) return null;
    
    return {
      id: result._id.toString(),
      name: result.name,
      description: result.description,
      flow: result.flow,
    };
  }

  async deleteFlow(id: string): Promise<boolean> {
    const collection = this.db!.collection(this.collectionName);
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }
}
```

### Step 3: Update DatabaseFactory

Edit `src/database/DatabaseFactory.ts`:

```typescript
import { IDatabase } from './IDatabase';
import { PostgresDatabase } from './PostgresDatabase';
import { MongoDatabase } from './MongoDatabase';

export type DatabaseType = 'postgres' | 'mongodb' | 'mysql';

export class DatabaseFactory {
  static createDatabase(type: DatabaseType = 'postgres'): IDatabase {
    switch (type) {
      case 'postgres':
        return new PostgresDatabase();
      case 'mongodb':
        return new MongoDatabase();
      case 'mysql':
        throw new Error('MySQL implementation not yet available.');
      default:
        throw new Error(`Unsupported database type: ${type}`);
    }
  }
}
```

### Step 4: Update Configuration

Update `.env`:

```env
DATABASE_URL=mongodb://localhost:27017/flowmanager
DATABASE_TYPE=mongodb
PORT=3000
```

### Step 5: Add MongoDB to Docker Compose

Add to `docker-compose.yml`:

```yaml
  mongodb:
    image: mongo:7-jammy
    restart: unless-stopped
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_DATABASE: flowmanager
    volumes:
      - mongodb-data:/data/db

volumes:
  verdaccio-storage:
  postgres-data:
  mongodb-data:
```

## Adding MySQL Support

Similar to MongoDB, create `src/database/MySQLDatabase.ts`:

```bash
npm install mysql2
npm install --save-dev @types/mysql2
```

Then implement the `IDatabase` interface using mysql2's connection pool.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Connection string for your database | `postgresql://postgres:postgres@localhost:5432/flowmanager` |
| `DATABASE_TYPE` | Database type (`postgres`, `mongodb`, `mysql`) | `postgres` |
| `PORT` | Server port | `3000` |

## Testing Database Switch

1. Start with PostgreSQL:
```bash
DATABASE_TYPE=postgres npm start
```

2. Create some flows using the API

3. Switch to MongoDB:
```bash
DATABASE_TYPE=mongodb npm start
```

4. The data won't transfer (different databases), but the API works identically

## Database Table/Collection Schema

### PostgreSQL Schema
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

### MongoDB Schema
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  flow: String,
  createdAt: Date,
  updatedAt: Date
}
```

## Benefits of Database Abstraction

1. **Easy Migration**: Switch databases without changing business logic
2. **Testing**: Mock the database interface for unit tests
3. **Flexibility**: Support multiple databases in different environments
4. **Maintainability**: Changes to database logic are isolated

## Best Practices

1. Always implement the complete `IDatabase` interface
2. Handle connection errors gracefully
3. Use connection pooling for better performance
4. Add appropriate indexes for your queries
5. Consider data migration when switching databases
