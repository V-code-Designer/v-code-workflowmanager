import { EventType } from "../model/eventType";

export class FlowService {
    async startFlow(event : EventType, inputData: any): Promise<void> {
        try {
            console.log("Starting flow");
            
            if(event === EventType.WEBHOOK) {

                console.log("Starting flow for WEBHOOK event");
                // Add logic to start the flow for WEBHOOK event here
            } else if(event === EventType.VERACODE_CLI) {
                console.log("Starting flow for VERACODE_CLI event");
                // Add logic to start the flow for VERACODE_CLI event here
            } else if(event === EventType.KAFKA) {
                console.log("Starting flow for KAFKA event");
                // Add logic to start the flow for KAFKA event here
            } else {
                throw new Error(`Unsupported event type: ${event}`);
            }
            // Add logic to start the flow here
        } catch (error) {
            console.error("Failed to start flow:", error);
            throw error;
        }
    }

    async stopFlow(flowId: string): Promise<void> {
        try {
            console.log(`Stopping flow with ID: ${flowId}`);
            // Add logic to stop the flow here
        } catch (error) {
            console.error(`Failed to stop flow with ID "${flowId}":`, error);
            throw error;
        }
    }
}