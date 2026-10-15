import { Router, Request, Response } from 'express';
import { IDatabase } from '../database/IDatabase';
import { IEventStore } from '../eventstore';
import { FlowStatus } from '../model/flowStatus';

export function createStartFlowRouter(database: IDatabase, eventStore: IEventStore): Router {
  const router = Router();

  /**
   * @swagger
   * components:
   *   schemas:
   *     StartFlowRequest:
   *       type: object
   *       required:
   *         - event
   *         - inputData
   *       properties:
   *         inputData:
   *           type: object
   *           description: Input data for the flow execution with key-value pairs
   *           additionalProperties: true
   *         event:
   *           type: string
   *           description: Event mode to trigger (webhook, scheduled, manual)
   *         arrayType:
   *           type: boolean
   *           description: Whether to process input data as an array
   *           default: false
   *       example:
   *         inputData:
   *           a1: "2"
   *           a2: "3"
   *         event: "webhook"
   *         arrayType: false
   *     StartFlowResponse:
   *       type: object
   *       properties:
   *         message:
   *           type: string
   *           description: Success message
   *         topic:
   *           type: string
   *           description: Event store topic name
   *         eventId:
   *           type: string
   *           description: Generated event ID
   *         timestamp:
   *           type: string
   *           format: date-time
   *           description: Event timestamp
   *         flowsStarted:
   *           type: number
   *           description: Number of flows started
   *         flows:
   *           type: array
   *           items:
   *             type: object
   *             properties:
   *               flowId:
   *                 type: string
   *               flowName:
   *                 type: string
   *       example:
   *         message: "Flow start events published successfully"
   *         topic: "flow.start"
   *         eventId: "flow-1234567890-abc123"
   *         timestamp: "2026-10-15T12:00:00.000Z"
   *         flowsStarted: 2
   *         flows:
   *           - flowId: "550e8400-e29b-41d4-a716-446655440000"
   *             flowName: "Webhook Flow 1"
   *           - flowId: "660e8400-e29b-41d4-a716-446655440001"
   *             flowName: "Webhook Flow 2"
   */

  /**
   * @swagger
   * /api/startflow:
   *   post:
   *     summary: Start flow execution(s) by event mode
   *     description: Finds all flows matching the event mode and publishes flow start events for each
   *     tags: [Flow Execution]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/StartFlowRequest'
   *     responses:
   *       202:
   *         description: Flow start event(s) published successfully (Accepted)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/StartFlowResponse'
   *       400:
   *         description: Bad request - Missing or invalid data
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: string
   *                 message:
   *                   type: string
   *       404:
   *         description: No flows found for the given event mode
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: string
   *                 message:
   *                   type: string
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: string
   *                 message:
   *                   type: string
   */
  router.post('/', async (req: Request, res: Response) => {
    try {
      const { inputData, event, arrayType = false } = req.body;

      // Validate request body
      if (!req.body || Object.keys(req.body).length === 0) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Request body cannot be empty'
        });
        return;
      }

      // Validate required fields
      if (!event) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'event is required'
        });
        return;
      }

      if (!inputData || typeof inputData !== 'object') {
        res.status(400).json({
          error: 'Bad Request',
          message: 'inputData is required and must be an object'
        });
        return;
      }

      // Find all flows matching the event mode
      const flows = await database.getFlowsByEventMode(event);

      if (flows.length === 0) {
        res.status(404).json({
          error: 'Not Found',
          message: `No flows found with event mode '${event}'`
        });
        return;
      }

      // Generate event metadata
      const timestamp = new Date().toISOString();
      const eventId = `flow-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      // Publish event for each matching flow
      const startedFlows = [];

      for (const flow of flows) {
        // Prepare event payload
        const eventPayload = {
          flowId: flow.id,
          flowName: flow.name,
          inputData,
          arrayType,
          initialNodeId : JSON.parse(flow.flow).nodes.find((ele: { name: string; }) => ele.name == 'Start').id,
          event,
          timestamp,
          eventId: `${eventId}-${flow.id}`
        };

        // Publish to event store
        await eventStore.publish('flow.start', eventPayload);


        startedFlows.push({
          flowId: flow.id,
          flowName: flow.name
        });
      }
      

      res.status(202).json({
        message: `Flow start event${flows.length > 1 ? 's' : ''} published successfully`,
        topic: 'flow.start',
        eventId,
        timestamp,
        flowsStarted: flows.length,
        flows: startedFlows,
        inputData,
        arrayType
      });
    } catch (error) {
      console.error('Error publishing to flow.start:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to publish flow start event'
      });
    }
  });

  return router;
}
