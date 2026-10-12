import { Router, Request, Response } from 'express';
import { IDatabase } from '../database/IDatabase';
import { TaskInstance } from '../model/taskInstance';

export function createTaskInstanceRouter(database: IDatabase): Router {
  const router = Router();

  /**
   * @swagger
   * components:
   *   schemas:
   *     TaskInstance:
   *       type: object
   *       required:
   *         - taskId
   *         - flowInstanceId
   *       properties:
   *         id:
   *           type: string
   *           format: uuid
   *           description: Auto-generated task instance ID
   *         taskId:
   *           type: string
   *           format: uuid
   *           description: Reference to the task definition
   *         status:
   *           type: string
   *           enum: [pending, in_progress, completed, failed]
   *           description: Current status of the task instance
   *         flowInstanceId:
   *           type: string
   *           format: uuid
   *           description: Reference to the parent flow instance
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
   *       example:
   *         id: "550e8400-e29b-41d4-a716-446655440000"
   *         taskId: "660e8400-e29b-41d4-a716-446655440001"
   *         status: "in_progress"
   *         flowInstanceId: "770e8400-e29b-41d4-a716-446655440002"
   *         inputData: "{\"param\": \"value\"}"
   *         outputData: "{\"result\": \"success\"}"
   *     TaskInstanceInput:
   *       type: object
   *       required:
   *         - taskId
   *         - flowInstanceId
   *       properties:
   *         taskId:
   *           type: string
   *           format: uuid
   *         flowInstanceId:
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
   * /api/task-instances:
   *   post:
   *     summary: Create a new task instance
   *     tags: [TaskInstances]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/TaskInstanceInput'
   *     responses:
   *       201:
   *         description: Task instance created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/TaskInstance'
   *       400:
   *         description: Bad request
   *       500:
   *         description: Server error
   */
  router.post('/', async (req: Request, res: Response) => {
    try {
      const { taskId, flowInstanceId, status, inputData, outputData } = req.body;

      if (!taskId || !flowInstanceId) {
        res.status(400).json({ error: 'taskId and flowInstanceId are required' });
        return;
      }

      const newTaskInstance = await database.createTaskInstance({
        taskId,
        flowInstanceId,
        status: status || 'pending',
        inputData,
        outputData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      res.status(201).json(newTaskInstance);
    } catch (error) {
      console.error('Error creating task instance:', error);
      res.status(500).json({ error: 'Failed to create task instance' });
    }
  });

  /**
   * @swagger
   * /api/task-instances:
   *   get:
   *     summary: Get all task instances
   *     tags: [TaskInstances]
   *     parameters:
   *       - in: query
   *         name: flowInstanceId
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Filter by flow instance ID
   *     responses:
   *       200:
   *         description: List of all task instances
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/TaskInstance'
   *       500:
   *         description: Server error
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const flowInstanceId = req.query.flowInstanceId as string | undefined;

      if (flowInstanceId) {
        const taskInstances = await database.getTaskInstancesByFlowInstanceId(flowInstanceId);
        res.json(taskInstances);
      } else {
        const taskInstances = await database.getAllTaskInstances();
        res.json(taskInstances);
      }
    } catch (error) {
      console.error('Error fetching task instances:', error);
      res.status(500).json({ error: 'Failed to fetch task instances' });
    }
  });

  /**
   * @swagger
   * /api/task-instances/{id}:
   *   get:
   *     summary: Get a task instance by ID
   *     tags: [TaskInstances]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Task instance ID
   *     responses:
   *       200:
   *         description: Task instance found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/TaskInstance'
   *       404:
   *         description: Task instance not found
   *       500:
   *         description: Server error
   */
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const taskInstance = await database.getTaskInstanceById(id);

      if (!taskInstance) {
        res.status(404).json({ error: 'Task instance not found' });
        return;
      }

      res.json(taskInstance);
    } catch (error) {
      console.error('Error fetching task instance:', error);
      res.status(500).json({ error: 'Failed to fetch task instance' });
    }
  });

  /**
   * @swagger
   * /api/task-instances/{id}:
   *   put:
   *     summary: Update a task instance
   *     tags: [TaskInstances]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Task instance ID
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
   *         description: Task instance updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/TaskInstance'
   *       404:
   *         description: Task instance not found
   *       500:
   *         description: Server error
   */
  router.put('/:id', async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const updates = req.body;

      const updatedTaskInstance = await database.updateTaskInstance(id, updates);

      if (!updatedTaskInstance) {
        res.status(404).json({ error: 'Task instance not found' });
        return;
      }

      res.json(updatedTaskInstance);
    } catch (error) {
      console.error('Error updating task instance:', error);
      res.status(500).json({ error: 'Failed to update task instance' });
    }
  });

  /**
   * @swagger
   * /api/task-instances/{id}:
   *   delete:
   *     summary: Delete a task instance
   *     tags: [TaskInstances]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Task instance ID
   *     responses:
   *       200:
   *         description: Task instance deleted successfully
   *       404:
   *         description: Task instance not found
   *       500:
   *         description: Server error
   */
  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const deleted = await database.deleteTaskInstance(id);

      if (!deleted) {
        res.status(404).json({ error: 'Task instance not found' });
        return;
      }

      res.json({ message: 'Task instance deleted successfully' });
    } catch (error) {
      console.error('Error deleting task instance:', error);
      res.status(500).json({ error: 'Failed to delete task instance' });
    }
  });

  return router;
}
