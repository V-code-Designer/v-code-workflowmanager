import { Model } from "./Model";
import { Status } from "./util/status";

export abstract class Processor<T extends Model> {
    model!: T;
    abstract process(model: T): Promise<void>;
    constructor(model: T) {
        this.model = model;
    }
    onStart(model: T): void {
        this.model = model;
        let now = Date.now();
        this.model.createdAt = now;
        this.model.updatedAt = now;
        this.model.status = Status.Started;
    }
    onComplete(model: T): void {
        this.model = model;
        let now = Date.now();
        this.model.completedAt = now;
        this.model.updatedAt = now;
        this.model.status = Status.Completed;
    }


}