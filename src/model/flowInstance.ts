import { FlowStatus } from "./flowStatus";
import { TaskInstance } from "./taskInstance";

export interface FlowInstance {
    id: string;
    flowId: string;
    status: FlowStatus;
    createdAt?: Date;
    updatedAt: Date;
    inputData: string;
    outputData: string;
    history?: Array<TaskInstance>;
}