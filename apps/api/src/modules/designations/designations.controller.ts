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
import { DesignationsService } from './designations.service';
import { CreateDesignationDto, UpdateDesignationDto } from './dto/designation.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SystemRole, JwtPayload } from '@ems/shared';

@ApiTags('Designations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('designations')
export class DesignationsController {
  constructor(private readonly service: DesignationsService) {}

  @Get()
  @ApiOperation({ summary: 'List all designations, optionally filtered by department' })
  findAll(@Query('departmentId') departmentId?: string) {
    return this.service.findAll(departmentId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get designation details' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.HR_ADMIN)
  @ApiOperation({ summary: 'Create a new designation' })
  create(@Body() dto: CreateDesignationDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(dto, user.sub, user.email);
  }

  @Patch(':id')
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.HR_ADMIN)
  @ApiOperation({ summary: 'Update an existing designation' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDesignationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.update(id, dto, user.sub, user.email);
  }

  @Delete(':id')
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.HR_ADMIN)
  @ApiOperation({ summary: 'Soft delete a designation' })
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.remove(id, user.sub, user.email);
  }
}
