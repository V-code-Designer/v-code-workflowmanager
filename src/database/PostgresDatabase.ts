import { Pool, PoolClient } from 'pg';
import { IDatabase } from './IDatabase';
import { Flow } from '../model/flow';

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
    const query = `
      CREATE TABLE IF NOT EXISTS flows (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        flow TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await this.pool.query(query);
  }

  async createFlow(flow: Omit<Flow, 'id'>): Promise<Flow> {
    const query = `
      INSERT INTO flows (name, description, flow)
      VALUES ($1, $2, $3)
      RETURNING id, name, description, flow;
    `;
    const values = [flow.name, flow.description, flow.flow];
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async getFlowById(id: string): Promise<Flow | null> {
    const query = 'SELECT id, name, description, flow FROM flows WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  async getAllFlows(): Promise<Flow[]> {
    const query = 'SELECT id, name, description, flow FROM flows ORDER BY created_at DESC';
    const result = await this.pool.query(query);
    return result.rows;
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

    if (fields.length === 0) {
      return this.getFlowById(id);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE flows
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, name, description, flow;
    `;

    const result = await this.pool.query(query, values);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  async deleteFlow(id: string): Promise<boolean> {
    const query = 'DELETE FROM flows WHERE id = $1 RETURNING id';
    const result = await this.pool.query(query, [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }
}
