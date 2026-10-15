# Flow CRUD REST API Guide

## Overview

This API provides CRUD operations for managing Flows with event metadata stored in JSON format. The event metadata supports different trigger modes like `webhook`, `scheduled`, and `manual`.

## Event Metadata Structure

The `event` field in Flow contains structured JSON metadata:

```json
{
  "mode": "webhook|scheduled|manual",
  "command": "optional command string",
  "option": "optional option string"
}
```

### Examples

**Webhook Event:**
```json
{
  "mode": "webhook",
  "command": "/api/trigger",
  "option": "async"
}
```

**Scheduled Event:**
```json
{
  "mode": "scheduled",
  "command": "0 0 * * *",
  "option": "cron"
}
```

**Manual Event:**
```json
{
  "mode": "manual",
  "command": "",
  "option": ""
}
```

## API Endpoints

### Base URL
```
http://localhost:3000/api/flows
```

### 1. Create Flow

**POST** `/api/flows`

Create a new flow with event metadata.

**Request Body:**
```json
{
  "name": "Webhook Flow",
  "description": "A flow triggered by webhook",
  "flow": "{\"steps\": [\"step1\", \"step2\"]}",
  "event": {
    "mode": "webhook",
    "command": "/api/trigger",
    "option": "async"
  }
}
```

**Response:** `201 Created`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Webhook Flow",
  "description": "A flow triggered by webhook",
  "flow": "{\"steps\": [\"step1\", \"step2\"]}",
  "event": {
    "mode": "webhook",
    "command": "/api/trigger",
    "option": "async"
  }
}
```

### 2. Get All Flows

**GET** `/api/flows`

Retrieve all flows.

**Response:** `200 OK`
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Webhook Flow",
    "description": "A flow triggered by webhook",
    "flow": "{\"steps\": [\"step1\", \"step2\"]}",
    "event": {
      "mode": "webhook",
      "command": "/api/trigger",
      "option": "async"
    }
  }
]
```

### 3. Query Flows by Event Mode

**GET** `/api/flows?mode={mode}`

Filter flows by event mode.

**Query Parameters:**
- `mode` (string): Filter by event.mode value (e.g., `webhook`, `scheduled`, `manual`)
  - Use empty string (`mode=`) to find flows with no mode set or null event

**Examples:**
```bash
# Get webhook flows
GET /api/flows?mode=webhook

# Get flows with empty or null mode
GET /api/flows?mode=
```

**Response:** `200 OK`
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Webhook Flow",
    "description": "A flow triggered by webhook",
    "flow": "{\"steps\": [\"step1\", \"step2\"]}",
    "event": {
      "mode": "webhook",
      "command": "/api/trigger",
      "option": "async"
    }
  }
]
```

### 4. Get Flow by ID

**GET** `/api/flows/{id}`

Retrieve a specific flow by ID.

**Response:** `200 OK`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Webhook Flow",
  "description": "A flow triggered by webhook",
  "flow": "{\"steps\": [\"step1\", \"step2\"]}",
  "event": {
    "mode": "webhook",
    "command": "/api/trigger",
    "option": "async"
  }
}
```

### 5. Update Flow

**PUT** `/api/flows/{id}`

Update an existing flow. You can update any field including the event metadata.

**Request Body:**
```json
{
  "name": "Updated Webhook Flow",
  "event": {
    "mode": "webhook",
    "command": "/api/v2/trigger",
    "option": "sync"
  }
}
```

**Response:** `200 OK`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Updated Webhook Flow",
  "description": "A flow triggered by webhook",
  "flow": "{\"steps\": [\"step1\", \"step2\"]}",
  "event": {
    "mode": "webhook",
    "command": "/api/v2/trigger",
    "option": "sync"
  }
}
```

### 6. Delete Flow

**DELETE** `/api/flows/{id}`

Delete a flow by ID.

**Response:** `200 OK`
```json
{
  "message": "Flow deleted successfully"
}
```

## cURL Examples

### Create a Webhook Flow
```bash
curl -X POST http://localhost:3000/api/flows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Webhook Flow",
    "description": "A flow triggered by webhook",
    "flow": "{\"steps\": [\"step1\", \"step2\"]}",
    "event": {
      "mode": "webhook",
      "command": "/api/trigger",
      "option": "async"
    }
  }'
```

### Get All Flows
```bash
curl -X GET http://localhost:3000/api/flows
```

### Query Flows with mode=webhook
```bash
curl -X GET "http://localhost:3000/api/flows?mode=webhook"
```

### Query Flows with Empty Mode
```bash
curl -X GET "http://localhost:3000/api/flows?mode="
```

### Get Flow by ID
```bash
curl -X GET http://localhost:3000/api/flows/{id}
```

### Update Flow
```bash
curl -X PUT http://localhost:3000/api/flows/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "event": {
      "mode": "webhook",
      "command": "/api/v2/trigger",
      "option": "sync"
    }
  }'
```

### Delete Flow
```bash
curl -X DELETE http://localhost:3000/api/flows/{id}
```

## Database Schema

The `flows` table uses PostgreSQL's JSONB type for the event column:

```sql
CREATE TABLE flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  flow TEXT NOT NULL,
  event JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_flows_event_mode ON flows ((event->>'mode'));
```

The JSONB column allows for:
- Efficient JSON querying
- Flexible schema evolution
- Native JSON operators in PostgreSQL

## Database Abstraction

The API uses a database abstraction layer (`IDatabase` interface) that allows easy switching between different databases:

- **PostgreSQL** (default): Uses JSONB for efficient JSON storage and querying
- **MySQL**: Can be configured by changing the database factory
- **MongoDB**: Alternative NoSQL option for document-based storage

To switch databases, update the `DatabaseFactory` configuration in your environment variables.

## Running the API

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Run migrations (if needed):**
   ```bash
   psql -U your_user -d your_db -f migrations/001_update_event_to_jsonb.sql
   ```

4. **Start the server:**
   ```bash
   npm run dev
   ```

5. **Test the API:**
   ```bash
   ./examples/test-flow-api.sh
   ```

## API Documentation

Interactive API documentation is available via Swagger UI when the server is running:

```
http://localhost:3000/api-docs
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Name and flow are required"
}
```

### 404 Not Found
```json
{
  "error": "Flow not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to create flow"
}
```

## Advanced Queries

The PostgreSQL JSONB type supports advanced querying. Here are some examples:

### Query by nested JSON fields in raw SQL:
```sql
-- Find flows where mode is 'webhook'
SELECT * FROM flows WHERE event->>'mode' = 'webhook';

-- Find flows where command contains 'trigger'
SELECT * FROM flows WHERE event->>'command' LIKE '%trigger%';

-- Find flows with specific option
SELECT * FROM flows WHERE event->>'option' = 'async';
```

These queries can be easily added to the API by extending the `IDatabase` interface and implementing them in `PostgresDatabase`.
