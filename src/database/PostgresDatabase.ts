import { Pool } from 'pg';
import { IDatabase } from './IDatabase';
import { Flow } from '../model/flow';
import { Task } from '../model/task';
import { FlowInstance } from '../model/flowInstance';
import { TaskInstance } from '../model/taskInstance';

export class PostgresDatabase implements IDatabase {
  private pool: Pool;

  constructor(connectionString?: string) {
    this.pool = new Pool({
      connectionString: connectionString || process.env.DATABASE_URL,
    });
  }

  async connect(): Promise<void> {
    try {
      await this.pool.query('SELECT NOW()');
      console.log('Connected to PostgreSQL database');
      await this.initializeTable();
    } catch (error) {
      console.error('Failed to connect to PostgreSQL:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this.pool.end();
    console.log('Disconnected from PostgreSQL database');
  }

  private async initializeTable(): Promise<void> {
    const flowsQuery = `
      CREATE TABLE IF NOT EXISTS flows (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        flow TEXT NOT NULL,
        event JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await this.pool.query(flowsQuery);

    await this.pool.query(`
      CREATE INDEX IF NOT EXISTS idx_flows_event_mode
      ON flows ((event->>'mode'));
    `);

    const tasksQuery = `
      CREATE TABLE IF NOT EXISTS tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        category VARCHAR(255) NOT NULL,
        image VARCHAR(255),
        namespace VARCHAR(255),
        input_schema TEXT,
        output_schema TEXT,
        property_schema TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await this.pool.query(tasksQuery);

    const flowInstancesQuery = `
      CREATE TABLE IF NOT EXISTS flow_instances (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        flow_id UUID NOT NULL REFERENCES flows(id) ON DELETE CASCADE,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        input_data TEXT,
        output_data TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await this.pool.query(flowInstancesQuery);

    const taskInstancesQuery = `
      CREATE TABLE IF NOT EXISTS task_instances (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        flow_instance_id UUID NOT NULL REFERENCES flow_instances(id) ON DELETE CASCADE,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        input_data TEXT,
        output_data TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await this.pool.query(taskInstancesQuery);
  }

  async createFlow(flow: Omit<Flow, 'id'>): Promise<Flow> {
    const query = `
      INSERT INTO flows (name, description, flow, event)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, description, flow, event;
    `;
    const eventValue = typeof flow.event === 'string' ? flow.event : JSON.stringify(flow.event);
    const values = [flow.name, flow.description, flow.flow, eventValue];
    const result = await this.pool.query(query, values);
    const row = result.rows[0];
    return {
      ...row,
      event: typeof row.event === 'string' ? JSON.parse(row.event) : row.event
    };
  }

  async getFlowById(id: string): Promise<Flow | null> {
    const query = 'SELECT id, name, description, flow, event FROM flows WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      ...row,
      event: typeof row.event === 'string' ? JSON.parse(row.event) : row.event
    };
  }

  async getAllFlows(): Promise<Flow[]> {
    const query = 'SELECT id, name, description, flow, event FROM flows ORDER BY created_at DESC';
    const result = await this.pool.query(query);
    return result.rows.map(row => ({
      ...row,
      event: typeof row.event === 'string' ? JSON.parse(row.event) : row.event
    }));
  }

  async getFlowsByEventMode(mode: string): Promise<Flow[]> {
    let query: string;

    if (mode === '') {
      // If mode is empty string, find flows where event mode is empty, null, or not set
      query = `
        SELECT id, name, description, flow, event
        FROM flows
        WHERE event->>'mode' = '' OR event->>'mode' IS NULL OR event IS NULL
        ORDER BY created_at DESC
      `;
      const result = await this.pool.query(query);
      return result.rows.map(row => ({
        ...row,
        event: typeof row.event === 'string' ? JSON.parse(row.event) : row.event
      }));
    } else {
      // If mode is specified, filter by that mode
      query = `
        SELECT id, name, description, flow, event
        FROM flows
        WHERE event->>'mode' = $1
        ORDER BY created_at DESC
      `;
      const result = await this.pool.query(query, [mode]);
      return result.rows.map(row => ({
        ...row,
        event: typeof row.event === 'string' ? JSON.parse(row.event) : row.event
      }));
    }
  }

  async updateFlow(id: string, flow: Partial<Omit<Flow, 'id'>>): Promise<Flow | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (flow.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(flow.name);
    }
    if (flow.description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(flow.description);
    }
    if (flow.flow !== undefined) {
      fields.push(`flow = $${paramCount++}`);
      values.push(flow.flow);
    }
    if (flow.event !== undefined) {
      const eventValue = typeof flow.event === 'string' ? flow.event : JSON.stringify(flow.event);
      fields.push(`event = $${paramCount++}`);
      values.push(eventValue);
    }

    if (fields.length === 0) {
      return this.getFlowById(id);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE flows
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, name, description, flow, event;
    `;

    const result = await this.pool.query(query, values);
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      ...row,
      event: typeof row.event === 'string' ? JSON.parse(row.event) : row.event
    };
  }

  async deleteFlow(id: string): Promise<boolean> {
    const query = 'DELETE FROM flows WHERE id = $1 RETURNING id';
    const result = await this.pool.query(query, [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  async createTask(task: Omit<Task, 'id'>): Promise<Task> {
    const query = `
      INSERT INTO tasks (name, category, image, namespace, input_schema, output_schema, property_schema)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, name, category, image, namespace,
                input_schema as "inputSchema",
                output_schema as "outputSchema",
                property_schema as "propertyScehema";
    `;
    const values = [
      task.name,
      task.category,
      task.image,
      task.namespace,
      task.inputSchema,
      task.outputSchema,
      task.propertyScehema
    ];
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async getTaskById(id: string): Promise<Task | null> {
    const query = `
      SELECT id, name, category, image, namespace,
             input_schema as "inputSchema",
             output_schema as "outputSchema",
             property_schema as "propertyScehema"
      FROM tasks
      WHERE id = $1
    `;
    const result = await this.pool.query(query, [id]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  async getAllTasks(): Promise<Task[]> {
    const query = `
      SELECT id, name, category, image, namespace,
             input_schema as "inputSchema",
             output_schema as "outputSchema",
             property_schema as "propertyScehema"
      FROM tasks
      ORDER BY created_at DESC
    `;
    const result = await this.pool.query(query);
    return result.rows;
  }

  async updateTask(id: string, task: Partial<Omit<Task, 'id'>>): Promise<Task | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (task.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(task.name);
    }
    if (task.category !== undefined) {
      fields.push(`category = $${paramCount++}`);
      values.push(task.category);
    }
    if (task.image !== undefined) {
      fields.push(`image = $${paramCount++}`);
      values.push(task.image);
    }
    if (task.namespace !== undefined) {
      fields.push(`namespace = $${paramCount++}`);
      values.push(task.namespace);
    }
    if (task.inputSchema !== undefined) {
      fields.push(`input_schema = $${paramCount++}`);
      values.push(task.inputSchema);
    }
    if (task.outputSchema !== undefined) {
      fields.push(`output_schema = $${paramCount++}`);
      values.push(task.outputSchema);
    }
    if (task.propertyScehema !== undefined) {
      fields.push(`property_schema = $${paramCount++}`);
      values.push(task.propertyScehema);
    }

    if (fields.length === 0) {
      return this.getTaskById(id);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE tasks
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, name, category, image, namespace,
                input_schema as "inputSchema",
                output_schema as "outputSchema",
                property_schema as "propertyScehema";
    `;

    const result = await this.pool.query(query, values);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  async deleteTask(id: string): Promise<boolean> {
    const query = 'DELETE FROM tasks WHERE id = $1 RETURNING id';
    const result = await this.pool.query(query, [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  async createFlowInstance(flowInstance: Omit<FlowInstance, 'id'>): Promise<FlowInstance> {
    const query = `
      INSERT INTO flow_instances (flow_id, status, input_data, output_data, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id,
                flow_id as "flowId",
                status,
                input_data as "inputData",
                output_data as "outputData",
                created_at as "createdAt",
                updated_at as "updatedAt";
    `;
    const values = [
      flowInstance.flowId,
      flowInstance.status,
      flowInstance.inputData,
      flowInstance.outputData,
      flowInstance.createdAt,
      flowInstance.updatedAt
    ];
    const result = await this.pool.query(query, values);
    const instance = result.rows[0];

    const taskInstances = await this.getTaskInstancesByFlowInstanceId(instance.id);
    return { ...instance, history: taskInstances };
  }

  async getFlowInstanceById(id: string): Promise<FlowInstance | null> {
    const query = `
      SELECT id,
             flow_id as "flowId",
             status,
             input_data as "inputData",
             output_data as "outputData",
             created_at as "createdAt",
             updated_at as "updatedAt"
      FROM flow_instances
      WHERE id = $1
    `;
    const result = await this.pool.query(query, [id]);
    if (result.rows.length === 0) return null;

    const instance = result.rows[0];
    const taskInstances = await this.getTaskInstancesByFlowInstanceId(id);
    return { ...instance, history: taskInstances };
  }

  async getAllFlowInstances(): Promise<FlowInstance[]> {
    const query = `
      SELECT id,
             flow_id as "flowId",
             status,
             input_data as "inputData",
             output_data as "outputData",
             created_at as "createdAt",
             updated_at as "updatedAt"
      FROM flow_instances
      ORDER BY created_at DESC
    `;
    const result = await this.pool.query(query);

    const instances = await Promise.all(
      result.rows.map(async (row) => {
        const taskInstances = await this.getTaskInstancesByFlowInstanceId(row.id);
        return { ...row, history: taskInstances };
      })
    );

    return instances;
  }

  async getFlowInstancesByFlowId(flowId: string): Promise<FlowInstance[]> {
    const query = `
      SELECT id,
             flow_id as "flowId",
             status,
             input_data as "inputData",
             output_data as "outputData",
             created_at as "createdAt",
             updated_at as "updatedAt"
      FROM flow_instances
      WHERE flow_id = $1
      ORDER BY created_at DESC
    `;
    const result = await this.pool.query(query, [flowId]);

    const instances = await Promise.all(
      result.rows.map(async (row) => {
        const taskInstances = await this.getTaskInstancesByFlowInstanceId(row.id);
        return { ...row, history: taskInstances };
      })
    );

    return instances;
  }

  async updateFlowInstance(id: string, flowInstance: Partial<Omit<FlowInstance, 'id' | 'history'>>): Promise<FlowInstance | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (flowInstance.status !== undefined) {
      fields.push(`status = $${paramCount++}`);
      values.push(flowInstance.status);
    }
    if (flowInstance.inputData !== undefined) {
      fields.push(`input_data = $${paramCount++}`);
      values.push(flowInstance.inputData);
    }
    if (flowInstance.outputData !== undefined) {
      fields.push(`output_data = $${paramCount++}`);
      values.push(flowInstance.outputData);
    }

    if (fields.length === 0) {
      return this.getFlowInstanceById(id);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE flow_instances
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id,
                flow_id as "flowId",
                status,
                input_data as "inputData",
                output_data as "outputData",
                created_at as "createdAt",
                updated_at as "updatedAt";
    `;

    const result = await this.pool.query(query, values);
    if (result.rows.length === 0) return null;

    const instance = result.rows[0];
    const taskInstances = await this.getTaskInstancesByFlowInstanceId(id);
    return { ...instance, history: taskInstances };
  }

  async deleteFlowInstance(id: string): Promise<boolean> {
    const query = 'DELETE FROM flow_instances WHERE id = $1 RETURNING id';
    const result = await this.pool.query(query, [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  async createTaskInstance(taskInstance: Omit<TaskInstance, 'id'>): Promise<TaskInstance> {
    const query = `
      INSERT INTO task_instances (task_id, flow_instance_id, status, input_data, output_data, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id,
                task_id as "taskId",
                flow_instance_id as "flowInstanceId",
                status,
                input_data as "inputData",
                output_data as "outputData",
                created_at as "createdAt",
                updated_at as "updatedAt";
    `;
    const values = [
      taskInstance.taskId,
      taskInstance.flowInstanceId,
      taskInstance.status,
      taskInstance.inputData,
      taskInstance.outputData,
      taskInstance.createdAt,
      taskInstance.updatedAt
    ];
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async getTaskInstanceById(id: string): Promise<TaskInstance | null> {
    const query = `
      SELECT id,
             task_id as "taskId",
             flow_instance_id as "flowInstanceId",
             status,
             input_data as "inputData",
             output_data as "outputData",
             created_at as "createdAt",
             updated_at as "updatedAt"
      FROM task_instances
      WHERE id = $1
    `;
    const result = await this.pool.query(query, [id]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  async getAllTaskInstances(): Promise<TaskInstance[]> {
    const query = `
      SELECT id,
             task_id as "taskId",
             flow_instance_id as "flowInstanceId",
             status,
             input_data as "inputData",
             output_data as "outputData",
             created_at as "createdAt",
             updated_at as "updatedAt"
      FROM task_instances
      ORDER BY created_at DESC
    `;
    const result = await this.pool.query(query);
    return result.rows;
  }

  async getTaskInstancesByFlowInstanceId(flowInstanceId: string): Promise<TaskInstance[]> {
    const query = `
      SELECT id,
             task_id as "taskId",
             flow_instance_id as "flowInstanceId",
             status,
             input_data as "inputData",
             output_data as "outputData",
             created_at as "createdAt",
             updated_at as "updatedAt"
      FROM task_instances
      WHERE flow_instance_id = $1
      ORDER BY created_at ASC
    `;
    const result = await this.pool.query(query, [flowInstanceId]);
    return result.rows;
  }

  async updateTaskInstance(id: string, taskInstance: Partial<Omit<TaskInstance, 'id'>>): Promise<TaskInstance | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (taskInstance.status !== undefined) {
      fields.push(`status = $${paramCount++}`);
      values.push(taskInstance.status);
    }
    if (taskInstance.inputData !== undefined) {
      fields.push(`input_data = $${paramCount++}`);
      values.push(taskInstance.inputData);
    }
    if (taskInstance.outputData !== undefined) {
      fields.push(`output_data = $${paramCount++}`);
      values.push(taskInstance.outputData);
    }

    if (fields.length === 0) {
      return this.getTaskInstanceById(id);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE task_instances
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id,
                task_id as "taskId",
                flow_instance_id as "flowInstanceId",
                status,
                input_data as "inputData",
                output_data as "outputData",
                created_at as "createdAt",
                updated_at as "updatedAt";
    `;

    const result = await this.pool.query(query, values);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  async deleteTaskInstance(id: string): Promise<boolean> {
    const query = 'DELETE FROM task_instances WHERE id = $1 RETURNING id';
    const result = await this.pool.query(query, [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }
}
