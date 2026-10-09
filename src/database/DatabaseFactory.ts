import { IDatabase } from './IDatabase';
import { PostgresDatabase } from './PostgresDatabase';

export type DatabaseType = 'postgres' | 'mongodb' | 'mysql';

export class DatabaseFactory {
  static createDatabase(type: DatabaseType = 'postgres'): IDatabase {
    switch (type) {
      case 'postgres':
        return new PostgresDatabase();
      case 'mongodb':
        throw new Error('MongoDB implementation not yet available. Implement MongoDatabase class.');
      case 'mysql':
        throw new Error('MySQL implementation not yet available. Implement MySQLDatabase class.');
      default:
        throw new Error(`Unsupported database type: ${type}`);
    }
  }
}
