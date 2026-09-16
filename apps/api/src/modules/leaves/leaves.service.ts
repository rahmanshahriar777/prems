import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AuditService } from '../../core/audit/audit.service';
import {
  CreateLeaveRequestDto,
  ApproveLeaveDto,
  CreateLeaveTypeDto,
  CreateHolidayDto,
} from './dto/leave.dto';
import { LeaveStatus, AuditAction, DateUtil } from '@ems/shared';

@Injectable()
export class LeavesService {
  private readonly logger = new Logger(LeavesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ---------------------------------------------------------------------------
  // Leave Types & Balances
  // ---------------------------------------------------------------------------

  async getLeaveTypes() {
    return this.prisma.leaveType.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async createLeaveType(dto: CreateLeaveTypeDto, actorId?: string, actorEmail?: string) {
    const existing = await this.prisma.leaveType.findUnique({
      where: { code: dto.code.toUpperCase() },
    });
    if (existing) {
      throw new BadRequestException(`Leave type with code '${dto.code}' already exists`);
    }

    const created = await this.prisma.leaveType.create({
      data: {
        name: dto.name,
        code: dto.code.toUpperCase(),
        type: dto.type as any,
        defaultDaysPerYear: dto.defaultDaysPerYear,
        isPaid: dto.isPaid ?? true,
        description: dto.description,
      },
    });

    await this.audit.log({
      actorId,
      actorEmail,
      action: AuditAction.CREATE,
      entityType: 'LEAVE_TYPE',
      entityId: created.id,
      afterState: created,
    });

    return created;
  }

  async getEmployeeBalances(employeeId: string, year: number = new Date().getFullYear()) {
    let balances = await this.prisma.leaveBalance.findMany({
      where: { employeeId, year },
      include: { leaveType: true },
    });

    // If balances don't exist yet for this year, lazily initialize from leave types
    if (balances.length === 0) {
      const leaveTypes = await this.prisma.leaveType.findMany();
      for (const lt of leaveTypes) {
        await this.prisma.leaveBalance.create({
          data: {
            employeeId,
            leaveTypeId: lt.id,
            year,
            allocatedDays: lt.defaultDaysPerYear,
            remainingDays: lt.defaultDaysPerYear,
            usedDays: 0,
            pendingDays: 0,
          },
        });
      }

      balances = await this.prisma.leaveBalance.findMany({
        where: { employeeId, year },
        include: { leaveType: true },
      });
    }

    return balances;
  }

  // ---------------------------------------------------------------------------
  // Leave Requests & Approvals
  // ---------------------------------------------------------------------------

  async getLeaveRequests(employeeId?: string, status?: LeaveStatus) {
    return this.prisma.leaveRequest.findMany({
      where: {
        ...(employeeId && { employeeId }),
        ...(status && { status: status as any }),
      },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, employeeNumber: true, email: true },
        },
        leaveType: true,
        approvals: {
          include: {
            approver: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getLeaveRequestById(id: string) {
    const req = await this.prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        employee: true,
        leaveType: true,
        approvals: {
          include: { approver: true },
        },
      },
    });
    if (!req) {
      throw new NotFoundException(`Leave request #${id} not found`);
    }
    return req;
  }

  async createLeaveRequest(employeeId: string, dto: CreateLeaveRequestDto) {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);

    if (end < start) {
      throw new BadRequestException('End date cannot be prior to start date');
    }

    const totalDays = DateUtil.calculateDaysBetween(start, end);
    const currentYear = start.getFullYear();

    // Verify leave balance in transaction
    return this.prisma.$transaction(async (tx) => {
      let balance = await tx.leaveBalance.findUnique({
        where: {
          employeeId_leaveTypeId_year: {
            employeeId,
            leaveTypeId: dto.leaveTypeId,
            year: currentYear,
          },
        },
      });

      if (!balance) {
        const lt = await tx.leaveType.findUnique({ where: { id: dto.leaveTypeId } });
        if (!lt) throw new NotFoundException('Leave type not found');

        balance = await tx.leaveBalance.create({
          data: {
            employeeId,
            leaveTypeId: dto.leaveTypeId,
            year: currentYear,
            allocatedDays: lt.defaultDaysPerYear,
            remainingDays: lt.defaultDaysPerYear,
            usedDays: 0,
            pendingDays: 0,
          },
        });
      }

      if (Number(balance.remainingDays) < totalDays) {
        throw new BadRequestException(
          `Insufficient leave balance. Requested: ${totalDays} days, Remaining: ${balance.remainingDays} days`,
        );
      }

      // Reserve days into pendingDays
      await tx.leaveBalance.update({
        where: { id: balance.id },
        data: {
          pendingDays: { increment: totalDays },
          remainingDays: { decrement: totalDays },
        },
      });

      const request = await tx.leaveRequest.create({
        data: {
          employeeId,
          leaveTypeId: dto.leaveTypeId,
          startDate: start,
          endDate: end,
          totalDays,
          reason: dto.reason,
          status: LeaveStatus.PENDING as any,
        },
        include: { leaveType: true, employee: true },
      });

      return request;
    });
  }

  async approveOrReject(
    requestId: string,
    approverEmployeeId: string,
    dto: ApproveLeaveDto,
    actorEmail?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.leaveRequest.findUnique({
        where: { id: requestId },
        include: { employee: true },
      });

      if (!request) {
        throw new NotFoundException(`Leave request #${requestId} not found`);
      }

      if (request.status !== (LeaveStatus.PENDING as any)) {
        throw new BadRequestException(`Leave request has already been ${request.status}`);
      }

      const year = request.startDate.getFullYear();
      const balance = await tx.leaveBalance.findUnique({
        where: {
          employeeId_leaveTypeId_year: {
            employeeId: request.employeeId,
            leaveTypeId: request.leaveTypeId,
            year,
          },
        },
      });

      if (dto.status === LeaveStatus.APPROVED) {
        if (balance) {
          await tx.leaveBalance.update({
            where: { id: balance.id },
            data: {
              pendingDays: { decrement: Number(request.totalDays) },
              usedDays: { increment: Number(request.totalDays) },
            },
          });
        }
      } else {
        // REJECTED - restore remainingDays from pendingDays
        if (balance) {
          await tx.leaveBalance.update({
            where: { id: balance.id },
            data: {
              pendingDays: { decrement: Number(request.totalDays) },
              remainingDays: { increment: Number(request.totalDays) },
            },
          });
        }
      }

      const updatedRequest = await tx.leaveRequest.update({
        where: { id: requestId },
        data: { status: dto.status as any },
      });

      await tx.leaveApproval.create({
        data: {
          leaveRequestId: requestId,
          approverId: approverEmployeeId,
          status: dto.status as any,
          remarks: dto.remarks,
        },
      });

      await this.audit.log({
        actorId: approverEmployeeId,
        actorEmail,
        action: dto.status === LeaveStatus.APPROVED ? AuditAction.APPROVE : AuditAction.REJECT,
        entityType: 'LEAVE_REQUEST',
        entityId: requestId,
        afterState: updatedRequest,
      });

      return updatedRequest;
    });
  }

  async cancelLeave(requestId: string, employeeId: string) {
    return this.prisma.$transaction(async (tx) => {
      const req = await tx.leaveRequest.findUnique({ where: { id: requestId } });
      if (!req) throw new NotFoundException('Leave request not found');

      if (req.employeeId !== employeeId) {
        throw new ForbiddenException('Cannot cancel another employee leave request');
      }

      if (req.status !== (LeaveStatus.PENDING as any)) {
        throw new BadRequestException('Only pending leave requests can be cancelled');
      }

      const year = req.startDate.getFullYear();
      const balance = await tx.leaveBalance.findUnique({
        where: {
          employeeId_leaveTypeId_year: {
            employeeId,
            leaveTypeId: req.leaveTypeId,
            year,
          },
        },
      });

      if (balance) {
        await tx.leaveBalance.update({
          where: { id: balance.id },
          data: {
            pendingDays: { decrement: Number(req.totalDays) },
            remainingDays: { increment: Number(req.totalDays) },
          },
        });
      }

      return tx.leaveRequest.update({
        where: { id: requestId },
        data: { status: LeaveStatus.CANCELLED as any },
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Holidays
  // ---------------------------------------------------------------------------

  async getHolidays() {
    return this.prisma.holiday.findMany({
      orderBy: { date: 'asc' },
    });
  }

  async createHoliday(dto: CreateHolidayDto) {
    const holidayDate = new Date(dto.date);
    return this.prisma.holiday.upsert({
      where: { date: holidayDate },
      update: { title: dto.title, description: dto.description },
      create: {
        title: dto.title,
        date: holidayDate,
        isRecurring: dto.isRecurring ?? false,
        description: dto.description,
      },
    });
  }
}
