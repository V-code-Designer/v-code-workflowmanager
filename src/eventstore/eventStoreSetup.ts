import { IEventStore } from './IEventStore';
import { IDatabase } from '../database/IDatabase';
import { FlowService } from '../services/flowService';

/**
 * Event Store Topics Configuration
 */
export const EVENT_TOPICS = {
  FLOW_START: 'flow.start',
  FLOW_END: 'flow.end',
  FLOW_ERROR: 'flow.error',
  TASK_START: 'task.start',
  TASK_END: 'task.end',
  TASK_ERROR: 'task.error',
  NOTIFICATION: 'notification',
  AUDIT_LOG: 'audit.log',
} as const;

/**
 * Initialize Event Store
 * Creates all necessary topics and sets up subscriptions
 */
export async function initializeEventStore(
  eventStore: IEventStore,
  database: IDatabase
): Promise<void> {
  try {
    console.log('Initializing Event Store...');

    // Connect to event store
    await eventStore.connect();
    console.log('Connected to Event Store');

    // Create all topics
    await createTopics(eventStore);
    console.log('All topics created successfully');

    // Set up all subscriptions
    await setupSubscriptions(eventStore, database);
    console.log('All subscriptions set up successfully');

    console.log('Event Store initialization complete');
  } catch (error) {
    console.error('Failed to initialize Event Store:', error);
    throw error;
  }
}

/**
 * Create all event topics
 */
async function createTopics(eventStore: IEventStore): Promise<void> {
  const topics = Object.values(EVENT_TOPICS);

  console.log(`Creating ${topics.length} topics...`);

  for (const topic of topics) {
    try {
      await eventStore.createTopic(topic);
      console.log(`  ✓ Topic created: ${topic}`);
    } catch (error) {
      console.error(`  ✗ Failed to create topic: ${topic}`, error);
      // Continue with other topics even if one fails
    }
  }
}

/**
 * Set up all event subscriptions
 */
