import { Worker } from 'bullmq';
import Redis from 'ioredis';
import * as dotenv from 'dotenv';
import { QUEUE_NAMES } from './queues/queue.constants.js';
import { processPayroll } from './processors/payroll.processor.js';
import { processNotification } from './processors/notification.processor.js';
import { processAIJob } from './processors/ai.processor.js';

dotenv.config();

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
const redisPassword = process.env.REDIS_PASSWORD || undefined;

console.log(`[Worker] Connecting to Redis on ${redisHost}:${redisPort}...`);

const connection = new Redis({
  host: redisHost,
  port: redisPort,
  password: redisPassword,
  maxRetriesPerRequest: null,
  lazyConnect: true,
  enableOfflineQueue: false,
});

async function bootstrap() {
  try {
    await connection.connect();
    console.log('✅ [Worker] Redis connection established');
  } catch (err: any) {
    console.warn(`⚠️ [Worker] Redis not immediately reachable: ${err.message}. Worker will retry automatically.`);
  }

  // 1. Payroll Processing Worker
  const payrollWorker = new Worker(
    QUEUE_NAMES.PAYROLL,
    processPayroll,
    { connection, concurrency: 1 },
  );

  // 2. Notification Worker
  const notificationWorker = new Worker(
    QUEUE_NAMES.NOTIFICATIONS,
    processNotification,
    { connection, concurrency: 5 },
  );

  // 3. AI Async Processing Worker
  const aiWorker = new Worker(
    QUEUE_NAMES.AI_PROCESSING,
    processAIJob,
    { connection, concurrency: 3 },
  );

  const workers = [payrollWorker, notificationWorker, aiWorker];

  for (const w of workers) {
    w.on('completed', (job) => {
      console.log(`[Worker:${w.name}] Job ${job.id} completed successfully`);
    });
    w.on('failed', (job, err) => {
      console.error(`[Worker:${w.name}] Job ${job?.id} failed with error: ${err.message}`);
    });
  }

  console.log('🚀 [Worker] All BullMQ workers initialized and listening for jobs:');
  console.log(` - ${QUEUE_NAMES.PAYROLL}`);
  console.log(` - ${QUEUE_NAMES.NOTIFICATIONS}`);
  console.log(` - ${QUEUE_NAMES.AI_PROCESSING}`);

  // Graceful Shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n[Worker] Received ${signal}. Shutting down workers gracefully...`);
    await Promise.all(workers.map((w) => w.close()));
    await connection.quit();
    console.log('[Worker] All workers and connections closed. Exit.');
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((e) => {
  console.error('[Worker] Fatal error during bootstrap:', e);
});
