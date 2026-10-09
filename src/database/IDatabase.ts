import { Flow } from '../model/flow';

export interface IDatabase {
  connect(): Promise<void>;
  disconnect(): Promise<void>;

  createFlow(flow: Omit<Flow, 'id'>): Promise<Flow>;
  getFlowById(id: string): Promise<Flow | null>;
  getAllFlows(): Promise<Flow[]>;
  updateFlow(id: string, flow: Partial<Omit<Flow, 'id'>>): Promise<Flow | null>;
  deleteFlow(id: string): Promise<boolean>;
}
