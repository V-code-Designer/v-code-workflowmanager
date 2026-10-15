"use strict";
/**
 * Event Store Usage Examples
 *
 * This file demonstrates how to use the event store abstraction layer
 * to publish and subscribe to events using either Kafka or In-Memory stores.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.exampleKafka = exampleKafka;
exports.exampleInMemory = exampleInMemory;
exports.exampleMultipleSubscribers = exampleMultipleSubscribers;
exports.exampleErrorHandling = exampleErrorHandling;
exports.exampleWorkflow = exampleWorkflow;
exports.exampleFactoryPattern = exampleFactoryPattern;
const eventstore_1 = require("../src/eventstore");
// Example 1: Basic Kafka Usage
async function exampleKafka() {
    console.log('\n=== Kafka Event Store Example ===\n');
    const eventStore = eventstore_1.EventStoreFactory.createEventStore('kafka');
    try {
        // Connect to Kafka
        await eventStore.connect();
        // Create topics
        await eventStore.createTopic('orders.created');
        await eventStore.createTopic('orders.processed');
        // Subscribe to events
        await eventStore.subscribe('orders.created', async (message) => {
            console.log('📥 Order created:', message);
            // Process the order
            await new Promise(resolve => setTimeout(resolve, 100));
            // Publish follow-up event
            await eventStore.publish('orders.processed', {
                orderId: message.orderId,
                status: 'processed',
                timestamp: new Date().toISOString()
            });
        });
        // Publish an order
        await eventStore.publish('orders.created', {
            orderId: 'order-123',
            customerId: 'customer-456',
            amount: 99.99,
            items: ['item-1', 'item-2']
        }, 'order-123'); // key for partitioning
        // Wait for processing
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    finally {
        await eventStore.disconnect();
    }
}
// Example 2: Basic In-Memory Usage
async function exampleInMemory() {
    console.log('\n=== In-Memory Event Store Example ===\n');
    const eventStore = eventstore_1.EventStoreFactory.createEventStore('inmemory');
    try {
        await eventStore.connect();
        // Create topic
        await eventStore.createTopic('user.activity');
        // Subscribe before publishing to receive messages
        await eventStore.subscribe('user.activity', async (message) => {
            console.log('👤 User activity:', message);
        });
        // Publish events
        await eventStore.publish('user.activity', {
            userId: 'user-789',
            action: 'login',
            timestamp: new Date().toISOString()
        });
        await eventStore.publish('user.activity', {
            userId: 'user-789',
            action: 'view_page',
            page: '/dashboard',
            timestamp: new Date().toISOString()
        });
        // Wait a bit for async processing
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    finally {
        await eventStore.disconnect();
    }
}
// Example 3: Multiple Subscribers Pattern
async function exampleMultipleSubscribers() {
    console.log('\n=== Multiple Subscribers Example ===\n');
    const eventStore = eventstore_1.EventStoreFactory.createEventStore('inmemory');
    try {
        await eventStore.connect();
        await eventStore.createTopic('payment.completed');
        // Subscriber 1: Send receipt
        await eventStore.subscribe('payment.completed', async (message) => {
            console.log('📧 Sending receipt to:', message.email);
        });
        // Subscriber 2: Update analytics
        await eventStore.subscribe('payment.completed', async (message) => {
            console.log('📊 Recording analytics for payment:', message.paymentId);
        });
        // Subscriber 3: Update inventory
        await eventStore.subscribe('payment.completed', async (message) => {
            console.log('📦 Updating inventory for order:', message.orderId);
        });
        // Publish event - all subscribers will receive it
        await eventStore.publish('payment.completed', {
            paymentId: 'pay-999',
            orderId: 'order-888',
            email: 'customer@example.com',
            amount: 149.99
        });
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    finally {
        await eventStore.disconnect();
    }
}
// Example 4: Error Handling
async function exampleErrorHandling() {
    console.log('\n=== Error Handling Example ===\n');
    const eventStore = eventstore_1.EventStoreFactory.createEventStore('inmemory');
    try {
        await eventStore.connect();
        await eventStore.createTopic('task.execute');
        // Subscriber with error handling
        await eventStore.subscribe('task.execute', async (message) => {
            try {
                console.log('⚙️ Processing task:', message.taskId);
                if (message.shouldFail) {
                    throw new Error('Simulated task failure');
                }
                console.log('✅ Task completed successfully');
            }
            catch (error) {
                console.error('❌ Task failed:', error);
                // In production: send to DLQ, log to monitoring, etc.
            }
        });
        // Publish successful task
        await eventStore.publish('task.execute', {
            taskId: 'task-1',
            shouldFail: false
        });
        // Publish failing task
        await eventStore.publish('task.execute', {
            taskId: 'task-2',
            shouldFail: true
        });
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    finally {
        await eventStore.disconnect();
    }
}
// Example 5: Event-Driven Workflow
async function exampleWorkflow() {
    console.log('\n=== Event-Driven Workflow Example ===\n');
    const eventStore = eventstore_1.EventStoreFactory.createEventStore('inmemory');
    try {
        await eventStore.connect();
        // Create workflow topics
        await eventStore.createTopic('workflow.started');
        await eventStore.createTopic('workflow.step1.completed');
        await eventStore.createTopic('workflow.step2.completed');
        await eventStore.createTopic('workflow.completed');
        // Step 1: Initial processing
        await eventStore.subscribe('workflow.started', async (message) => {
            console.log('🚀 Workflow started:', message.workflowId);
            await new Promise(resolve => setTimeout(resolve, 50));
            await eventStore.publish('workflow.step1.completed', {
                workflowId: message.workflowId,
                result: 'Step 1 done'
            });
        });
        // Step 2: Continue processing
        await eventStore.subscribe('workflow.step1.completed', async (message) => {
            console.log('⚡ Step 1 completed:', message.workflowId);
            await new Promise(resolve => setTimeout(resolve, 50));
            await eventStore.publish('workflow.step2.completed', {
                workflowId: message.workflowId,
                result: 'Step 2 done'
            });
        });
        // Final step
        await eventStore.subscribe('workflow.step2.completed', async (message) => {
            console.log('⚡ Step 2 completed:', message.workflowId);
            await new Promise(resolve => setTimeout(resolve, 50));
            await eventStore.publish('workflow.completed', {
                workflowId: message.workflowId,
                finalResult: 'All steps completed'
            });
        });
        // Monitor completion
        await eventStore.subscribe('workflow.completed', async (message) => {
            console.log('🎉 Workflow completed:', message.workflowId, message.finalResult);
        });
        // Start the workflow
        await eventStore.publish('workflow.started', {
            workflowId: 'wf-001',
            initiator: 'user-123'
        });
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    finally {
        await eventStore.disconnect();
    }
}
// Example 6: Factory Pattern - Environment-Based Selection
async function exampleFactoryPattern() {
    console.log('\n=== Factory Pattern Example ===\n');
    // Simulate environment variable
    const eventStoreType = (process.env.EVENT_STORE_TYPE || 'inmemory');
    console.log(`Using event store: ${eventStoreType}`);
    const eventStore = eventstore_1.EventStoreFactory.createEventStore(eventStoreType);
    try {
        await eventStore.connect();
        console.log(`Connected: ${eventStore.isConnected()}`);
        await eventStore.createTopic('test.topic');
        await eventStore.subscribe('test.topic', async (message) => {
            console.log('Received:', message);
        });
        await eventStore.publish('test.topic', {
            test: true,
            timestamp: new Date().toISOString()
        });
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    finally {
        await eventStore.disconnect();
        console.log(`Connected: ${eventStore.isConnected()}`);
    }
}
// Run examples
async function main() {
    try {
        // Run in-memory examples (no external dependencies)
        await exampleInMemory();
        await exampleMultipleSubscribers();
        await exampleErrorHandling();
        await exampleWorkflow();
        await exampleFactoryPattern();
        // Uncomment to run Kafka example (requires Kafka running)
        // await exampleKafka();
    }
    catch (error) {
        console.error('Example failed:', error);
        process.exit(1);
    }
}
// Run if executed directly
if (require.main === module) {
    main();
}
//# sourceMappingURL=eventstore-usage.js.map