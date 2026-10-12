import { IDatabase } from '../database/IDatabase';
import * as fs from 'fs';
import * as path from 'path';

export class DataLoader {
  private database: IDatabase;

  constructor(database: IDatabase) {
    this.database = database;
  }

  async loadInitialData(): Promise<void> {
    try {
      await this.loadTasks();
      console.log('Initial data loaded successfully');
    } catch (error) {
      console.error('Error loading initial data:', error);
      throw error;
    }
  }

  private async loadTasks(): Promise<void> {
    try {
      const existingTasks = await this.database.getAllTasks();

      if (existingTasks.length > 0) {
        console.log(`Tasks already exist (${existingTasks.length} tasks found). Skipping initial task load.`);
        return;
      }

      const tasksFilePath = path.join(__dirname, '../InitialData/tasks.json');

      if (!fs.existsSync(tasksFilePath)) {
        console.warn('tasks.json not found. Skipping task initialization.');
        return;
      }

      const tasksData = JSON.parse(fs.readFileSync(tasksFilePath, 'utf-8'));

      for (const task of tasksData) {
        await this.database.createTask({
          name: task.name,
          category: task.category,
          image: task.image || '',
          namespace: task.namespace || '',
          inputSchema: task.inputSchema || '',
          outputSchema: task.outputSchema || '',
          propertyScehema: task.propertyScehema || ''
        });
      }

      console.log(`Loaded ${tasksData.length} initial tasks`);
    } catch (error) {
      console.error('Error loading tasks:', error);
      throw error;
    }
  }
}
