import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AuditService } from '../../core/audit/audit.service';
import { CreateEmployeeDto, UpdateEmployeeDto, EmployeeQueryDto } from './dto/employee.dto';
import { AuditAction, createPaginatedResponse } from '@ems/shared';

@Injectable()
export class EmployeesService {
  private readonly logger = new Logger(EmployeesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(query: EmployeeQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      departmentId,
      designationId,
      managerId,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
      ...(departmentId && { departmentId }),
      ...(designationId && { designationId }),
      ...(managerId && { managerId }),
      ...(status && { status }),
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { employeeNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          department: { select: { id: true, name: true, code: true } },
          designation: { select: { id: true, title: true, code: true, level: true } },
          manager: { select: { id: true, firstName: true, lastName: true, employeeNumber: true } },
          user: { select: { id: true, isActive: true } },
        },
      }),
      this.prisma.employee.count({ where }),
    ]);

    return createPaginatedResponse(items, total, page, limit);
  }

  async findOne(id: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id, deletedAt: null },
      include: {
        department: true,
        designation: true,
        manager: {
          select: { id: true, firstName: true, lastName: true, email: true, employeeNumber: true },
        },
        subordinates: {
          where: { deletedAt: null },
          select: { id: true, firstName: true, lastName: true, employeeNumber: true, designation: true },
        },
        user: {
          select: {
            id: true,
            email: true,
            isActive: true,
            roles: { include: { role: true } },
          },
        },
        leaveBalances: {
          where: { year: new Date().getFullYear() },
          include: { leaveType: true },
        },
        salaryStructures: {
          where: { isActive: true },
          include: { salaryStructure: { include: { components: true } } },
        },
        documents: true,
        history: {
          orderBy: { changedAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!employee) {
      throw new NotFoundException(`Employee #${id} not found`);
    }

    return employee;
  }

  async create(dto: CreateEmployeeDto, actorId?: string, actorEmail?: string) {
    const existing = await this.prisma.employee.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException(`Employee with email ${dto.email} already exists`);
    }

    // Auto-generate employee number
    const count = await this.prisma.employee.count();
    const year = new Date().getFullYear();
    const employeeNumber = `EMP-${year}-${String(count + 1).padStart(4, '0')}`;

    const employee = await this.prisma.employee.create({
      data: {
        employeeNumber,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email.toLowerCase(),
        phone: dto.phone,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        gender: dto.gender as any,
        address: dto.address,
        departmentId: dto.departmentId,
        designationId: dto.designationId,
        managerId: dto.managerId,
        joiningDate: dto.joiningDate ? new Date(dto.joiningDate) : new Date(),
        status: (dto.status as any) || 'FULL_TIME',
        profileSummary: dto.profileSummary,
        avatarUrl: dto.avatarUrl,
      },
    });

    await this.audit.log({
      actorId,
      actorEmail,
      action: AuditAction.CREATE,
      entityType: 'EMPLOYEE',
      entityId: employee.id,
      afterState: employee,
    });

    return employee;
  }

  async update(id: string, dto: Partial<UpdateEmployeeDto>, actorId?: string, actorEmail?: string) {
    const existing = await this.findOne(id);

    // Track historical changes in department or designation
    const deptChanged = dto.departmentId && dto.departmentId !== existing.departmentId;
    const desigChanged = dto.designationId && dto.designationId !== existing.designationId;

    if (deptChanged || desigChanged) {
      await this.prisma.employeeEmploymentHistory.create({
        data: {
          employeeId: id,
          previousDepartment: existing.department?.name,
          previousDesignation: existing.designation?.title,
          reason: 'Department or designation reassignment',
        },
      });
    }

    const updated = await this.prisma.employee.update({
      where: { id },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email ? dto.email.toLowerCase() : undefined,
        phone: dto.phone,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        gender: dto.gender as any,
        address: dto.address,
        departmentId: dto.departmentId,
        designationId: dto.designationId,
        managerId: dto.managerId,
        joiningDate: dto.joiningDate ? new Date(dto.joiningDate) : undefined,
        status: dto.status as any,
        profileSummary: dto.profileSummary,
        avatarUrl: dto.avatarUrl,
      },
    });

    await this.audit.log({
      actorId,
      actorEmail,
      action: AuditAction.UPDATE,
      entityType: 'EMPLOYEE',
      entityId: id,
      beforeState: existing,
      afterState: updated,
    });

    return updated;
  }

  async remove(id: string, actorId?: string, actorEmail?: string) {
    const existing = await this.findOne(id);

    await this.prisma.$transaction(async (tx) => {
      await tx.employee.update({
        where: { id },
        data: { deletedAt: new Date(), status: 'TERMINATED' },
      });

      if (existing.userId) {
        await tx.user.update({
          where: { id: existing.userId },
          data: { isActive: false, deletedAt: new Date() },
        });
      }
    });

    await this.audit.log({
      actorId,
      actorEmail,
      action: AuditAction.DELETE,
      entityType: 'EMPLOYEE',
      entityId: id,
      beforeState: existing,
    });

    return { message: 'Employee successfully deactivated and soft deleted' };
  }

  async getAuditLogs(employeeId: string) {
    return this.audit.getLogs('EMPLOYEE', employeeId);
  }

  async getMyProfile(userId: string, employeeId?: string) {
    let empId = employeeId;
    if (!empId) {
      const emp = await this.prisma.employee.findFirst({
        where: { userId, deletedAt: null },
      });
      if (!emp) {
        throw new NotFoundException('No employee record linked to current user account');
      }
      empId = emp.id;
    }
    return this.findOne(empId);
  }

  async updateMyAvatar(
    userId: string,
    employeeId: string | undefined,
    avatarUrl: string | null | undefined,
    actorEmail?: string,
  ) {
    let empId = employeeId;
    if (!empId) {
      const emp = await this.prisma.employee.findFirst({
        where: { userId, deletedAt: null },
      });
      if (!emp) {
        throw new NotFoundException('No employee record linked to current user account');
      }
      empId = emp.id;
    }

    const existing = await this.prisma.employee.findUnique({
      where: { id: empId },
    });

    if (!existing) {
      throw new NotFoundException('Employee not found');
    }

    const cleanAvatarUrl = avatarUrl && avatarUrl.trim().length > 0 ? avatarUrl.trim() : null;

    const updated = await this.prisma.employee.update({
      where: { id: empId },
      data: { avatarUrl: cleanAvatarUrl },
    });

    await this.audit.log({
      actorId: userId,
      actorEmail,
      action: AuditAction.UPDATE,
      entityType: 'EMPLOYEE_AVATAR',
      entityId: empId,
      beforeState: { avatarUrl: existing.avatarUrl },
      afterState: { avatarUrl: updated.avatarUrl },
    });

    this.logger.log(`Employee ${empId} (${existing.email}) updated avatar picture`);

    return {
      success: true,
      message: cleanAvatarUrl
        ? 'Profile picture updated successfully'
        : 'Profile picture removed successfully',
      data: {
        employeeId: updated.id,
        avatarUrl: updated.avatarUrl,
      },
    };
  }

  async bulkImport(
    items: Array<{
      employeeNumber?: string;
      fullName?: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      jobTitle?: string;
      departmentId?: string;
      departmentCode?: string;
      reportsTo?: string;
      status?: string;
      phone?: string;
      coreResponsibilities?: string;
    }>,
    actorId?: string,
    actorEmail?: string,
  ) {
    const results = [];

    const allDepts = await this.prisma.department.findMany({ where: { deletedAt: null } });
    const deptMap = new Map<string, string>();
    allDepts.forEach((d) => {
      deptMap.set(d.code.toUpperCase(), d.id);
      deptMap.set(d.name.toLowerCase(), d.id);
    });

    for (const item of items) {
      if (!item.employeeNumber && !item.fullName) continue;

      let firstName = item.firstName || '';
      let lastName = item.lastName || '';
      if (!firstName && item.fullName) {
        const parts = item.fullName.trim().split(/\s+/);
        firstName = parts[0] || 'Employee';
        lastName = parts.slice(1).join(' ') || parts[0];
      }

      const empNum = (item.employeeNumber || `EMP-${Date.now()}`).trim();
      const email = (
        item.email ||
        `${firstName.toLowerCase().replace(/[^a-z0-9]/g, '')}.${lastName.toLowerCase().replace(/[^a-z0-9]/g, '')}@ems.local`
      ).trim();

      let deptId: string | undefined;
      if (item.departmentCode && deptMap.has(item.departmentCode.toUpperCase())) {
        deptId = deptMap.get(item.departmentCode.toUpperCase());
      } else if (item.departmentId && deptMap.has(item.departmentId.toUpperCase())) {
        deptId = deptMap.get(item.departmentId.toUpperCase());
      }

      let desigId: string | undefined;
      if (item.jobTitle) {
        const title = item.jobTitle.trim();
        const code = 'DES-' + title.toUpperCase().replace(/[^A-Z0-9]/g, '_').substring(0, 20);
        const desig = await this.prisma.designation.upsert({
          where: { code },
          update: { title, departmentId: deptId },
          create: { code, title, departmentId: deptId },
        });
        desigId = desig.id;
      }

      let empStatus: any = 'FULL_TIME';
      if (item.status) {
        const s = item.status.toUpperCase();
        if (['FULL_TIME', 'PART_TIME', 'CONTRACT', 'PROBATION', 'ACTIVE'].includes(s)) {
          empStatus = s === 'ACTIVE' ? 'FULL_TIME' : s;
        }
      }

      const existing = await this.prisma.employee.findFirst({
        where: {
          OR: [{ employeeNumber: empNum }, { email }],
        },
      });

      if (existing) {
        const updated = await this.prisma.employee.update({
          where: { id: existing.id },
          data: {
            firstName,
            lastName,
            email,
            phone: item.phone || existing.phone,
            departmentId: deptId || existing.departmentId,
            designationId: desigId || existing.designationId,
            status: empStatus,
            profileSummary: item.coreResponsibilities || existing.profileSummary,
            deletedAt: null,
          },
        });
        results.push(updated);
      } else {
        const created = await this.prisma.employee.create({
          data: {
            employeeNumber: empNum,
            firstName,
            lastName,
            email,
            phone: item.phone,
            departmentId: deptId,
            designationId: desigId,
            status: empStatus,
            joiningDate: new Date('2024-01-15'),
            profileSummary: item.coreResponsibilities,
          },
        });
        results.push(created);
      }
    }

    await this.audit.log({
      actorId,
      actorEmail,
      action: AuditAction.CREATE,
      entityType: 'EMPLOYEE_BULK_IMPORT',
      entityId: 'BULK',
      afterState: { importedCount: results.length },
    });

    return { success: true, count: results.length, employees: results };
  }
}