async function setupSubscriptions(
  eventStore: IEventStore,
  database: IDatabase
): Promise<void> {
  console.log('Setting up subscriptions...');

  // Subscribe to flow.start
  await eventStore.subscribe(EVENT_TOPICS.FLOW_START, async (message) => {
    console.log('Received flow.start event:', message);
    try {
      await FlowService.startFlow(eventStore, database, message);
    } catch (error) {
      console.error('Error processing flow.start event:', error);
      // Publish error event
      await publishErrorEvent(eventStore, EVENT_TOPICS.FLOW_ERROR, message, error);
    }
  });
  console.log(`  ✓ Subscribed to: ${EVENT_TOPICS.FLOW_START}`);

 /* 
  // Subscribe to flow.end
  await eventStore.subscribe(EVENT_TOPICS.FLOW_END, async (message) => {
    console.log('Received flow.end event:', message);
    try {
      await FlowService.endFlow(message.flowId, message.outputData);
      // Update flow instance status to COMPLETED
      await database.updateFlowInstance(message.instanceId, {
        status: 'completed',
        outputData: JSON.stringify(message.outputData),
        updatedAt: new Date()
      } as any);
    } catch (error) {
      console.error('Error processing flow.end event:', error);
      await publishErrorEvent(eventStore, EVENT_TOPICS.FLOW_ERROR, message, error);
    }
  });
  console.log(`  ✓ Subscribed to: ${EVENT_TOPICS.FLOW_END}`);


*/
  // Subscribe to task.start
  await eventStore.subscribe(EVENT_TOPICS.TASK_START, async (message) => {
    console.log('Received task.start event:', message);
    try {
      // Create task instance
      // Check if task data is available in the database by category and namespace
      const task = await database.getTaskByNamespace(message.namespace);
      if (!task) {
        throw new Error(`Task not found for namespace: ${message.namespace}`);
      }

      const taskInstance = await database.createTaskInstance({
        taskId: task.id,
        flowInstanceId: message.instanceId,
        inputData: JSON.stringify(message.inputData),
        status: 'pending',
        namespace: task.namespace,
        createdAt: new Date(),
        updatedAt: new Date(),
        outputData: ''
      });

      console.log('Task instance created:', taskInstance);
      await publishEvent(eventStore, message.namespace, {
        taskInstanceId: taskInstance.id,
        flowInstanceId: message.flowInstanceId,
        inputData: message.inputData
      });
    } catch (error) {
      console.error('Error processing task.start event:', error);
      await publishErrorEvent(eventStore, EVENT_TOPICS.TASK_ERROR, message, error);
    }
  });
  console.log(`  ✓ Subscribed to: ${EVENT_TOPICS.TASK_START}`);
/*
  // Subscribe to flow.error
  await eventStore.subscribe(EVENT_TOPICS.FLOW_ERROR, async (message) => {
    console.error('Received flow.error event:', message);
    try {
      // Update flow instance status to FAILED
      if (message.instanceId) {
        await database.updateFlowInstance(message.instanceId, {
          status: 'failed',
          outputData: JSON.stringify({ error: message.error }),
          updatedAt: new Date()
        } as any);
      }
    } catch (error) {
      console.error('Error processing flow.error event:', error);
    }
  });
  console.log(`  ✓ Subscribed to: ${EVENT_TOPICS.FLOW_ERROR}`);

  // Subscribe to task.end
  await eventStore.subscribe(EVENT_TOPICS.TASK_END, async (message) => {
    console.log('Received task.end event:', message);
    try {
      // Update task instance status to COMPLETED
      await database.updateTaskInstance(message.taskInstanceId, {
        status: 'completed',
        outputData: JSON.stringify(message.outputData),
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error processing task.end event:', error);
      await publishErrorEvent(eventStore, EVENT_TOPICS.TASK_ERROR, message, error);
    }
  });
  console.log(`  ✓ Subscribed to: ${EVENT_TOPICS.TASK_END}`);

  // Subscribe to task.error
  await eventStore.subscribe(EVENT_TOPICS.TASK_ERROR, async (message) => {
    console.error('Received task.error event:', message);
    try {
      // Update task instance status to FAILED
      if (message.taskInstanceId) {
        await database.updateTaskInstance(message.taskInstanceId, {
          status: 'failed',
          outputData: JSON.stringify({ error: message.error }),
          updatedAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error processing task.error event:', error);
    }
  });
  console.log(`  ✓ Subscribed to: ${EVENT_TOPICS.TASK_ERROR}`);

  // Subscribe to notification
  await eventStore.subscribe(EVENT_TOPICS.NOTIFICATION, async (message) => {
    console.log('Received notification event:', message);
    try {
      // Handle notifications (email, slack, etc.)
      console.log(`Notification: ${message.type} - ${message.message}`);
      // Add notification logic here
    } catch (error) {
      console.error('Error processing notification event:', error);
    }
  });
  console.log(`  ✓ Subscribed to: ${EVENT_TOPICS.NOTIFICATION}`);

  // Subscribe to audit.log
  await eventStore.subscribe(EVENT_TOPICS.AUDIT_LOG, async (message) => {
    console.log('Received audit.log event:', message);
    try {
      // Handle audit logging
      console.log(`Audit: [${message.action}] by ${message.user} at ${message.timestamp}`);
      // Add audit log storage logic here
    } catch (error) {
      console.error('Error processing audit.log event:', error);
    }
  });
  console.log(`  ✓ Subscribed to: ${EVENT_TOPICS.AUDIT_LOG}`);
  */
}

/**
 * Publish error event
 */
async function publishErrorEvent(
  eventStore: IEventStore,
  topic: string,
  originalMessage: any,
  error: any
): Promise<void> {
  try {
    await eventStore.publish(topic, {
      ...originalMessage,
      error: error.message || String(error),
      errorStack: error.stack,
      timestamp: new Date().toISOString(),
    });
  } catch (publishError) {
    console.error('Failed to publish error event:', publishError);
  }
}

/**
 * Graceful shutdown - cleanup event store subscriptions
 */
export async function shutdownEventStore(eventStore: IEventStore): Promise<void> {
  try {
    console.log('Shutting down Event Store...');
    await eventStore.disconnect();
    console.log('Event Store disconnected successfully');
  } catch (error) {
    console.error('Error during Event Store shutdown:', error);
    throw error;
  }
}

/**
 * Publish a custom event to a topic
 */
export async function publishEvent(
  eventStore: IEventStore,
  topic: string,
  payload: any
): Promise<void> {
  try {
    await eventStore.publish(topic, {
      ...payload,
      timestamp: new Date().toISOString(),
      eventId: `${topic}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    });
  } catch (error) {
    console.error(`Failed to publish event to ${topic}:`, error);
    throw error;
  }
}
