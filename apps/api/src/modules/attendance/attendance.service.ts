import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { ClockInDto, ClockOutDto, AttendanceQueryDto } from './dto/attendance.dto';
import { AttendanceStatus, DateUtil, createPaginatedResponse } from '@ems/shared';

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  constructor(private readonly prisma: PrismaService) {}

  private getTodayDateOnly(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  async clockIn(employeeId: string, dto: ClockInDto) {
    const today = this.getTodayDateOnly();

    const existing = await this.prisma.attendanceRecord.findUnique({
      where: {
        employeeId_date: {
          employeeId,
          date: today,
        },
      },
    });

    if (existing && existing.clockInTime) {
      throw new BadRequestException('You have already clocked in for today');
    }

    const defaultShift = await this.prisma.shift.findFirst({
      where: { isDefault: true },
    });

    const now = new Date();
    let status = AttendanceStatus.PRESENT;

    // Check if late based on shift
    if (defaultShift) {
      const [shiftHour, shiftMinute] = defaultShift.startTime.split(':').map(Number);
      const shiftStartTime = new Date(today);
      shiftStartTime.setHours(shiftHour, shiftMinute + defaultShift.gracePeriodMinutes, 0, 0);

      if (now > shiftStartTime) {
        status = AttendanceStatus.LATE;
      }
    }

    return this.prisma.attendanceRecord.upsert({
      where: {
        employeeId_date: {
          employeeId,
          date: today,
        },
      },
      update: {
        clockInTime: now,
        status: status as any,
        notes: dto.notes,
        shiftId: defaultShift?.id,
      },
      create: {
        employeeId,
        date: today,
        clockInTime: now,
        status: status as any,
        notes: dto.notes,
        shiftId: defaultShift?.id,
      },
    });
  }

  async clockOut(employeeId: string, dto: ClockOutDto) {
    const today = this.getTodayDateOnly();

    const existing = await this.prisma.attendanceRecord.findUnique({
      where: {
        employeeId_date: {
          employeeId,
          date: today,
        },
      },
    });

    if (!existing || !existing.clockInTime) {
      throw new BadRequestException('Cannot clock out without clocking in first');
    }

    if (existing.clockOutTime) {
      throw new BadRequestException('You have already clocked out for today');
    }

    const clockOutTime = new Date();
    const hours = DateUtil.calculateHoursWorked(existing.clockInTime, clockOutTime);

    let finalStatus = existing.status;
    if (hours < 4) {
      finalStatus = AttendanceStatus.HALF_DAY as any;
    }

    return this.prisma.attendanceRecord.update({
      where: { id: existing.id },
      data: {
        clockOutTime,
        totalHoursWorked: hours,
        status: finalStatus,
        notes: dto.notes ? `${existing.notes || ''} | ${dto.notes}` : existing.notes,
      },
    });
  }

  async getMyAttendance(employeeId: string, query: AttendanceQueryDto) {
    const { page = 1, limit = 20, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      employeeId,
      ...(startDate && endDate && {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.attendanceRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
      }),
      this.prisma.attendanceRecord.count({ where }),
    ]);

    // Today status check
    const today = this.getTodayDateOnly();
    const todayRecord = await this.prisma.attendanceRecord.findUnique({
      where: {
        employeeId_date: {
          employeeId,
          date: today,
        },
      },
    });

    const response = createPaginatedResponse(items, total, page, limit);
    return {
      ...response,
      meta: {
        ...response.meta,
        today: todayRecord,
      },
    };
  }

  async getTeamAttendance(managerEmployeeId: string, query: AttendanceQueryDto) {
    const { page = 1, limit = 20, status } = query;
    const skip = (page - 1) * limit;

    const subordinates = await this.prisma.employee.findMany({
      where: { managerId: managerEmployeeId, deletedAt: null },
      select: { id: true },
    });
    const subIds = subordinates.map((s) => s.id);

    const where: any = {
      employeeId: { in: subIds },
      ...(status && { status }),
    };

    const [items, total] = await Promise.all([
      this.prisma.attendanceRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          employee: {
            select: { id: true, firstName: true, lastName: true, employeeNumber: true },
          },
        },
      }),
      this.prisma.attendanceRecord.count({ where }),
    ]);

    return createPaginatedResponse(items, total, page, limit);
  }

  async getReports(query: AttendanceQueryDto) {
    const { page = 1, limit = 20, departmentId, employeeId, startDate, endDate, status } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      ...(employeeId && { employeeId }),
      ...(status && { status }),
      ...(departmentId && { employee: { departmentId } }),
      ...(startDate && endDate && {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.attendanceRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeNumber: true,
              department: { select: { name: true } },
            },
          },
        },
      }),
      this.prisma.attendanceRecord.count({ where }),
    ]);

    return createPaginatedResponse(items, total, page, limit);
  }
}
