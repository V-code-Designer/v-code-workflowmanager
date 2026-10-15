import { TaskMetadata } from "./model/TaskMetaData";
import { Status } from "./util/status";

export abstract class Model {
    createdAt!: number;
    completedAt!: number;
    updatedAt!: number;
    status!: Status;   
    metadata!: TaskMetadata;
    
    public abstract feedData(model:Object):void;

    constructor(metadata : TaskMetadata){
        this.metadata = metadata;
        this.createdAt = Date.now();
        this.status = Status.Started;
    }

}