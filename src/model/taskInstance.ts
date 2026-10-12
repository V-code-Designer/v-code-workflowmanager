export interface TaskInstance {
    id: string;
    taskId: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    flowInstanceId: string;
    createdAt: Date;
    updatedAt: Date;
    inputData: string;
    outputData: string;
}