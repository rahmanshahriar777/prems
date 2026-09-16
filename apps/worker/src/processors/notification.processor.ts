import { Job } from 'bullmq';
import { prisma } from '@ems/database';

export interface NotificationJobData {
  recipientId: string;
  title: string;
  message: string;
  linkUrl?: string;
}

export async function processNotification(job: Job<NotificationJobData>) {
  console.log(`[Worker:Notification] Dispatching notification to ${job.data.recipientId}`);

  await prisma.notification.create({
    data: {
      recipientId: job.data.recipientId,
      title: job.data.title,
      message: job.data.message,
      linkUrl: job.data.linkUrl,
    },
  });

  return { dispatched: true };
}
