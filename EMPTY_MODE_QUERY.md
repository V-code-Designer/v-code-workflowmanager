# Empty Mode Query Enhancement

## Overview
Added support for querying flows with empty or null event mode by using an empty string in the mode query parameter.

## Change Summary

### Modified Files
1. **src/database/PostgresDatabase.ts** - `getFlowsByEventMode()` method
2. **src/routes/flowRoutes.ts** - GET /api/flows endpoint
3. **examples/test-flow-api.sh** - Added test for empty mode
4. **API_GUIDE.md** - Updated documentation
5. **QUICK_REFERENCE.md** - Added empty mode example
6. **examples/flow-api-client.ts** - Added empty mode query example

## Implementation Details

### Database Query Logic

When `mode` parameter is an **empty string** (`""`):
```sql
SELECT id, name, description, flow, event
FROM flows
WHERE event->>'mode' = '' 
   OR event->>'mode' IS NULL 
   OR event IS NULL
ORDER BY created_at DESC
```

When `mode` parameter is **specified**:
```sql
SELECT id, name, description, flow, event
FROM flows
WHERE event->>'mode' = $1
ORDER BY created_at DESC
```

When `mode` parameter is **not provided**:
```sql
SELECT id, name, description, flow, event 
FROM flows 
ORDER BY created_at DESC
```

### Route Behavior

| Query | Behavior |
|-------|----------|
| `/api/flows` | Returns all flows (no filter) |
| `/api/flows?mode=webhook` | Returns flows where event.mode = 'webhook' |
| `/api/flows?mode=` | Returns flows where event.mode is empty, null, or event is null |

## Usage Examples

### cURL Examples

```bash
# Get all flows with empty or null mode
curl "http://localhost:3000/api/flows?mode="

# Get all webhook flows
curl "http://localhost:3000/api/flows?mode=webhook"

# Get all flows (no filter)
curl "http://localhost:3000/api/flows"
```

### TypeScript Client

```typescript
const client = new FlowApiClient();

// Get flows with empty mode
const emptyModeFlows = await client.getFlowsByMode('');

// Get flows with specific mode
const webhookFlows = await client.getFlowsByMode('webhook');

// Get all flows
const allFlows = await client.getAllFlows();
```

### JavaScript Fetch

```javascript
// Empty mode query
const response = await fetch('http://localhost:3000/api/flows?mode=');
const flows = await response.json();

// Specific mode query
const response2 = await fetch('http://localhost:3000/api/flows?mode=webhook');
const webhookFlows = await response2.json();
```

## Use Cases

### 1. Finding Incomplete Flows
Flows that were created without proper event mode configuration:
```bash
curl "http://localhost:3000/api/flows?mode="
```

### 2. Data Quality Check
Identify flows that need event metadata to be set:
```sql
SELECT COUNT(*) 
FROM flows 
WHERE event->>'mode' = '' 
   OR event->>'mode' IS NULL 
   OR event IS NULL;
```

### 3. Migration Validation
After migrating from VARCHAR to JSONB, check for flows that need event metadata:
```bash
# Find flows with empty mode
EMPTY_FLOWS=$(curl -s "http://localhost:3000/api/flows?mode=" | jq 'length')
echo "Flows with empty mode: $EMPTY_FLOWS"
```

## Testing

Run the test script to verify empty mode query works:
```bash
./examples/test-flow-api.sh
```

The test script will:
1. Create a flow with empty mode
2. Query flows with `mode=` parameter
3. Verify the empty mode flow is returned
4. Clean up the test flow

### Expected Test Output

```
7b. Creating a flow with empty mode...
Created flow with ID: 550e8400-e29b-41d4-a716-446655440000
Response: {"id":"550e8400...","name":"No Mode Flow","event":{"mode":"","command":"","option":""}}

7c. Querying flows with mode='' (empty string)...
Empty mode flows: [{"id":"550e8400...","name":"No Mode Flow","event":{"mode":"","command":"","option":""}}]
```

## Edge Cases Handled

1. **Empty String Mode**: `event.mode = ""`
2. **Null Mode**: `event.mode = null`
3. **Null Event**: `event = null`
4. **Missing Mode Field**: Event object exists but mode field is missing

All these cases are returned when querying with `?mode=`

## Performance Considerations

The query uses the existing JSONB index `idx_flows_event_mode`:
```sql
CREATE INDEX idx_flows_event_mode ON flows ((event->>'mode'));
```

This index covers:
- ✅ Specific mode queries: `WHERE event->>'mode' = 'webhook'`
- ✅ Empty string queries: `WHERE event->>'mode' = ''`
- ⚠️ NULL checks: `WHERE event->>'mode' IS NULL` (may do index scan + filter)

For optimal performance with NULL queries, consider adding a partial index:
```sql
CREATE INDEX idx_flows_event_mode_null 
ON flows ((event->>'mode')) 
WHERE event->>'mode' IS NULL OR event IS NULL;
```

## Backward Compatibility

✅ **Fully backward compatible** - No breaking changes:
- Existing queries without `mode` parameter work as before
- Existing queries with specific modes work as before
- New functionality only activates when `mode=` is explicitly used

## Error Handling

The implementation handles all edge cases gracefully:
- No special error codes needed
- Returns empty array `[]` if no flows match
- Standard 500 error for database issues

## Migration Impact

If you have existing flows with empty or null event modes:
- They can now be found using `?mode=`
- No data migration required
- Consider backfilling empty modes with appropriate values

## Recommendations

1. **Validate Event Mode on Create**: Add validation to ensure mode is always set
2. **Backfill Empty Modes**: Update existing flows with empty modes
3. **Monitor Usage**: Track how often empty mode query is used
4. **Consider Default Mode**: Set a default mode value in database schema

## Related Documentation

- [API_GUIDE.md](API_GUIDE.md) - Complete API documentation
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Quick reference guide
- [FLOW_API_CHANGES.md](FLOW_API_CHANGES.md) - All API changes
