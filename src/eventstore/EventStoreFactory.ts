import { IEventStore } from './IEventStore';
import { KafkaEventStore } from './KafkaEventStore';
import { InMemoryEventStore } from './InMemoryEventStore';

export type EventStoreType = 'kafka' | 'inmemory';

export class EventStoreFactory {
  static createEventStore(type: EventStoreType, config?: any): IEventStore {
    switch (type) {
      case 'kafka':
        return new KafkaEventStore(config?.brokers);
      case 'inmemory':
        return new InMemoryEventStore();
      default:
        throw new Error(`Unsupported event store type: ${type}`);
    }
  }
}
