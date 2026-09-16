import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction } from '@ems/shared';

export interface RecordAuditParams {
  actorId?: string;
  actorEmail?: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  beforeState?: any;
  afterState?: any;
  ipAddress?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(params: RecordAuditParams) {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: params.actorId,
          actorEmail: params.actorEmail,
          action: params.action as any,
          entityType: params.entityType,
          entityId: params.entityId,
          beforeState: params.beforeState ?? undefined,
          afterState: params.afterState ?? undefined,
          ipAddress: params.ipAddress,
        },
      });
    } catch (e) {
      this.logger.warn(`Failed to record audit log for ${params.entityType}:${params.entityId} - ${e.message}`);
    }
  }

  async getLogs(entityType?: string, entityId?: string, limit: number = 50) {
    return this.prisma.auditLog.findMany({
      where: {
        ...(entityType && { entityType }),
        ...(entityId && { entityId }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        actor: {
          select: { id: true, email: true },
        },
      },
    });
  }
}
