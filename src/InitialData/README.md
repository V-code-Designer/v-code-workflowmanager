# Initial Data

This directory contains JSON files with initial data that will be automatically loaded when the application starts.

## How It Works

The `DataLoader` service automatically loads initial data on application startup:

1. **On First Run**: When the database is empty, the initial data is loaded from JSON files
2. **On Subsequent Runs**: If data already exists, loading is skipped to prevent duplicates

## Files

### tasks.json

Contains the initial task definitions that will be loaded into the database.

**Structure:**
```json
[
  {
    "name": "Task Name",
    "category": "Category",
    "image": "icon-filename.png",
    "namespace": "com.example.namespace",
    "inputSchema": "JSON Schema string",
    "outputSchema": "JSON Schema string",
    "propertyScehema": "JSON Schema string"
  }
]
```

## Adding More Initial Data

To add initial data for other entities (flows, flow instances, etc.):

1. Create a new JSON file in this directory (e.g., `flows.json`)
2. Add a corresponding load method in `src/services/dataLoader.ts`
3. Call the method from the `loadInitialData()` function

## Example

```typescript
// In dataLoader.ts
private async loadFlows(): Promise<void> {
  const existingFlows = await this.database.getAllFlows();
  
  if (existingFlows.length > 0) {
    console.log('Flows already exist. Skipping initial flow load.');
    return;
  }

  const flowsData = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../InitialData/flows.json'), 'utf-8')
  );

  for (const flow of flowsData) {
    await this.database.createFlow(flow);
  }
}
```

## Current Initial Data

- **Tasks**: 3 task definitions
  - Start (Generic)
  - Stop (Generic)
  - Addition (Math)
