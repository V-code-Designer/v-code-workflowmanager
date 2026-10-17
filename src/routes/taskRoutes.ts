import { Router, Request, Response } from 'express';
import { IDatabase } from '../database/IDatabase';
import { Task } from '../model/task';

export function createTaskRouter(database: IDatabase): Router {
  const router = Router();

  /**
   * @swagger
   * components:
   *   schemas:
   *     Task:
   *       type: object
   *       required:
   *         - name
   *         - category
   *       properties:
   *         id:
   *           type: string
   *           format: uuid
   *           description: Auto-generated task ID
   *         name:
   *           type: string
   *           description: Name of the task
   *         category:
   *           type: string
   *           description: Category of the task
   *         image:
   *           type: string
   *           description: Image URL or path for the task
   *         namespace:
   *           type: string
   *           description: Namespace for the task
   *         inputSchema:
   *           type: string
   *           description: Input schema (JSON string)
   *         outputSchema:
   *           type: string
   *           description: Output schema (JSON string)
   *         propertyScehema:
   *           type: string
   *           description: Property schema (JSON string)
   *       example:
   *         id: "550e8400-e29b-41d4-a716-446655440000"
   *         name: "Sample Task"
   *         category: "Processing"
   *         image: "task-icon.png"
   *         namespace: "com.example"
   *         inputSchema: "{\"type\": \"object\"}"
   *         outputSchema: "{\"type\": \"object\"}"
   *         propertyScehema: "{\"type\": \"object\"}"
   *     TaskInput:
   *       type: object
   *       required:
   *         - name
   *         - category
   *       properties:
   *         name:
   *           type: string
   *         category:
   *           type: string
   *         image:
   *           type: string
   *         namespace:
   *           type: string
   *         inputSchema:
   *           type: string
   *         outputSchema:
   *           type: string
   *         propertyScehema:
   *           type: string
   *     Error:
   *       type: object
   *       properties:
   *         error:
   *           type: string
   */

  /**
   * @swagger
   * /api/tasks:
   *   post:
   *     summary: Create a new task
   *     tags: [Tasks]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/TaskInput'
   *     responses:
   *       201:
   *         description: Task created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Task'
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
      const { name, category, image, namespace, inputSchema, outputSchema, propertyScehema } = req.body;

      if (!name || !category) {
        res.status(400).json({ error: 'Name and category are required' });
        return;
      }
      const existingTask = await database.getTaskByCategoryNamespace(category, namespace);
      if (existingTask) {
        res.status(400).json({ error: 'Task with the same category and namespace already exists' });
        return;
      }
      const newTask = await database.createTask({ name, category, image, namespace, inputSchema, outputSchema, propertyScehema });
      res.status(201).json(newTask);
    } catch (error) {
      console.error('Error creating task:', error);
      res.status(500).json({ error: 'Failed to create task' });
    }
  });

  /**
   * @swagger
   * /api/tasks:
   *   get:
   *     summary: Get all tasks
   *     tags: [Tasks]
   *     responses:
   *       200:
   *         description: List of all tasks
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Task'
   *       500:
   *         description: Server error
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const tasks = await database.getAllTasks();
      res.json(tasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  });

  /**
   * @swagger
   * /api/tasks/{id}:
   *   get:
   *     summary: Get a task by ID
   *     tags: [Tasks]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Task ID
   *     responses:
   *       200:
   *         description: Task found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Task'
   *       404:
   *         description: Task not found
   *       500:
   *         description: Server error
   */
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const task = await database.getTaskById(id);

      if (!task) {
        res.status(404).json({ error: 'Task not found' });
        return;
      }

      res.json(task);
    } catch (error) {
      console.error('Error fetching task:', error);
      res.status(500).json({ error: 'Failed to fetch task' });
    }
  });

  /**
   * @swagger
   * /api/tasks/{id}:
   *   put:
   *     summary: Update a task
   *     tags: [Tasks]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Task ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *               category:
   *                 type: string
   *               image:
   *                 type: string
   *               namespace:
   *                 type: string
   *               inputSchema:
   *                 type: string
   *               outputSchema:
   *                 type: string
   *               propertyScehema:
   *                 type: string
   *     responses:
   *       200:
   *         description: Task updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Task'
   *       404:
   *         description: Task not found
   *       500:
   *         description: Server error
   */
  router.put('/:id', async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const updates = req.body;

      const updatedTask = await database.updateTask(id, updates);

      if (!updatedTask) {
        res.status(404).json({ error: 'Task not found' });
        return;
      }

      res.json(updatedTask);
    } catch (error) {
      console.error('Error updating task:', error);
      res.status(500).json({ error: 'Failed to update task' });
    }
  });

  /**
   * @swagger
   * /api/tasks/{id}:
   *   delete:
   *     summary: Delete a task
   *     tags: [Tasks]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Task ID
   *     responses:
   *       200:
   *         description: Task deleted successfully
   *       404:
   *         description: Task not found
   *       500:
   *         description: Server error
   */
  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const deleted = await database.deleteTask(id);

      if (!deleted) {
        res.status(404).json({ error: 'Task not found' });
        return;
      }

      res.json({ message: 'Task deleted successfully' });
    } catch (error) {
      console.error('Error deleting task:', error);
      res.status(500).json({ error: 'Failed to delete task' });
    }
  });

  return router;
}
