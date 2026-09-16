import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AuditService } from '../../core/audit/audit.service';
import { CreateDesignationDto, UpdateDesignationDto } from './dto/designation.dto';
import { AuditAction } from '@ems/shared';

@Injectable()
export class DesignationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(departmentId?: string) {
    return this.prisma.designation.findMany({
      where: {
        deletedAt: null,
        ...(departmentId && { departmentId }),
      },
      include: {
        department: true,
        _count: { select: { employees: true } },
      },
      orderBy: { level: 'desc' },
    });
  }

  async findOne(id: string) {
    const desig = await this.prisma.designation.findFirst({
      where: { id, deletedAt: null },
      include: { department: true, employees: true },
    });
    if (!desig) {
      throw new NotFoundException(`Designation #${id} not found`);
    }
    return desig;
  }

  async create(dto: CreateDesignationDto, actorId?: string, actorEmail?: string) {
    const existing = await this.prisma.designation.findUnique({
      where: { code: dto.code.toUpperCase() },
    });
    if (existing) {
      throw new ConflictException(`Designation code '${dto.code}' already exists`);
    }

    const created = await this.prisma.designation.create({
      data: {
        title: dto.title,
        code: dto.code.toUpperCase(),
        description: dto.description,
        level: dto.level ?? 1,
        departmentId: dto.departmentId,
      },
    });

    await this.audit.log({
      actorId,
      actorEmail,
      action: AuditAction.CREATE,
      entityType: 'DESIGNATION',
      entityId: created.id,
      afterState: created,
    });

    return created;
  }

  async update(id: string, dto: Partial<UpdateDesignationDto>, actorId?: string, actorEmail?: string) {
    const existing = await this.findOne(id);
    const updated = await this.prisma.designation.update({
      where: { id },
      data: {
        title: dto.title,
        code: dto.code ? dto.code.toUpperCase() : undefined,
        description: dto.description,
        level: dto.level,
        departmentId: dto.departmentId,
      },
    });

    await this.audit.log({
      actorId,
      actorEmail,
      action: AuditAction.UPDATE,
      entityType: 'DESIGNATION',
      entityId: id,
      beforeState: existing,
      afterState: updated,
    });

    return updated;
  }

  async remove(id: string, actorId?: string, actorEmail?: string) {
    const existing = await this.findOne(id);
    await this.prisma.designation.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.audit.log({
      actorId,
      actorEmail,
      action: AuditAction.DELETE,
      entityType: 'DESIGNATION',
      entityId: id,
      beforeState: existing,
    });

    return { message: 'Designation deleted successfully' };
  }
}
