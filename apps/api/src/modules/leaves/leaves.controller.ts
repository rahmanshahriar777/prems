import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LeavesService } from './leaves.service';
import {
  CreateLeaveRequestDto,
  ApproveLeaveDto,
  CreateLeaveTypeDto,
  CreateHolidayDto,
} from './dto/leave.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SystemRole, JwtPayload, LeaveStatus } from '@ems/shared';

@ApiTags('Leaves & Holidays')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class LeavesController {
  constructor(private readonly service: LeavesService) {}

  @Get('leave-types')
  @ApiOperation({ summary: 'List all configured leave types' })
  getLeaveTypes() {
    return this.service.getLeaveTypes();
  }

  @Post('leave-types')
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.HR_ADMIN)
  @ApiOperation({ summary: 'Create a new leave type' })
  createLeaveType(@Body() dto: CreateLeaveTypeDto, @CurrentUser() user: JwtPayload) {
    return this.service.createLeaveType(dto, user.sub, user.email);
  }

  @Get('leave-balances')
  @ApiOperation({ summary: 'Get current leave balances' })
  getLeaveBalances(
    @CurrentUser() user: JwtPayload,
    @Query('employeeId') employeeId?: string,
    @Query('year') year?: string,
  ) {
    const targetEmpId = employeeId && (user.roles.includes(SystemRole.HR_ADMIN) || user.roles.includes(SystemRole.SUPER_ADMIN))
      ? employeeId
      : user.employeeId;

    if (!targetEmpId) {
      return [];
    }

    const targetYear = year ? parseInt(year, 10) : new Date().getFullYear();
    return this.service.getEmployeeBalances(targetEmpId, targetYear);
  }

  @Post('leave-requests')
  @ApiOperation({ summary: 'Submit a new leave request' })
  createLeaveRequest(@Body() dto: CreateLeaveRequestDto, @CurrentUser() user: JwtPayload) {
    const isHrOrAdmin = user.roles.includes(SystemRole.HR_ADMIN) || user.roles.includes(SystemRole.SUPER_ADMIN);
    const targetEmpId = (isHrOrAdmin && dto.employeeId) ? dto.employeeId : user.employeeId;

    if (!targetEmpId) {
      throw new ForbiddenException('User is not associated with an employee profile and no employee was selected');
    }
    return this.service.createLeaveRequest(targetEmpId, dto);
  }

  @Get('leave-requests')
  @ApiOperation({ summary: 'List leave requests (all for HR/Managers, personal for Employees)' })
  getLeaveRequests(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: LeaveStatus,
    @Query('all') all?: string,
  ) {
    const isHrOrAdmin = user.roles.includes(SystemRole.HR_ADMIN) || user.roles.includes(SystemRole.SUPER_ADMIN);
    const filterEmployeeId = isHrOrAdmin && all === 'true' ? undefined : user.employeeId;

    return this.service.getLeaveRequests(filterEmployeeId, status);
  }

  @Get('leave-requests/:id')
  @ApiOperation({ summary: 'Get details and approval history of a leave request' })
  getLeaveRequestById(@Param('id') id: string) {
    return this.service.getLeaveRequestById(id);
  }

  @Patch('leave-requests/:id/approve')
  @Roles(SystemRole.MANAGER, SystemRole.HR_ADMIN, SystemRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Approve a pending leave request' })
  approveLeave(
    @Param('id') id: string,
    @Body('remarks') remarks: string,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!user.employeeId) {
      throw new ForbiddenException('User is not associated with an employee profile');
    }
    return this.service.approveOrReject(
      id,
      user.employeeId,
      { status: LeaveStatus.APPROVED, remarks },
      user.email,
    );
  }

  @Patch('leave-requests/:id/reject')
  @Roles(SystemRole.MANAGER, SystemRole.HR_ADMIN, SystemRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Reject a pending leave request' })
  rejectLeave(
    @Param('id') id: string,
    @Body('remarks') remarks: string,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!user.employeeId) {
      throw new ForbiddenException('User is not associated with an employee profile');
    }
    return this.service.approveOrReject(
      id,
      user.employeeId,
      { status: LeaveStatus.REJECTED, remarks },
      user.email,
    );
  }

  @Patch('leave-requests/:id/cancel')
  @ApiOperation({ summary: 'Cancel an owned pending leave request' })
  cancelLeave(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    if (!user.employeeId) {
      throw new ForbiddenException('User is not associated with an employee profile');
    }
    return this.service.cancelLeave(id, user.employeeId);
  }

  @Get('holidays')
  @ApiOperation({ summary: 'List company and statutory holidays' })
  getHolidays() {
    return this.service.getHolidays();
  }

  @Post('holidays')
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.HR_ADMIN)
  @ApiOperation({ summary: 'Create a company holiday' })
  createHoliday(@Body() dto: CreateHolidayDto) {
    return this.service.createHoliday(dto);
  }
}
