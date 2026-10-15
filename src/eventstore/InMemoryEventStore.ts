import { IEventStore, EventHandler } from './IEventStore';

interface Subscription {
  topic: string;
  handler: EventHandler;
}

export class InMemoryEventStore implements IEventStore {
  private connected: boolean = false;
  private subscriptions: Map<string, EventHandler[]> = new Map();
  private topics: Set<string> = new Set();
  private messageStore: Map<string, any[]> = new Map();

  async connect(): Promise<void> {
    this.connected = true;
    console.log('✓ InMemory EventStore connected successfully');
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.subscriptions.clear();
    this.topics.clear();
    this.messageStore.clear();
    console.log('✓ InMemory EventStore disconnected');
  }

  async publish(topic: string, message: any, key?: string): Promise<void> {
    if (!this.connected) {
      throw new Error('InMemory EventStore is not connected');
    }

    if (!this.topics.has(topic)) {
      await this.createTopic(topic);
    }

    const enrichedMessage = {
      ...message,
      _key: key,
      _timestamp: new Date().toISOString(),
      _topic: topic
    };

    // Store message
    if (!this.messageStore.has(topic)) {
      this.messageStore.set(topic, []);
    }
    this.messageStore.get(topic)!.push(enrichedMessage);

    // Notify subscribers
    const handlers = this.subscriptions.get(topic) || [];
    for (const handler of handlers) {
      try {
        await handler(message);
      } catch (error) {
        console.error(`Error in handler for topic "${topic}":`, error);
      }
    }

    console.log(`✓ Message published to topic "${topic}"`);
  }

  async subscribe(topic: string, handler: EventHandler): Promise<void> {
    if (!this.connected) {
      throw new Error('InMemory EventStore is not connected');
    }

    if (!this.topics.has(topic)) {
      await this.createTopic(topic);
    }

    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, []);
    }

    this.subscriptions.get(topic)!.push(handler);
    console.log(`✓ Subscribed to topic "${topic}"`);

    // Replay existing messages for this topic
    const messages = this.messageStore.get(topic) || [];
    for (const message of messages) {
      try {
        await handler(message);
      } catch (error) {
        console.error(`Error replaying message for topic "${topic}":`, error);
      }
    }
  }

  async createTopic(topic: string, options?: any): Promise<void> {
    if (!this.topics.has(topic)) {
      this.topics.add(topic);
      console.log(`✓ Topic "${topic}" created successfully`);
    } else {
      console.log(`✓ Topic "${topic}" already exists`);
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  // Additional utility methods for testing/debugging
  getMessages(topic: string): any[] {
    return this.messageStore.get(topic) || [];
  }

  getTopics(): string[] {
    return Array.from(this.topics);
  }

  clearTopic(topic: string): void {
    this.messageStore.delete(topic);
    console.log(`✓ Topic "${topic}" cleared`);
  }

  clearAll(): void {
    this.messageStore.clear();
    console.log('✓ All topics cleared');
  }
}
