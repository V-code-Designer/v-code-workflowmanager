import { IDatabase } from "../database/IDatabase";
import { IEventStore } from "../eventstore/IEventStore";
import { EventType } from "../model/eventType";
import { FlowStatus } from "../model/flowStatus";

export class FlowService {
    static async startFlow(eventStore: IEventStore, database: IDatabase, message: any): Promise<void> {
        const event = message.event as EventType;
        try {
            console.log("Starting flow");
            // Create flow instance db
             const instance = await database.createFlowInstance({
                flowId: message.flowId,
                status: FlowStatus.IN_PROGRESS,
                inputData: JSON.stringify(message.inputData),
                outputData: "",
                createdAt: new Date(),
                updatedAt: new Date()
            });
            let eventPayload = {
                flowId: message.flowId,
                inputData: message.inputData,
                arrayType: message.arrayType,
                namespace: "com.veracode.start",
                instanceId: instance.id,
                initialNodeId: message.initialNodeId
            };
            await eventStore.publish('task.start', eventPayload);

        } catch (error) {
            console.error("Failed to start flow:", error);
            throw error;
        }
    }

    static async endFlow(database: IDatabase, message: any): Promise<void> {
        try {
            console.log(`Ending flow with ID: ${message.model.flow_instance_id}`);
            if (message.result) {
                console.log(`Flow output data:`, message.result);
                database.updateFlowInstance(message.model.flow_instance_id, {status: FlowStatus.COMPLETED, outputData: message.result});

            }
            
        } catch (error) {
            console.error(`Failed to end flow with ID "${message.model.flow_instance_id}":`, error);
            throw error;
        }
    }


}