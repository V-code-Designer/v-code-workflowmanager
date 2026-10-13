import { Router, Request, Response } from 'express';
import { IDatabase } from '../database/IDatabase';
import { FlowInstance } from '../model/flowInstance';

export function createFlowInstanceRouter(database: IDatabase): Router {
  const router = Router();

  /**
   * @swagger
   * components:
   *   schemas:
   *     FlowInstance:
   *       type: object
   *       required:
   *         - flowId
   *       properties:
   *         id:
   *           type: string
   *           format: uuid
   *           description: Auto-generated flow instance ID
   *         flowId:
   *           type: string
   *           format: uuid
   *           description: Reference to the flow definition
   *         status:
   *           type: string
   *           enum: [pending, in_progress, completed, failed]
   *           description: Current status of the flow instance
   *         createdAt:
   *           type: string
   *           format: date-time
   *           description: Creation timestamp
   *         updatedAt:
   *           type: string
   *           format: date-time
   *           description: Last update timestamp
   *         inputData:
   *           type: string
   *           description: Input data (JSON string)
   *         outputData:
   *           type: string
   *           description: Output data (JSON string)
   *         history:
   *           type: array
   *           items:
   *             $ref: '#/components/schemas/TaskInstance'
   *           description: Array of task instances in execution order
   *       example:
   *         id: "550e8400-e29b-41d4-a716-446655440000"
   *         flowId: "660e8400-e29b-41d4-a716-446655440001"
   *         status: "in_progress"
   *         inputData: "{\"param\": \"value\"}"
   *         outputData: "{\"result\": \"success\"}"
   *     FlowInstanceInput:
   *       type: object
   *       required:
   *         - flowId
   *       properties:
   *         flowId:
   *           type: string
   *           format: uuid
   *         status:
   *           type: string
   *           enum: [pending, in_progress, completed, failed]
   *         inputData:
   *           type: string
   *         outputData:
   *           type: string
   */

  /**
   * @swagger
   * /api/flow-instances:
   *   post:
   *     summary: Create a new flow instance
   *     tags: [FlowInstances]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/FlowInstanceInput'
   *     responses:
   *       201:
   *         description: Flow instance created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/FlowInstance'
   *       400:
   *         description: Bad request
   *       500:
   *         description: Server error
   */
  router.post('/', async (req: Request, res: Response) => {
    try {
      const { flowId, status, inputData, outputData } = req.body;

      if (!flowId) {
        res.status(400).json({ error: 'flowId is required' });
        return;
      }

      const newFlowInstance = await database.createFlowInstance({
        flowId,
        status: status || 'pending',
        inputData,
        outputData,
        createdAt: new Date(),
        updatedAt: new Date(),
        history: []
      });
      res.status(201).json(newFlowInstance);
    } catch (error) {
      console.error('Error creating flow instance:', error);
      res.status(500).json({ error: 'Failed to create flow instance' });
    }
  });

  /**
   * @swagger
   * /api/flow-instances:
   *   get:
   *     summary: Get all flow instances
   *     tags: [FlowInstances]
   *     parameters:
   *       - in: query
   *         name: flowId
   *         required: false
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Optional filter by flow ID
   *     responses:
   *       200:
   *         description: List of all flow instances
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/FlowInstance'
   *       500:
   *         description: Server error
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const flowId = req.query.flowId as string | undefined;

      if (flowId) {
        const flowInstances = await database.getFlowInstancesByFlowId(flowId);
        res.json(flowInstances);
      } else {
        const flowInstances = await database.getAllFlowInstances();
        res.json(flowInstances);
      }
    } catch (error) {
      console.error('Error fetching flow instances:', error);
      res.status(500).json({ error: 'Failed to fetch flow instances' });
    }
  });

  /**
   * @swagger
   * /api/flow-instances/{id}:
   *   get:
   *     summary: Get a flow instance by ID with history
   *     tags: [FlowInstances]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Flow instance ID
   *     responses:
   *       200:
   *         description: Flow instance found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/FlowInstance'
   *       404:
   *         description: Flow instance not found
   *       500:
   *         description: Server error
   */
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const flowInstance = await database.getFlowInstanceById(id);

      if (!flowInstance) {
        res.status(404).json({ error: 'Flow instance not found' });
        return;
      }

      res.json(flowInstance);
    } catch (error) {
      console.error('Error fetching flow instance:', error);
      res.status(500).json({ error: 'Failed to fetch flow instance' });
    }
  });

  /**
   * @swagger
   * /api/flow-instances/{id}:
   *   put:
   *     summary: Update a flow instance
   *     tags: [FlowInstances]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Flow instance ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               status:
   *                 type: string
   *                 enum: [pending, in_progress, completed, failed]
   *               inputData:
   *                 type: string
   *               outputData:
   *                 type: string
   *     responses:
   *       200:
   *         description: Flow instance updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/FlowInstance'
   *       404:
   *         description: Flow instance not found
   *       500:
   *         description: Server error
   */
  router.put('/:id', async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const updates = req.body;

      const updatedFlowInstance = await database.updateFlowInstance(id, updates);

      if (!updatedFlowInstance) {
        res.status(404).json({ error: 'Flow instance not found' });
        return;
      }

      res.json(updatedFlowInstance);
    } catch (error) {
      console.error('Error updating flow instance:', error);
      res.status(500).json({ error: 'Failed to update flow instance' });
    }
  });

  /**
   * @swagger
   * /api/flow-instances/{id}:
   *   delete:
   *     summary: Delete a flow instance
   *     tags: [FlowInstances]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Flow instance ID
   *     responses:
   *       200:
   *         description: Flow instance deleted successfully
   *       404:
   *         description: Flow instance not found
   *       500:
   *         description: Server error
   */
  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const deleted = await database.deleteFlowInstance(id);

      if (!deleted) {
        res.status(404).json({ error: 'Flow instance not found' });
        return;
      }

      res.json({ message: 'Flow instance deleted successfully' });
    } catch (error) {
      console.error('Error deleting flow instance:', error);
      res.status(500).json({ error: 'Failed to delete flow instance' });
    }
  });

  return router;
}
