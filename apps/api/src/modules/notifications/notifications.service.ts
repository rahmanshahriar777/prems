import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
  }

  async markAsRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, recipientId: userId },
      data: { isRead: true },
    });
  }

  async createNotification(recipientId: string, title: string, message: string, linkUrl?: string) {
    return this.prisma.notification.create({
      data: {
        recipientId,
        title,
        message,
        linkUrl,
      },
    });
  }
}
