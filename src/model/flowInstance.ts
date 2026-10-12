import { TaskInstance } from "./taskInstance";

export interface FlowInstance {
    id: string;
    flowId: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    createdAt: Date;
    updatedAt: Date;
    inputData: string;
    outputData: string;
    history: Array<TaskInstance>;
}