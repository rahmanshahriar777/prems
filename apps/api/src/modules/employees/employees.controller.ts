import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto, UpdateEmployeeDto, EmployeeQueryDto, UpdateAvatarDto } from './dto/employee.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SystemRole, JwtPayload } from '@ems/shared';

@ApiTags('Employees')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('employees')
export class EmployeesController {
  constructor(private readonly service: EmployeesService) {}

  @Get()
  @ApiOperation({ summary: 'List employees with pagination, search, and filtering' })
  findAll(@Query() query: EmployeeQueryDto) {
    return this.service.findAll(query);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get profile of current authenticated employee' })
  getMyProfile(@CurrentUser() user: JwtPayload) {
    return this.service.getMyProfile(user.sub, user.employeeId);
  }

  @Patch('me/avatar')
  @ApiOperation({ summary: 'Update or remove personal profile picture for authenticated employee' })
  updateMyAvatar(
    @Body() dto: UpdateAvatarDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.updateMyAvatar(user.sub, user.employeeId, dto.avatarUrl, user.email);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get detailed employee profile, hierarchy, and active compensation' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.HR_ADMIN)
  @ApiOperation({ summary: 'Create a new employee profile' })
  create(@Body() dto: CreateEmployeeDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(dto, user.sub, user.email);
  }

  @Patch(':id')
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.HR_ADMIN, SystemRole.MANAGER)
  @ApiOperation({ summary: 'Update an employee profile' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.update(id, dto, user.sub, user.email);
  }

  @Delete(':id')
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.HR_ADMIN)
  @ApiOperation({ summary: 'Soft delete and deactivate employee' })
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.remove(id, user.sub, user.email);
  }

  @Get(':id/audit-logs')
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.HR_ADMIN, SystemRole.AUDITOR)
  @ApiOperation({ summary: 'Get mutation audit history for an employee' })
  getAuditLogs(@Param('id') id: string) {
    return this.service.getAuditLogs(id);
  }
}
