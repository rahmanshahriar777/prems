import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { AuditService } from '../../../core/audit/audit.service';
import { AuditAction } from '@ems/shared';

export interface RecordAiAuditLogParams {
  requestId: string;
  userId?: string;
  actorEmail?: string;
  provider: string;
  model: string;
  prompt: string;
  response?: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  latencyMs: number;
  succeeded: boolean;
  error?: string;
  metadata?: any;
}

@Injectable()
export class AiAuditService {
  private readonly logger = new Logger(AiAuditService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly coreAudit: AuditService,
  ) {}

  async recordLog(params: RecordAiAuditLogParams): Promise<void> {
    // 1. Persist to dedicated PostgreSQL ai_request_logs table
    try {
      await this.prisma.aIRequestLog.create({
        data: {
          requestId: params.requestId,
          userId: params.userId,
          provider: params.provider,
          model: params.model,
          prompt: params.prompt,
          response: params.response,
          promptTokens: params.promptTokens,
          completionTokens: params.completionTokens,
          totalTokens: params.totalTokens,
          latencyMs: params.latencyMs,
          succeeded: params.succeeded,
          error: params.error,
          metadata: params.metadata,
        },
      });
    } catch (err: any) {
      this.logger.warn(`Failed to persist token-level AIRequestLog: ${err.message}`);
    }

    // 2. Dispatch to enterprise compliance AuditService
    try {
      await this.coreAudit.log({
        actorId: params.userId,
        actorEmail: params.actorEmail,
        action: AuditAction.CREATE,
        entityType: 'AI_INFERENCE',
        entityId: params.requestId,
        afterState: {
          provider: params.provider,
          model: params.model,
          promptTokens: params.promptTokens,
          completionTokens: params.completionTokens,
          totalTokens: params.totalTokens,
          latencyMs: params.latencyMs,
          succeeded: params.succeeded,
          failoverUsed: params.metadata?.failoverUsed ?? false,
        },
      });
    } catch (err: any) {
      this.logger.warn(`Failed to dispatch core audit log: ${err.message}`);
    }
  }

  async getRecentLogs(limit = 20) {
    return this.prisma.aIRequestLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
