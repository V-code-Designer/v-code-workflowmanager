import { Kafka, Consumer, Producer, logLevel } from 'kafkajs';

export class KafkaService {
  private kafka: Kafka;
  private producer: Producer;
  private consumer: Consumer;
  private isConnected: boolean = false;

  constructor() {
    const brokers = process.env.KAFKA_BROKERS?.split(',') || ['localhost:9093'];

    this.kafka = new Kafka({
      clientId: 'flow-manager',
      brokers,
      logLevel: logLevel.INFO,
      retry: {
        initialRetryTime: 100,
        retries: 8
      }
    });

    this.producer = this.kafka.producer();
    this.consumer = this.kafka.consumer({ groupId: 'flow-manager-group' });
  }

  async connect(): Promise<void> {
    try {
      await this.producer.connect();
      await this.consumer.connect();
      this.isConnected = true;
      console.log('✓ Kafka connected successfully');
    } catch (error) {
      console.error('Failed to connect to Kafka:', error);
      throw error;
    }
  }

  async createTopic(topicName: string): Promise<void> {
    try {
      const admin = this.kafka.admin();
      await admin.connect();

      const existingTopics = await admin.listTopics();

      if (!existingTopics.includes(topicName)) {
        await admin.createTopics({
          topics: [{
            topic: topicName,
            numPartitions: 1,
            replicationFactor: 1
          }]
        });
        console.log(`✓ Topic "${topicName}" created successfully`);
      } else {
        console.log(`✓ Topic "${topicName}" already exists`);
      }

      await admin.disconnect();
    } catch (error) {
      console.error(`Failed to create topic "${topicName}":`, error);
      throw error;
    }
  }

  async subscribe(topicName: string, handler: (message: any) => Promise<void>): Promise<void> {
    try {
      await this.consumer.subscribe({ topic: topicName, fromBeginning: true });

      console.log(`✓ Subscribed to topic "${topicName}"`);

      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const value = message.value?.toString();
            const parsedMessage = value ? JSON.parse(value) : null;

            console.log(`Received message from topic "${topic}":`, {
              partition,
              offset: message.offset,
              value: parsedMessage
            });

            await handler(parsedMessage);
          } catch (error) {
            console.error('Error processing message:', error);
          }
        },
      });
    } catch (error) {
      console.error(`Failed to subscribe to topic "${topicName}":`, error);
      throw error;
    }
  }

  async publish(topicName: string, message: any): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Kafka is not connected');
    }

    try {
      await this.producer.send({
        topic: topicName,
        messages: [
          {
            value: JSON.stringify(message),
            timestamp: Date.now().toString()
          }
        ]
      });
      console.log(`✓ Message published to topic "${topicName}"`);
    } catch (error) {
      console.error(`Failed to publish to topic "${topicName}":`, error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.producer.disconnect();
      await this.consumer.disconnect();
      this.isConnected = false;
      console.log('✓ Kafka disconnected');
    } catch (error) {
      console.error('Error disconnecting from Kafka:', error);
      throw error;
    }
  }
}
