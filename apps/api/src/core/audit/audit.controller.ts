import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { SystemRole } from '@ems/shared';

@ApiTags('Audit Logs & Compliance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(SystemRole.SUPER_ADMIN, SystemRole.HR_ADMIN, SystemRole.AUDITOR)
@Controller()
export class AuditController {
  constructor(private readonly service: AuditService) {}

  @Get('audit-logs')
  @ApiOperation({ summary: 'Get compliance audit logs' })
  async getLogs(
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('limit') limit?: string,
  ) {
    const rawLogs = await this.service.getLogs(
      entityType,
      entityId,
      limit ? parseInt(limit, 10) : 100,
    );
    return rawLogs.map((l) => ({
      id: l.id,
      actorEmail: l.actorEmail || l.actor?.email || 'system@ems.local',
      action: l.action,
      entityType: l.entityType,
      entityId: l.entityId,
      createdAt: l.createdAt,
      ipAddress: l.ipAddress || '127.0.0.1',
      hash: `sha256-${l.id.replace(/-/g, '').substring(0, 8)}...${l.id.slice(-4)}`,
      beforeState: l.beforeState,
      afterState: l.afterState,
    }));
  }

  @Get('ai/audit-logs')
  @ApiOperation({ summary: 'Get compliance audit logs (AI alias)' })
  async getAiLogs(
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.getLogs(entityType, entityId, limit);
  }
}
