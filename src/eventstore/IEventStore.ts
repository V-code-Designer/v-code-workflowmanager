export interface EventMessage {
  topic: string;
  key?: string;
  value: any;
  timestamp?: string;
  headers?: Record<string, string>;
}

export interface EventHandler {
  (message: any): Promise<void>;
}

export interface IEventStore {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  publish(topic: string, message: any, key?: string): Promise<void>;
  subscribe(topic: string, handler: EventHandler): Promise<void>;
  createTopic(topic: string, options?: any): Promise<void>;
  isConnected(): boolean;
}
