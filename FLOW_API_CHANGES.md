# Flow API Changes Summary

## Overview
Enhanced the Flow CRUD REST API to support structured event metadata stored as JSON with query capabilities.

## Key Changes

### 1. Database Schema Update
- **Changed**: `event` column from `VARCHAR(255)` to `JSONB`
- **Added**: Index on `event->>'mode'` for efficient querying
- **Location**: [PostgresDatabase.ts:33-53](src/database/PostgresDatabase.ts#L33-L53)

### 2. Model Update
- **Added**: `EventMetadata` interface with fields: `mode`, `command`, `option`
- **Updated**: `Flow` interface to support both string and `EventMetadata` types
- **Location**: [flow.ts:1-10](src/model/flow.ts#L1-L10)

### 3. Database Interface
- **Added**: `getFlowsByEventMode(mode: string): Promise<Flow[]>` method
- **Location**: [IDatabase.ts:13](src/database/IDatabase.ts#L13)

### 4. Database Implementation (PostgresDatabase)
- **Updated**: All CRUD methods to handle JSON serialization/deserialization
  - `createFlow()` - Converts event to JSON before storage
  - `getFlowById()` - Parses JSON event on retrieval
  - `getAllFlows()` - Parses JSON event for all flows
  - `getFlowsByEventMode()` - New method for querying by mode
  - `updateFlow()` - Handles JSON event updates
- **Location**: [PostgresDatabase.ts:91-162](src/database/PostgresDatabase.ts#L91-L162)

### 5. API Routes
- **Updated**: GET `/api/flows` endpoint to support query parameter `?mode={mode}`
- **Updated**: Swagger documentation to reflect EventMetadata schema
- **Location**: [flowRoutes.ts:106-146](src/routes/flowRoutes.ts#L106-L146)

## New Files Created

### 1. Migration Script
**File**: `migrations/001_update_event_to_jsonb.sql`
- Converts existing `event` VARCHAR column to JSONB
- Migrates existing data safely
- Creates index for performance

### 2. API Documentation
**File**: `API_GUIDE.md`
- Comprehensive API documentation
- Request/response examples
- cURL examples
- Database schema information

### 3. Quick Reference
**File**: `QUICK_REFERENCE.md`
- One-page quick reference
- Common commands
- Event mode examples
- Database queries

### 4. Test Script
**File**: `examples/test-flow-api.sh`
- Automated API testing script
- Tests all CRUD operations
- Tests query by mode functionality

### 5. Example Flows
**File**: `examples/flow-examples.json`
- Sample flow configurations
- Multiple event mode examples (webhook, scheduled, manual)

### 6. TypeScript Client
**File**: `examples/flow-api-client.ts`
- Type-safe API client implementation
- Usage examples
- Helper functions

## Event Metadata Schema

```typescript
interface EventMetadata {
  mode: string;        // "webhook" | "scheduled" | "manual"
  command?: string;    // Optional command or endpoint
  option?: string;     // Optional configuration option
}
```

## API Enhancements

### New Query Capability
**Endpoint**: `GET /api/flows?mode={mode}`

**Example**:
```bash
# Get all webhook flows
curl "http://localhost:3000/api/flows?mode=webhook"

# Get all scheduled flows
curl "http://localhost:3000/api/flows?mode=scheduled"
```

### Backward Compatibility
- API still accepts string values for `event` field
- Automatic JSON parsing/stringification handled internally
- No breaking changes to existing API contracts

## Database Abstraction

The implementation uses the `IDatabase` interface pattern, making it easy to switch databases:

```typescript
// Current: PostgreSQL with JSONB
const db = DatabaseFactory.createDatabase('postgres');

// Future: MongoDB (when implemented)
const db = DatabaseFactory.createDatabase('mongodb');

// Future: MySQL (when implemented)
const db = DatabaseFactory.createDatabase('mysql');
```

## Performance Optimizations

1. **JSONB Index**: Created index on `event->>'mode'` for fast filtering
2. **Native JSON Operations**: Uses PostgreSQL's native JSONB operators
3. **Efficient Querying**: No need to parse JSON in application layer

## Testing

Run the automated test suite:
```bash
./examples/test-flow-api.sh
```

This will test:
- Creating flows with different event modes
- Querying all flows
- Filtering by event mode
- Getting flows by ID
- Updating event metadata
- Deleting flows

## Migration Steps

To apply changes to an existing database:

1. **Backup your database** (important!)
2. **Run migration script**:
   ```bash
   psql -U your_user -d your_db -f migrations/001_update_event_to_jsonb.sql
   ```
3. **Restart the application**
4. **Test the API** using the test script

## Benefits

1. **Structured Data**: Event metadata is now properly structured
2. **Efficient Queries**: Can filter flows by event properties without parsing
3. **Flexible Schema**: Easy to add new event properties without schema changes
4. **Type Safety**: TypeScript interfaces provide compile-time checks
5. **Database Agnostic**: Easy to switch database implementations
6. **Better Documentation**: Swagger docs reflect the actual schema

## Example Usage

### Create Flow with Webhook Event
```bash
curl -X POST http://localhost:3000/api/flows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Order Processing",
    "description": "Process orders via webhook",
    "flow": "{\"steps\": [\"validate\", \"process\"]}",
    "event": {
      "mode": "webhook",
      "command": "/api/orders",
      "option": "async"
    }
  }'
```

### Query Webhook Flows
```bash
curl "http://localhost:3000/api/flows?mode=webhook"
```

### Update Event Metadata
```bash
curl -X PUT http://localhost:3000/api/flows/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "event": {
      "mode": "webhook",
      "command": "/api/v2/orders",
      "option": "sync"
    }
  }'
```

## Next Steps

Potential future enhancements:
1. Add more query parameters (e.g., `?command=...`, `?option=...`)
2. Implement full-text search on event metadata
3. Add event metadata validation middleware
4. Create event mode-specific routes
5. Implement MongoDB and MySQL adapters
6. Add GraphQL API layer
7. Create event metadata builder UI

## Files Modified

1. `src/model/flow.ts` - Added EventMetadata interface
2. `src/database/IDatabase.ts` - Added getFlowsByEventMode method
3. `src/database/PostgresDatabase.ts` - Updated all methods for JSON handling
4. `src/routes/flowRoutes.ts` - Added mode query parameter support

## Files Created

1. `migrations/001_update_event_to_jsonb.sql`
2. `API_GUIDE.md`
3. `QUICK_REFERENCE.md`
4. `examples/test-flow-api.sh`
5. `examples/flow-examples.json`
6. `examples/flow-api-client.ts`
7. `FLOW_API_CHANGES.md` (this file)
