# Flow API Deployment Checklist

## Pre-Deployment

### 1. Backup Database
```bash
# PostgreSQL backup
pg_dump -U your_user -d your_database > backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup
ls -lh backup_*.sql
```

### 2. Review Changes
- [ ] Review [FLOW_API_CHANGES.md](FLOW_API_CHANGES.md)
- [ ] Check all modified files
- [ ] Verify event metadata structure matches requirements

### 3. Test Locally
```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your local database credentials

# Run tests
npm test

# Test API endpoints
./examples/test-flow-api.sh
```

## Database Migration

### 4. Run Migration Script
```bash
# Connect to your database
psql -U your_user -d your_database

# Verify current schema
\d flows

# Run migration
\i migrations/001_update_event_to_jsonb.sql

# Verify new schema
\d flows

# Check index was created
\di idx_flows_event_mode

# Exit
\q
```

### 5. Verify Data Migration
```sql
-- Check if all events were migrated properly
SELECT id, name, event FROM flows LIMIT 10;

-- Check event types
SELECT 
  event->>'mode' as mode,
  COUNT(*) as count
FROM flows
GROUP BY event->>'mode';

-- Verify JSON structure
SELECT 
  id, 
  name,
  event->>'mode' as mode,
  event->>'command' as command,
  event->>'option' as option
FROM flows
WHERE event IS NOT NULL
LIMIT 5;
```

## Application Deployment

### 6. Update Application Code
```bash
# Pull latest code
git pull origin main

# Install/update dependencies
npm install

# Build application
npm run build
```

### 7. Update Environment Variables
```bash
# Verify DATABASE_URL is set correctly
echo $DATABASE_URL

# Check other required variables
cat .env | grep -v "^#" | grep -v "^$"
```

### 8. Start Application
```bash
# Development
npm run dev

# Production
npm start

# Or using PM2
pm2 restart flow-api
```

## Post-Deployment Verification

### 9. Health Checks
```bash
# Check if server is running
curl http://localhost:3000/health

# Check API documentation
curl http://localhost:3000/api-docs

# Test basic endpoints
curl http://localhost:3000/api/flows
```

### 10. Test CRUD Operations

#### Create Flow
```bash
FLOW_ID=$(curl -s -X POST http://localhost:3000/api/flows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Flow",
    "description": "Deployment test",
    "flow": "{}",
    "event": {
      "mode": "webhook",
      "command": "/test",
      "option": ""
    }
  }' | jq -r '.id')

echo "Created flow: $FLOW_ID"
```

#### Read Flow
```bash
curl -s http://localhost:3000/api/flows/$FLOW_ID | jq
```

#### Query by Mode
```bash
curl -s "http://localhost:3000/api/flows?mode=webhook" | jq
```

#### Update Flow
```bash
curl -s -X PUT http://localhost:3000/api/flows/$FLOW_ID \
  -H "Content-Type: application/json" \
  -d '{
    "event": {
      "mode": "webhook",
      "command": "/updated",
      "option": "sync"
    }
  }' | jq
```

#### Delete Flow
```bash
curl -s -X DELETE http://localhost:3000/api/flows/$FLOW_ID
```

### 11. Performance Check
```bash
# Check query performance with mode filter
time curl -s "http://localhost:3000/api/flows?mode=webhook" > /dev/null

# Check database index is being used
psql -U your_user -d your_database -c "
  EXPLAIN ANALYZE 
  SELECT * FROM flows 
  WHERE event->>'mode' = 'webhook';
"
```

### 12. Monitor Logs
```bash
# Check application logs
tail -f logs/application.log

# Check for errors
grep -i error logs/application.log

# Monitor database connections
psql -U your_user -d your_database -c "
  SELECT count(*) as active_connections 
  FROM pg_stat_activity 
  WHERE datname = 'your_database';
"
```

## Rollback Plan

### If Issues Occur

#### 1. Application Rollback
```bash
# Stop current version
pm2 stop flow-api

# Revert to previous version
git checkout previous-commit-hash

# Reinstall dependencies
npm install

# Restart
pm2 start flow-api
```

#### 2. Database Rollback
```bash
# Restore from backup
psql -U your_user -d your_database < backup_YYYYMMDD_HHMMSS.sql

# Verify restoration
psql -U your_user -d your_database -c "\d flows"
```

## Monitoring

### Key Metrics to Watch

1. **API Response Times**
   - GET /api/flows
   - GET /api/flows?mode=webhook
   - POST /api/flows

2. **Database Performance**
   - Query execution time
   - Index usage
   - Connection pool status

3. **Error Rates**
   - 4xx errors (client errors)
   - 5xx errors (server errors)
   - Database connection errors

### Set Up Alerts

```bash
# Example: Alert on high error rate
# Configure your monitoring tool (e.g., Prometheus, DataDog, New Relic)
# to alert when:
# - Error rate > 5%
# - Response time > 500ms
# - Database connection failures
```

## Documentation Update

### 13. Update Team Documentation
- [ ] Share [API_GUIDE.md](API_GUIDE.md) with team
- [ ] Add link to Swagger docs in team wiki
- [ ] Update API examples in client applications
- [ ] Notify dependent services about new query capability

### 14. Update Client Code
If you have existing clients:
- [ ] Update TypeScript types to include EventMetadata
- [ ] Update API calls to use new query parameter
- [ ] Test client applications

## Success Criteria

- [ ] All existing flows accessible
- [ ] Can create flows with event metadata
- [ ] Can query flows by mode
- [ ] Swagger documentation works
- [ ] No performance degradation
- [ ] All tests passing
- [ ] No errors in logs
- [ ] Backup created and verified
- [ ] Team notified and documentation updated

## Support

If you encounter issues:
1. Check application logs
2. Check database logs
3. Review [FLOW_API_CHANGES.md](FLOW_API_CHANGES.md)
4. Run test script: `./examples/test-flow-api.sh`
5. Check [API_GUIDE.md](API_GUIDE.md) for troubleshooting

## Contacts

- **Database Admin**: [Contact Info]
- **DevOps Team**: [Contact Info]
- **API Team Lead**: [Contact Info]
