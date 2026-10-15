import { Kafka, Consumer, Producer, logLevel } from 'kafkajs';
import { IEventStore, EventHandler } from './IEventStore';

export class KafkaEventStore implements IEventStore {
  private kafka: Kafka;
  private producer: Producer;
  private consumers: Map<string, Consumer> = new Map();
  private connected: boolean = false;

  constructor(brokers?: string[]) {
    const kafkaBrokers = brokers || process.env.KAFKA_BROKERS?.split(',') || ['localhost:9093'];

    this.kafka = new Kafka({
      clientId: process.env.KAFKA_CLIENT_ID || 'flow-manager',
      brokers: kafkaBrokers,
      logLevel: logLevel.INFO,
      retry: {
        initialRetryTime: 100,
        retries: 8
      }
    });

    this.producer = this.kafka.producer();
  }

  async connect(): Promise<void> {
    try {
      await this.producer.connect();
      this.connected = true;
      console.log('✓ Kafka EventStore connected successfully');
    } catch (error) {
      console.error('Failed to connect to Kafka EventStore:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.producer.disconnect();

      for (const [topic, consumer] of this.consumers.entries()) {
        await consumer.disconnect();
        console.log(`✓ Consumer for topic "${topic}" disconnected`);
      }

      this.consumers.clear();
      this.connected = false;
      console.log('✓ Kafka EventStore disconnected');
    } catch (error) {
      console.error('Error disconnecting from Kafka EventStore:', error);
      throw error;
    }
  }

  async publish(topic: string, message: any, key?: string): Promise<void> {
    if (!this.connected) {
      throw new Error('Kafka EventStore is not connected');
    }

    try {
      await this.producer.send({
        topic,
        messages: [
          {
            key: key || null,
            value: JSON.stringify(message),
            timestamp: Date.now().toString()
          }
        ]
      });
      console.log(`✓ Message published to topic "${topic}"`);
    } catch (error) {
      console.error(`Failed to publish to topic "${topic}":`, error);
      throw error;
    }
  }

  async subscribe(topic: string, handler: EventHandler): Promise<void> {
    try {
      const groupId = process.env.KAFKA_CONSUMER_GROUP || 'flow-manager-group';
      const consumer = this.kafka.consumer({
        groupId: `${groupId}-${topic}`,
        retry: {
          initialRetryTime: 100,
          retries: 8
        }
      });

      await consumer.connect();
      await consumer.subscribe({ topic, fromBeginning: true });

      console.log(`✓ Subscribed to topic "${topic}"`);

      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const value = message.value?.toString();
            const parsedMessage = value ? JSON.parse(value) : null;

            console.log(`Received message from topic "${topic}":`, {
              partition,
              offset: message.offset,
              key: message.key?.toString(),
              value: parsedMessage
            });

            await handler(parsedMessage);
          } catch (error) {
            console.error('Error processing message:', error);
          }
        },
      });

      this.consumers.set(topic, consumer);
    } catch (error) {
      console.error(`Failed to subscribe to topic "${topic}":`, error);
      throw error;
    }
  }

  async createTopic(topic: string, options?: any): Promise<void> {
    try {
      const admin = this.kafka.admin();
      await admin.connect();

      const existingTopics = await admin.listTopics();

      if (!existingTopics.includes(topic)) {
        await admin.createTopics({
          topics: [{
            topic,
            numPartitions: options?.numPartitions || 1,
            replicationFactor: options?.replicationFactor || 1,
            ...options
          }]
        });
        console.log(`✓ Topic "${topic}" created successfully`);
      } else {
        console.log(`✓ Topic "${topic}" already exists`);
      }

      await admin.disconnect();
    } catch (error) {
      console.error(`Failed to create topic "${topic}":`, error);
      throw error;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }
}
