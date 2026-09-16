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
  CreateReviewCycleDto,
  CreatePerformanceReviewDto,
  SubmitSelfReviewDto,
  SubmitManagerReviewDto,
  CreateGoalDto,
  UpdateGoalDto,
  SubmitFeedbackDto,
} from './dto/performance.dto';
import { ReviewStatus, AuditAction } from '@ems/shared';

@Injectable()
export class PerformanceService {
  private readonly logger = new Logger(PerformanceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ---------------------------------------------------------------------------
  // Review Cycles
  // ---------------------------------------------------------------------------

  async getCycles() {
    return this.prisma.performanceReviewCycle.findMany({
      include: {
        _count: { select: { reviews: true } },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async createCycle(dto: CreateReviewCycleDto, actorId?: string, actorEmail?: string) {
    const cycle = await this.prisma.performanceReviewCycle.create({
      data: {
        title: dto.title,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        description: dto.description,
        isActive: true,
      },
    });

    await this.audit.log({
      actorId,
      actorEmail,
      action: AuditAction.CREATE,
      entityType: 'PERFORMANCE_CYCLE',
      entityId: cycle.id,
      afterState: cycle,
    });

    return cycle;
  }

  // ---------------------------------------------------------------------------
  // Reviews
  // ---------------------------------------------------------------------------

  async getReviews(employeeId?: string, cycleId?: string) {
    return this.prisma.performanceReview.findMany({
      where: {
        ...(employeeId && { employeeId }),
        ...(cycleId && { cycleId }),
      },
      include: {
        cycle: true,
        employee: {
          select: { id: true, firstName: true, lastName: true, employeeNumber: true, email: true },
        },
        reviewer: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createReview(dto: CreatePerformanceReviewDto) {
    const existing = await this.prisma.performanceReview.findUnique({
      where: {
        cycleId_employeeId: {
          cycleId: dto.cycleId,
          employeeId: dto.employeeId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('A review has already been initiated for this employee in this cycle');
    }

    // Auto-assign employee manager as reviewer if not specified
    let reviewerId = dto.reviewerId;
    if (!reviewerId) {
      const emp = await this.prisma.employee.findUnique({ where: { id: dto.employeeId } });
      reviewerId = emp?.managerId || undefined;
    }

    return this.prisma.performanceReview.create({
      data: {
        cycleId: dto.cycleId,
        employeeId: dto.employeeId,
        reviewerId,
        status: ReviewStatus.DRAFT as any,
      },
      include: { employee: true, reviewer: true, cycle: true },
    });
  }

  async submitSelfReview(reviewId: string, employeeId: string, dto: SubmitSelfReviewDto) {
    const review = await this.prisma.performanceReview.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Performance review not found');

    if (review.employeeId !== employeeId) {
      throw new ForbiddenException('Cannot submit self evaluation for another employee');
    }

    return this.prisma.performanceReview.update({
      where: { id: reviewId },
      data: {
        selfRating: dto.selfRating,
        selfAchievements: dto.selfAchievements,
        selfImprovements: dto.selfImprovements,
        status: ReviewStatus.SELF_REVIEW_SUBMITTED as any,
      },
    });
  }

  async submitManagerReview(reviewId: string, reviewerEmployeeId: string, dto: SubmitManagerReviewDto) {
    const review = await this.prisma.performanceReview.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Performance review not found');

    // Calculate final weighted score if not explicitly set
    let finalScore = dto.finalScore;
    if (!finalScore && review.selfRating) {
      finalScore = Number(((Number(review.selfRating) * 0.4) + (dto.managerRating * 0.6)).toFixed(2));
    } else if (!finalScore) {
      finalScore = dto.managerRating;
    }

    return this.prisma.performanceReview.update({
      where: { id: reviewId },
      data: {
        reviewerId: reviewerEmployeeId,
        managerRating: dto.managerRating,
        managerFeedback: dto.managerFeedback,
        finalScore,
        status: ReviewStatus.COMPLETED as any,
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Goals
  // ---------------------------------------------------------------------------

  async getGoals(employeeId?: string) {
    const where = employeeId ? { employeeId } : {};
    const goals = await this.prisma.goal.findMany({
      where,
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, employeeNumber: true, designation: { select: { title: true } } },
        },
      },
      orderBy: { targetDate: 'asc' },
    });

    return goals.map((g) => {
      let category = 'Operational Target';
      let cleanDescription = g.description;
      if (g.description && g.description.startsWith('[') && g.description.includes(']')) {
        const endBracket = g.description.indexOf(']');
        category = g.description.substring(1, endBracket);
        cleanDescription = g.description.substring(endBracket + 1).trim();
      }
      return {
        ...g,
        category,
        description: cleanDescription,
      };
    });
  }

  async createGoal(employeeId: string, dto: CreateGoalDto) {
    let finalDescription = dto.description;
    if (dto.category) {
      finalDescription = `[${dto.category}] ${dto.description || ''}`.trim();
    }
    return this.prisma.goal.create({
      data: {
        employeeId: dto.employeeId || employeeId,
        title: dto.title,
        description: finalDescription,
        targetDate: new Date(dto.targetDate),
        progress: dto.progress !== undefined ? dto.progress : 0,
        status: (dto.status as any) || 'NOT_STARTED',
      },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, employeeNumber: true },
        },
      },
    });
  }

  async updateGoal(id: string, employeeId: string, dto: UpdateGoalDto) {
    const goal = await this.prisma.goal.findUnique({ where: { id } });
    if (!goal) throw new NotFoundException('Goal not found');

    if (goal.employeeId !== employeeId) {
      throw new ForbiddenException('Cannot update another employee goal');
    }

    let status = dto.status as any;
    if (dto.progress !== undefined && dto.progress >= 100) {
      status = 'COMPLETED';
    }

    return this.prisma.goal.update({
      where: { id },
      data: {
        progress: dto.progress,
        status,
        description: dto.description,
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Feedback
  // ---------------------------------------------------------------------------

  async getFeedback(recipientId: string) {
    return this.prisma.feedback.findMany({
      where: { recipientId },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, employeeNumber: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async submitFeedback(senderId: string, dto: SubmitFeedbackDto) {
    return this.prisma.feedback.create({
      data: {
        senderId,
        recipientId: dto.recipientId,
        type: dto.type as any,
        comments: dto.comments,
        rating: dto.rating,
      },
    });
  }
}
