import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import { DatabaseFactory, DatabaseType } from './database/DatabaseFactory';
import { IDatabase } from './database/IDatabase';
import { createFlowRouter } from './routes/flowRoutes';
import { createTaskRouter } from './routes/taskRoutes';
import { createFlowInstanceRouter } from './routes/flowInstanceRoutes';
import { createTaskInstanceRouter } from './routes/taskInstanceRoutes';
import { setupSwagger } from './swagger';
import { DataLoader } from './services/dataLoader';
import { KafkaService } from './services/kafkaService';
import cors from "cors";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;


const devUIHostFlag = process.env.devUIHostFlag;

if(devUIHostFlag) {
  app.use(cors({
  origin: "http://localhost:5173", // Frontend URL
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}));
}


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const dbType = (process.env.DATABASE_TYPE as DatabaseType) || 'postgres';
const database: IDatabase = DatabaseFactory.createDatabase(dbType);
const kafkaService = new KafkaService();

async function startServer() {
  try {
    await database.connect();

    const dataLoader = new DataLoader(database);
    await dataLoader.loadInitialData();

    // Initialize Kafka
    await kafkaService.connect();
    await kafkaService.createTopic('flow.start');

    // Subscribe to flow.start topic
    await kafkaService.subscribe('flow.start', async (message) => {
      console.log('Received flow.start message:', message);
      // Handle the message here - you can add your business logic
    });

    app.get('/', (_req: Request, res: Response) => {
      res.json({
        message: 'Flow Manager API',
        documentation: '/api-docs',
        endpoints: {
          flows: '/api/flows',
          tasks: '/api/tasks',
          flowInstances: '/api/flow-instances',
          taskInstances: '/api/task-instances',
          startFlow: '/api/startflow',
        },
      });
    });

    app.post('/api/startflow', async (req: Request, res: Response) => {
      try {
        const flowData = req.body;

        if (!flowData || Object.keys(flowData).length === 0) {
          res.status(400).json({
            error: 'Bad Request',
            message: 'Request body cannot be empty'
          });
          return;
        }

        await kafkaService.publish('flow.start', {
          ...flowData,
          timestamp: new Date().toISOString(),
          eventId: `flow-${Date.now()}-${Math.random().toString(36).substring(7)}`
        });

        res.status(202).json({
          message: 'Flow start event published successfully',
          topic: 'flow.start',
          data: flowData
        });
      } catch (error) {
        console.error('Error publishing to flow.start:', error);
        res.status(500).json({
          error: 'Internal Server Error',
          message: 'Failed to publish flow start event'
        });
      }
    });

    app.use('/api/flows', createFlowRouter(database));
    app.use('/api/tasks', createTaskRouter(database));
    app.use('/api/flow-instances', createFlowInstanceRouter(database));
    app.use('/api/task-instances', createTaskInstanceRouter(database));

    setupSwagger(app);

    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
      console.log(`API Documentation: http://localhost:${port}/api-docs`);
    });

    process.on('SIGINT', async () => {
      console.log('\nShutting down gracefully...');
      await kafkaService.disconnect();
      await database.disconnect();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\nShutting down gracefully...');
      await kafkaService.disconnect();
      await database.disconnect();
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
