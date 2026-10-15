import { Flow } from '../model/flow';
import { Task } from '../model/task';
import { FlowInstance } from '../model/flowInstance';
import { TaskInstance } from '../model/taskInstance';

export interface IDatabase {
  connect(): Promise<void>;
  disconnect(): Promise<void>;

  createFlow(flow: Omit<Flow, 'id'>): Promise<Flow>;
  getFlowById(id: string): Promise<Flow | null>;
  getAllFlows(): Promise<Flow[]>;
  getFlowsByEventMode(mode: string): Promise<Flow[]>;
  updateFlow(id: string, flow: Partial<Omit<Flow, 'id'>>): Promise<Flow | null>;
  deleteFlow(id: string): Promise<boolean>;

  createTask(task: Omit<Task, 'id'>): Promise<Task>;
  getTaskById(id: string): Promise<Task | null>;
  getAllTasks(): Promise<Task[]>;
  updateTask(id: string, task: Partial<Omit<Task, 'id'>>): Promise<Task | null>;
  deleteTask(id: string): Promise<boolean>;

  createFlowInstance(flowInstance: Omit<FlowInstance, 'id'>): Promise<FlowInstance>;
  getFlowInstanceById(id: string): Promise<FlowInstance | null>;
  getAllFlowInstances(): Promise<FlowInstance[]>;
  getFlowInstancesByFlowId(flowId: string): Promise<FlowInstance[]>;
  updateFlowInstance(id: string, flowInstance: Partial<Omit<FlowInstance, 'id' | 'history'>>): Promise<FlowInstance | null>;
  deleteFlowInstance(id: string): Promise<boolean>;

  createTaskInstance(taskInstance: Omit<TaskInstance, 'id'>): Promise<TaskInstance>;
  getTaskInstanceById(id: string): Promise<TaskInstance | null>;
  getAllTaskInstances(): Promise<TaskInstance[]>;
  getTaskInstancesByFlowInstanceId(flowInstanceId: string): Promise<TaskInstance[]>;
  updateTaskInstance(id: string, taskInstance: Partial<Omit<TaskInstance, 'id'>>): Promise<TaskInstance | null>;
  deleteTaskInstance(id: string): Promise<boolean>;
}
