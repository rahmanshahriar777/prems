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
import { PerformanceService } from './performance.service';
import {
  CreateReviewCycleDto,
  CreatePerformanceReviewDto,
  SubmitSelfReviewDto,
  SubmitManagerReviewDto,
  CreateGoalDto,
  UpdateGoalDto,
  SubmitFeedbackDto,
} from './dto/performance.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SystemRole, JwtPayload } from '@ems/shared';

@ApiTags('Performance & Goals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class PerformanceController {
  constructor(private readonly service: PerformanceService) {}

  @Get('performance/cycles')
  @ApiOperation({ summary: 'List all review cycles' })
  getCycles() {
    return this.service.getCycles();
  }

  @Post('performance/cycles')
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.HR_ADMIN)
  @ApiOperation({ summary: 'Create a new performance review cycle' })
  createCycle(@Body() dto: CreateReviewCycleDto, @CurrentUser() user: JwtPayload) {
    return this.service.createCycle(dto, user.sub, user.email);
  }

  @Get('performance/reviews')
  @ApiOperation({ summary: 'List performance reviews (filtered by employee or cycle)' })
  getReviews(
    @CurrentUser() user: JwtPayload,
    @Query('employeeId') employeeId?: string,
    @Query('cycleId') cycleId?: string,
  ) {
    const isHrOrAdmin = user.roles.includes(SystemRole.SUPER_ADMIN) || user.roles.includes(SystemRole.HR_ADMIN);
    const targetEmpId = isHrOrAdmin ? employeeId : user.employeeId;

    return this.service.getReviews(targetEmpId, cycleId);
  }

  @Post('performance/reviews')
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.HR_ADMIN, SystemRole.MANAGER)
  @ApiOperation({ summary: 'Initiate a performance review for an employee' })
  createReview(@Body() dto: CreatePerformanceReviewDto) {
    return this.service.createReview(dto);
  }

  @Patch('performance/reviews/:id/self-review')
  @ApiOperation({ summary: 'Submit employee self evaluation' })
  submitSelfReview(
    @Param('id') id: string,
    @Body() dto: SubmitSelfReviewDto,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!user.employeeId) throw new ForbiddenException('Employee profile required');
    return this.service.submitSelfReview(id, user.employeeId, dto);
  }

  @Patch('performance/reviews/:id/manager-review')
  @Roles(SystemRole.MANAGER, SystemRole.SUPER_ADMIN, SystemRole.HR_ADMIN)
  @ApiOperation({ summary: 'Submit manager evaluation and final score' })
  submitManagerReview(
    @Param('id') id: string,
    @Body() dto: SubmitManagerReviewDto,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!user.employeeId) throw new ForbiddenException('Manager employee profile required');
    return this.service.submitManagerReview(id, user.employeeId, dto);
  }

  @Get('goals')
  @ApiOperation({ summary: 'List goals for current employee or target employee' })
  getGoals(@CurrentUser() user: JwtPayload, @Query('employeeId') employeeId?: string) {
    const isHrOrAdmin = user.roles?.some((r) => [SystemRole.SUPER_ADMIN, SystemRole.HR_ADMIN].includes(r));
    const target = employeeId || (isHrOrAdmin ? undefined : user.employeeId);
    if (!target && !isHrOrAdmin) throw new ForbiddenException('Employee profile required');
    return this.service.getGoals(target);
  }

  @Post('goals')
  @ApiOperation({ summary: 'Create a personal or team goal' })
  createGoal(@Body() dto: CreateGoalDto, @CurrentUser() user: JwtPayload) {
    const isHrOrAdmin = user.roles?.some((r) => [SystemRole.SUPER_ADMIN, SystemRole.HR_ADMIN].includes(r));
    const targetEmpId = (isHrOrAdmin && dto.employeeId) ? dto.employeeId : (dto.employeeId || user.employeeId);
    if (!targetEmpId) throw new ForbiddenException('Employee profile required');
    return this.service.createGoal(targetEmpId, dto);
  }

  @Patch('goals/:id')
  @ApiOperation({ summary: 'Update goal progress and status' })
  updateGoal(
    @Param('id') id: string,
    @Body() dto: UpdateGoalDto,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!user.employeeId) throw new ForbiddenException('Employee profile required');
    return this.service.updateGoal(id, user.employeeId, dto);
  }

  @Post('feedback')
  @ApiOperation({ summary: 'Submit 360 peer or manager feedback' })
  submitFeedback(@Body() dto: SubmitFeedbackDto, @CurrentUser() user: JwtPayload) {
    if (!user.employeeId) throw new ForbiddenException('Employee profile required');
    return this.service.submitFeedback(user.employeeId, dto);
  }

  @Get('feedback')
  @ApiOperation({ summary: 'View feedback received by current employee' })
  getFeedback(@CurrentUser() user: JwtPayload) {
    if (!user.employeeId) throw new ForbiddenException('Employee profile required');
    return this.service.getFeedback(user.employeeId);
  }
}
