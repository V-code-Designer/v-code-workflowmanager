# Flow API Quick Reference

## Event Metadata Structure
```typescript
{
  mode: "webhook" | "scheduled" | "manual",
  command?: string,
  option?: string
}
```

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/flows` | Create a new flow |
| GET | `/api/flows` | Get all flows |
| GET | `/api/flows?mode={mode}` | Query flows by event mode |
| GET | `/api/flows/{id}` | Get flow by ID |
| PUT | `/api/flows/{id}` | Update flow |
| DELETE | `/api/flows/{id}` | Delete flow |
| POST | `/api/startflow` | Start flow execution |

## Quick Commands

### Create Webhook Flow
```bash
curl -X POST http://localhost:3000/api/flows \
  -H "Content-Type: application/json" \
  -d '{"name":"Webhook Flow","description":"Test","flow":"{}","event":{"mode":"webhook","command":"","option":""}}'
```

### Get All Flows
```bash
curl http://localhost:3000/api/flows
```

### Query by Mode
```bash
# Get webhook flows
curl "http://localhost:3000/api/flows?mode=webhook"

# Get scheduled flows
curl "http://localhost:3000/api/flows?mode=scheduled"

# Get manual flows
curl "http://localhost:3000/api/flows?mode=manual"

# Get flows with empty or null mode
curl "http://localhost:3000/api/flows?mode="
```

### Update Flow
```bash
curl -X PUT http://localhost:3000/api/flows/{id} \
  -H "Content-Type: application/json" \
  -d '{"event":{"mode":"webhook","command":"/new","option":"sync"}}'
```

### Delete Flow
```bash
curl -X DELETE http://localhost:3000/api/flows/{id}
```

### Start Flow
```bash
curl -X POST http://localhost:3000/api/startflow \
  -H "Content-Type: application/json" \
  -d '{"flowId":"{id}","inputData":{"key":"value"},"metadata":{"source":"api"}}'
```

## Event Mode Examples

### Webhook
```json
{
  "mode": "webhook",
  "command": "/api/trigger",
  "option": "async"
}
```

### Scheduled (Cron)
```json
{
  "mode": "scheduled",
  "command": "0 0 * * *",
  "option": "cron"
}
```

### Manual
```json
{
  "mode": "manual",
  "command": "",
  "option": ""
}
```

## Database Query Examples (PostgreSQL)

```sql
-- Get all webhook flows
SELECT * FROM flows WHERE event->>'mode' = 'webhook';

-- Get flows with specific command
SELECT * FROM flows WHERE event->>'command' = '/api/trigger';

-- Count flows by mode
SELECT event->>'mode' as mode, COUNT(*) 
FROM flows 
GROUP BY event->>'mode';

-- Get flows with async option
SELECT * FROM flows WHERE event->>'option' = 'async';
```

## Environment Variables

```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
DB_TYPE=postgres  # postgres | mysql | mongodb
PORT=3000
NODE_ENV=development
```

## Run Migration

```bash
psql -U user -d dbname -f migrations/001_update_event_to_jsonb.sql
```

## Test API

```bash
./examples/test-flow-api.sh
```

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 404 | Not Found |
| 500 | Internal Server Error |
