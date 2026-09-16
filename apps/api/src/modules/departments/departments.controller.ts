import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SystemRole, JwtPayload } from '@ems/shared';

@ApiTags('Departments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly service: DepartmentsService) {}

  @Get()
  @ApiOperation({ summary: 'List all active departments' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get department details with hierarchy and staff count' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.HR_ADMIN)
  @ApiOperation({ summary: 'Create a new department' })
  create(@Body() dto: CreateDepartmentDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(dto, user.sub, user.email);
  }

  @Patch(':id')
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.HR_ADMIN)
  @ApiOperation({ summary: 'Update an existing department' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDepartmentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.update(id, dto, user.sub, user.email);
  }

  @Delete(':id')
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.HR_ADMIN)
  @ApiOperation({ summary: 'Soft delete a department' })
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.remove(id, user.sub, user.email);
  }
}
