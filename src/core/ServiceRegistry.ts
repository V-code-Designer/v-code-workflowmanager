import { Model } from "./Model";
import { Processor } from "./Processor";

export class ServiceRegistry {
    
    private constructor() {}

    static getInstance(): ServiceRegistry {
        if (!ServiceRegistry.instance) {
            ServiceRegistry.instance = new ServiceRegistry();
        }
        return ServiceRegistry.instance;
    }

    private static instance: ServiceRegistry;
    private static services: Map<string, any> = new Map();

    static registerService<T extends Model>(processor: new () => Processor<T>, model: new () => T): void {
        if (ServiceRegistry.instance == undefined) {
            ServiceRegistry.instance = new ServiceRegistry();
        }
        const processorInstance = new processor();
        const modelInstance = new model();
        
    }

    static getService<T extends Model>(namespace: string): T | undefined {
        return this.services.get(namespace) as T | undefined;
    }
}