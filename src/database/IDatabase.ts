import { Flow } from '../model/flow';
import { Task } from '../model/task';

export interface IDatabase {
  connect(): Promise<void>;
  disconnect(): Promise<void>;

  createFlow(flow: Omit<Flow, 'id'>): Promise<Flow>;
  getFlowById(id: string): Promise<Flow | null>;
  getAllFlows(): Promise<Flow[]>;
  updateFlow(id: string, flow: Partial<Omit<Flow, 'id'>>): Promise<Flow | null>;
  deleteFlow(id: string): Promise<boolean>;

  createTask(task: Omit<Task, 'id'>): Promise<Task>;
  getTaskById(id: string): Promise<Task | null>;
  getAllTasks(): Promise<Task[]>;
  updateTask(id: string, task: Partial<Omit<Task, 'id'>>): Promise<Task | null>;
  deleteTask(id: string): Promise<boolean>;
}
