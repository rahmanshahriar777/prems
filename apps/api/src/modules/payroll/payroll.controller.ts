import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PayrollService } from './payroll.service';
import {
  CreateSalaryStructureDto,
  AssignSalaryDto,
  CreatePayrollRunDto,
} from './dto/payroll.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SystemRole, JwtPayload } from '@ems/shared';

@ApiTags('Payroll')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payroll')
export class PayrollController {
  constructor(private readonly service: PayrollService) {}

  @Get('salary-structures')
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.HR_ADMIN)
  @ApiOperation({ summary: 'List all salary structures' })
  getSalaryStructures() {
    return this.service.getSalaryStructures();
  }

  @Post('salary-structures')
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.HR_ADMIN)
  @ApiOperation({ summary: 'Create a new salary structure with component breakdown' })
  createSalaryStructure(@Body() dto: CreateSalaryStructureDto, @CurrentUser() user: JwtPayload) {
    return this.service.createSalaryStructure(dto, user.sub, user.email);
  }

  @Get('employees/:employeeId/salary')
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.HR_ADMIN)
  @ApiOperation({ summary: 'Get active salary structure assignment for an employee' })
  getEmployeeSalary(@Param('employeeId') employeeId: string) {
    return this.service.getEmployeeSalary(employeeId);
  }

  @Put('employees/:employeeId/salary')
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.HR_ADMIN)
  @ApiOperation({ summary: 'Assign or update employee salary structure' })
  assignSalary(
    @Param('employeeId') employeeId: string,
    @Body() dto: Omit<AssignSalaryDto, 'employeeId'>,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.assignSalary(
      { ...dto, employeeId },
      user.sub,
      user.email,
    );
  }

  @Post('runs')
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.HR_ADMIN)
  @ApiOperation({ summary: 'Generate a new monthly payroll run' })
  createPayrollRun(@Body() dto: CreatePayrollRunDto, @CurrentUser() user: JwtPayload) {
    return this.service.createPayrollRun(dto, user.sub, user.email);
  }

  @Get('runs')
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.HR_ADMIN, SystemRole.AUDITOR)
  @ApiOperation({ summary: 'List past and current payroll runs' })
  getPayrollRuns() {
    return this.service.getPayrollRuns();
  }

  @Get('runs/:id')
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.HR_ADMIN, SystemRole.AUDITOR)
  @ApiOperation({ summary: 'Get detailed payroll run including summary and line items' })
  getPayrollRunById(@Param('id') id: string) {
    return this.service.getPayrollRunById(id);
  }

  @Patch('runs/:id/approve')
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.HR_ADMIN)
  @ApiOperation({ summary: 'Approve payroll run and finalize payslips' })
  approvePayrollRun(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.approvePayrollRun(id, user.email, user.sub);
  }

  @Get('payslips')
  @ApiOperation({ summary: 'List payslips (personal for employees, all for HR/Finance)' })
  getPayslips(
    @CurrentUser() user: JwtPayload,
    @Query('employeeId') employeeId?: string,
    @Query('payrollRunId') payrollRunId?: string,
  ) {
    const isHrOrAdmin = user.roles.includes(SystemRole.SUPER_ADMIN) || user.roles.includes(SystemRole.HR_ADMIN);

    // If regular employee, strictly enforce self access
    const targetEmployeeId = isHrOrAdmin ? employeeId : user.employeeId;

    if (!isHrOrAdmin && !targetEmployeeId) {
      throw new ForbiddenException('User is not associated with an employee profile');
    }

    return this.service.getPayslips(targetEmployeeId, payrollRunId);
  }

  @Get('payslips/:id')
  @ApiOperation({ summary: 'Get itemized payslip breakdown' })
  async getPayslipById(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const payslip = await this.service.getPayslipById(id);
    const isHrOrAdmin = user.roles.includes(SystemRole.SUPER_ADMIN) || user.roles.includes(SystemRole.HR_ADMIN);

    if (!isHrOrAdmin && payslip.employeeId !== user.employeeId) {
      throw new ForbiddenException('Access denied to other employee payslips');
    }

    return payslip;
  }
}
