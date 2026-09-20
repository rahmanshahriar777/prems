import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AuditService } from '../../core/audit/audit.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';
import { AuditAction } from '@ems/shared';

@Injectable()
export class DepartmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll() {
    return this.prisma.department.findMany({
      where: { deletedAt: null },
      include: {
        parent: true,
        children: true,
        _count: { select: { employees: true, designations: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const dept = await this.prisma.department.findFirst({
      where: { id, deletedAt: null },
      include: {
        parent: true,
        children: true,
        employees: {
          select: { id: true, firstName: true, lastName: true, employeeNumber: true, email: true },
        },
        designations: true,
      },
    });

    if (!dept) {
      throw new NotFoundException(`Department #${id} not found`);
    }

    return dept;
  }

  async create(dto: CreateDepartmentDto, actorId?: string, actorEmail?: string) {
    const existing = await this.prisma.department.findUnique({
      where: { code: dto.code.toUpperCase() },
    });
    if (existing) {
      throw new ConflictException(`Department code '${dto.code}' is already taken`);
    }

    const dept = await this.prisma.department.create({
      data: {
        name: dto.name,
        code: dto.code.toUpperCase(),
        description: dto.description,
        parentId: dto.parentId,
        headEmployeeId: dto.headEmployeeId,
      },
    });

    await this.audit.log({
      actorId,
      actorEmail,
      action: AuditAction.CREATE,
      entityType: 'DEPARTMENT',
      entityId: dept.id,
      afterState: dept,
    });

    return dept;
  }

  async update(id: string, dto: Partial<UpdateDepartmentDto>, actorId?: string, actorEmail?: string) {
    const existing = await this.findOne(id);

    const updated = await this.prisma.department.update({
      where: { id },
      data: {
        name: dto.name,
        code: dto.code ? dto.code.toUpperCase() : undefined,
        description: dto.description,
        parentId: dto.parentId,
        headEmployeeId: dto.headEmployeeId,
      },
    });

    await this.audit.log({
      actorId,
      actorEmail,
      action: AuditAction.UPDATE,
      entityType: 'DEPARTMENT',
      entityId: id,
      beforeState: existing,
      afterState: updated,
    });

    return updated;
  }

  async remove(id: string, actorId?: string, actorEmail?: string) {
    const existing = await this.findOne(id);

    await this.prisma.department.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.audit.log({
      actorId,
      actorEmail,
      action: AuditAction.DELETE,
      entityType: 'DEPARTMENT',
      entityId: id,
      beforeState: existing,
    });

    return { message: 'Department deleted successfully' };
  }

  async bulkImport(items: Array<{ code: string; name: string; description?: string }>, actorId?: string, actorEmail?: string) {
    const results = [];
    for (const item of items) {
      if (!item.code || !item.name) continue;
      const code = item.code.trim().toUpperCase();
      const existing = await this.prisma.department.findUnique({ where: { code } });
      if (existing) {
        const updated = await this.prisma.department.update({
          where: { id: existing.id },
          data: {
            name: item.name.trim(),
            description: item.description || existing.description,
            deletedAt: null,
          },
        });
        results.push(updated);
      } else {
        const created = await this.prisma.department.create({
          data: {
            code,
            name: item.name.trim(),
            description: item.description,
          },
        });
        results.push(created);
      }
    }

    await this.audit.log({
      actorId,
      actorEmail,
      action: AuditAction.CREATE,
      entityType: 'DEPARTMENT_BULK_IMPORT',
      entityId: 'BULK',
      afterState: { importedCount: results.length },
    });

    return { success: true, count: results.length, departments: results };
  }
}
