/**
 * Flow API Client Example
 * Demonstrates how to interact with the Flow CRUD API
 */

interface EventMetadata {
  mode: string;
  command?: string;
  option?: string;
}

interface Flow {
  id?: string;
  name: string;
  description: string;
  flow: string;
  event: EventMetadata | string;
}

class FlowApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3000/api/flows') {
    this.baseUrl = baseUrl;
  }

  async createFlow(flow: Omit<Flow, 'id'>): Promise<Flow> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(flow),
    });

    if (!response.ok) {
      throw new Error(`Failed to create flow: ${response.statusText}`);
    }

    return response.json();
  }

  async getAllFlows(): Promise<Flow[]> {
    const response = await fetch(this.baseUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch flows: ${response.statusText}`);
    }

    return response.json();
  }

  async getFlowsByMode(mode: string): Promise<Flow[]> {
    const url = `${this.baseUrl}?mode=${encodeURIComponent(mode)}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch flows by mode: ${response.statusText}`);
    }

    return response.json();
  }

  async getFlowById(id: string): Promise<Flow> {
    const response = await fetch(`${this.baseUrl}/${id}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch flow: ${response.statusText}`);
    }

    return response.json();
  }

  async updateFlow(id: string, updates: Partial<Omit<Flow, 'id'>>): Promise<Flow> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`Failed to update flow: ${response.statusText}`);
    }

    return response.json();
  }

  async deleteFlow(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete flow: ${response.statusText}`);
    }
  }
}

// Usage Examples
async function examples() {
  const client = new FlowApiClient();

  try {
    // Example 1: Create a webhook flow
    console.log('Creating a webhook flow...');
    const webhookFlow = await client.createFlow({
      name: 'Order Processing Webhook',
      description: 'Processes incoming orders via webhook',
      flow: JSON.stringify({
        steps: ['validate', 'process', 'notify'],
      }),
      event: {
        mode: 'webhook',
        command: '/api/orders/webhook',
        option: 'async',
      },
    });
    console.log('Created:', webhookFlow);

    // Example 2: Create a scheduled flow
    console.log('\nCreating a scheduled flow...');
    const scheduledFlow = await client.createFlow({
      name: 'Daily Backup',
      description: 'Automated daily backup',
      flow: JSON.stringify({
        steps: ['backup', 'verify', 'cleanup'],
      }),
      event: {
        mode: 'scheduled',
        command: '0 2 * * *',
        option: 'cron',
      },
    });
    console.log('Created:', scheduledFlow);

    // Example 3: Get all flows
    console.log('\nFetching all flows...');
    const allFlows = await client.getAllFlows();
    console.log(`Found ${allFlows.length} flows`);

    // Example 4: Query flows by mode
    console.log('\nQuerying flows with mode=webhook...');
    const webhookFlows = await client.getFlowsByMode('webhook');
    console.log(`Found ${webhookFlows.length} webhook flows`);

    // Example 4b: Query flows with empty mode
    console.log('\nQuerying flows with empty mode...');
    const emptyModeFlows = await client.getFlowsByMode('');
    console.log(`Found ${emptyModeFlows.length} flows with empty mode`);

    // Example 5: Get specific flow
    if (webhookFlow.id) {
      console.log(`\nFetching flow ${webhookFlow.id}...`);
      const flow = await client.getFlowById(webhookFlow.id);
      console.log('Flow:', flow);
    }

    // Example 6: Update flow
    if (webhookFlow.id) {
      console.log(`\nUpdating flow ${webhookFlow.id}...`);
      const updatedFlow = await client.updateFlow(webhookFlow.id, {
        description: 'Updated description',
        event: {
          mode: 'webhook',
          command: '/api/v2/orders/webhook',
          option: 'sync',
        },
      });
      console.log('Updated:', updatedFlow);
    }

    // Example 7: Delete flows
    if (webhookFlow.id) {
      console.log(`\nDeleting flow ${webhookFlow.id}...`);
      await client.deleteFlow(webhookFlow.id);
      console.log('Deleted successfully');
    }

    if (scheduledFlow.id) {
      console.log(`\nDeleting flow ${scheduledFlow.id}...`);
      await client.deleteFlow(scheduledFlow.id);
      console.log('Deleted successfully');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Helper function to create flows from examples file
async function createFlowsFromExamples() {
  const client = new FlowApiClient();

  // Load examples from the examples file
  const examplesResponse = await fetch('/examples/flow-examples.json');
  const { examples } = await examplesResponse.json();

  for (const example of examples) {
    try {
      const flow = await client.createFlow({
        name: example.name,
        description: example.description,
        flow: JSON.stringify(example.flow),
        event: example.event,
      });
      console.log(`Created flow: ${flow.name} (${flow.id})`);
    } catch (error) {
      console.error(`Failed to create flow ${example.name}:`, error);
    }
  }
}

// Export the client
export { FlowApiClient, Flow, EventMetadata };

// Run examples if this file is executed directly
if (require.main === module) {
  examples().catch(console.error);
}
