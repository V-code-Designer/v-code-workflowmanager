import { Router, Request, Response } from 'express';
import { IDatabase } from '../database/IDatabase';
import { Flow } from '../model/flow';

export function createFlowRouter(database: IDatabase): Router {
  const router = Router();

  /**
   * @swagger
   * components:
   *   schemas:
   *     EventMetadata:
   *       type: object
   *       properties:
   *         mode:
   *           type: string
   *           description: Event mode (e.g., webhook, scheduled, manual)
   *         command:
   *           type: string
   *           description: Optional command to execute
   *         option:
   *           type: string
   *           description: Optional additional options
   *       example:
   *         mode: "webhook"
   *         command: "/api/trigger"
   *         option: "async"
   *     Flow:
   *       type: object
   *       required:
   *         - name
   *         - flow
   *       properties:
   *         id:
   *           type: string
   *           format: uuid
   *           description: Auto-generated flow ID
   *         name:
   *           type: string
   *           description: Name of the flow
   *         description:
   *           type: string
   *           description: Description of the flow
   *         flow:
   *           type: string
   *           description: Flow definition (JSON string)
   *         event:
   *           oneOf:
   *             - type: string
   *             - $ref: '#/components/schemas/EventMetadata'
   *           description: Event trigger metadata for the flow
   *       example:
   *         id: "550e8400-e29b-41d4-a716-446655440000"
   *         name: "Sample Flow"
   *         description: "A sample workflow"
   *         flow: "{\"steps\": []}"
   *         event:
   *           mode: "webhook"
   *           command: ""
   *           option: ""
   *     FlowInput:
   *       type: object
   *       required:
   *         - name
   *         - flow
   *       properties:
   *         name:
   *           type: string
   *         description:
   *           type: string
   *         flow:
   *           type: string
   *         event:
   *           oneOf:
   *             - type: string
   *             - $ref: '#/components/schemas/EventMetadata'
   *     Error:
   *       type: object
   *       properties:
   *         error:
   *           type: string
   */

  /**
   * @swagger
   * /api/flows:
   *   post:
   *     summary: Create a new flow
   *     tags: [Flows]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/FlowInput'
   *     responses:
   *       201:
   *         description: Flow created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Flow'
   *       400:
   *         description: Bad request
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Server error
   */
  router.post('/', async (req: Request, res: Response) => {
    try {
      const { name, description, flow, event } = req.body;

      if (!name || !flow) {
        res.status(400).json({ error: 'Name and flow are required' });
        return;
      }

      const newFlow = await database.createFlow({ name, description, flow, event });
      res.status(201).json(newFlow);
    } catch (error) {
      console.error('Error creating flow:', error);
      res.status(500).json({ error: 'Failed to create flow' });
    }
  });

  /**
   * @swagger
   * /api/flows:
   *   get:
   *     summary: Get all flows or filter by event mode
   *     tags: [Flows]
   *     parameters:
   *       - in: query
   *         name: mode
   *         schema:
   *           type: string
   *         description: Filter flows by event.mode (e.g., webhook, scheduled, manual). Use empty string to find flows with no mode set.
   *     responses:
   *       200:
   *         description: List of flows
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Flow'
   *       500:
   *         description: Server error
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const mode = req.query.mode as string;

      if (mode !== undefined) {
        const flows = await database.getFlowsByEventMode(mode);
        res.json(flows);
      } else {
        const flows = await database.getAllFlows();
        res.json(flows);
      }
    } catch (error) {
      console.error('Error fetching flows:', error);
      res.status(500).json({ error: 'Failed to fetch flows' });
    }
  });

  /**
   * @swagger
   * /api/flows/{id}:
   *   get:
   *     summary: Get a flow by ID
   *     tags: [Flows]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Flow ID
   *     responses:
   *       200:
   *         description: Flow found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Flow'
   *       404:
   *         description: Flow not found
   *       500:
   *         description: Server error
   */
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const flow = await database.getFlowById(id);

      if (!flow) {
        res.status(404).json({ error: 'Flow not found' });
        return;
      }

      res.json(flow);
    } catch (error) {
      console.error('Error fetching flow:', error);
      res.status(500).json({ error: 'Failed to fetch flow' });
    }
  });

  /**
   * @swagger
   * /api/flows/{id}:
   *   put:
   *     summary: Update a flow
   *     tags: [Flows]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Flow ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *               description:
   *                 type: string
   *               flow:
   *                 type: string
   *               event:
   *                 type: string
   *     responses:
   *       200:
   *         description: Flow updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Flow'
   *       404:
   *         description: Flow not found
   *       500:
   *         description: Server error
   */
  router.put('/:id', async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const updates = req.body;

      const updatedFlow = await database.updateFlow(id, updates);

      if (!updatedFlow) {
        res.status(404).json({ error: 'Flow not found' });
        return;
      }

      res.json(updatedFlow);
    } catch (error) {
      console.error('Error updating flow:', error);
      res.status(500).json({ error: 'Failed to update flow' });
    }
  });

  /**
   * @swagger
   * /api/flows/{id}:
   *   delete:
   *     summary: Delete a flow
   *     tags: [Flows]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Flow ID
   *     responses:
   *       200:
   *         description: Flow deleted successfully
   *       404:
   *         description: Flow not found
   *       500:
   *         description: Server error
   */
  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const deleted = await database.deleteFlow(id);

      if (!deleted) {
        res.status(404).json({ error: 'Flow not found' });
        return;
      }

      res.json({ message: 'Flow deleted successfully' });
    } catch (error) {
      console.error('Error deleting flow:', error);
      res.status(500).json({ error: 'Failed to delete flow' });
    }
  });

  return router;
}
