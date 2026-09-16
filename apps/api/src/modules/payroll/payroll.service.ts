import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AuditService } from '../../core/audit/audit.service';
import {
  CreateSalaryStructureDto,
  AssignSalaryDto,
  CreatePayrollRunDto,
} from './dto/payroll.dto';
import {
  PayrollStatus,
  SalaryComponentType,
  AuditAction,
  CurrencyUtil,
} from '@ems/shared';

@Injectable()
export class PayrollService {
  private readonly logger = new Logger(PayrollService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ---------------------------------------------------------------------------
  // Salary Structures
  // ---------------------------------------------------------------------------

  async getSalaryStructures() {
    return this.prisma.salaryStructure.findMany({
      include: {
        components: true,
        _count: { select: { employees: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createSalaryStructure(dto: CreateSalaryStructureDto, actorId?: string, actorEmail?: string) {
    const structure = await this.prisma.salaryStructure.create({
      data: {
        name: dto.name,
        description: dto.description,
        currency: dto.currency || 'USD',
        components: {
          create: dto.components.map((c) => ({
            name: c.name,
            type: c.type as any,
            calculationType: c.calculationType as any,
            value: c.value,
            isTaxable: c.isTaxable ?? true,
          })),
        },
      },
      include: { components: true },
    });

    await this.audit.log({
      actorId,
      actorEmail,
      action: AuditAction.CREATE,
      entityType: 'SALARY_STRUCTURE',
      entityId: structure.id,
      afterState: structure,
    });

    return structure;
  }

  // ---------------------------------------------------------------------------
  // Employee Salary Assignment
  // ---------------------------------------------------------------------------

  async getEmployeeSalary(employeeId: string) {
    const assignment = await this.prisma.employeeSalaryStructure.findFirst({
      where: { employeeId, isActive: true },
      include: {
        salaryStructure: {
          include: { components: true },
        },
      },
      orderBy: { effectiveFrom: 'desc' },
    });

    if (!assignment) {
      throw new NotFoundException(`No active salary structure found for employee #${employeeId}`);
    }

    return assignment;
  }

  async assignSalary(dto: AssignSalaryDto, actorId?: string, actorEmail?: string) {
    return this.prisma.$transaction(async (tx) => {
      // Deactivate previous active structures
      await tx.employeeSalaryStructure.updateMany({
        where: { employeeId: dto.employeeId, isActive: true },
        data: { isActive: false },
      });

      const newAssignment = await tx.employeeSalaryStructure.create({
        data: {
          employeeId: dto.employeeId,
          salaryStructureId: dto.salaryStructureId,
          baseSalary: dto.baseSalary,
          effectiveFrom: new Date(dto.effectiveFrom),
          isActive: true,
        },
        include: { salaryStructure: { include: { components: true } } },
      });

      await this.audit.log({
        actorId,
        actorEmail,
        action: AuditAction.UPDATE,
        entityType: 'EMPLOYEE_SALARY',
        entityId: dto.employeeId,
        afterState: newAssignment,
      });

      return newAssignment;
    });
  }

  // ---------------------------------------------------------------------------
  // Payroll Runs & Payslips
  // ---------------------------------------------------------------------------

  async getPayrollRuns() {
    return this.prisma.payrollRun.findMany({
      include: {
        department: true,
        _count: { select: { payslips: true } },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }

  async getPayrollRunById(id: string) {
    const run = await this.prisma.payrollRun.findUnique({
      where: { id },
      include: {
        department: true,
        payslips: {
          include: {
            employee: {
              select: { id: true, firstName: true, lastName: true, employeeNumber: true, email: true },
            },
          },
        },
      },
    });

    if (!run) {
      throw new NotFoundException(`Payroll run #${id} not found`);
    }

    return run;
  }

  async createPayrollRun(dto: CreatePayrollRunDto, actorId?: string, actorEmail?: string) {
    // Idempotency: Check if run already exists
    const existing = await this.prisma.payrollRun.findFirst({
      where: {
        month: dto.month,
        year: dto.year,
        departmentId: dto.departmentId || null,
      },
    });

    if (existing) {
      throw new ConflictException(
        `Payroll run for period ${dto.month}/${dto.year} already exists with status ${existing.status}`,
      );
    }

    // Fetch active employees eligible for payroll
    let employees = await this.prisma.employee.findMany({
      where: {
        deletedAt: null,
        status: 'FULL_TIME',
        ...(dto.departmentId && { departmentId: dto.departmentId }),
        salaryStructures: {
          some: { isActive: true },
        },
      },
      include: {
        salaryStructures: {
          where: { isActive: true },
          include: { salaryStructure: { include: { components: true } } },
        },
      },
    });

    if (employees.length === 0) {
      const unassignedEmployees = await this.prisma.employee.findMany({
        where: {
          deletedAt: null,
          ...(dto.departmentId && { departmentId: dto.departmentId }),
        },
      });

      if (unassignedEmployees.length > 0) {
        const defaultStructure =
          (await this.prisma.salaryStructure.findFirst({
            where: { isDefault: true },
            include: { components: true },
          })) ||
          (await this.prisma.salaryStructure.findFirst({
            include: { components: true },
          }));

        if (defaultStructure) {
          for (const emp of unassignedEmployees) {
            await this.prisma.employeeSalaryStructure.create({
              data: {
                employeeId: emp.id,
                salaryStructureId: defaultStructure.id,
                baseSalary: 5000,
                effectiveFrom: new Date(),
                isActive: true,
              },
            });
          }

          employees = await this.prisma.employee.findMany({
            where: {
              deletedAt: null,
              ...(dto.departmentId && { departmentId: dto.departmentId }),
              salaryStructures: {
                some: { isActive: true },
              },
            },
            include: {
              salaryStructures: {
                where: { isActive: true },
                include: { salaryStructure: { include: { components: true } } },
              },
            },
          });
        }
      }
    }

    if (employees.length === 0) {
      throw new BadRequestException(
        'No active employees found in the directory for this payroll cycle. Please onboard an employee first.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      let totalGrossCents = 0;
      let totalDeductionsCents = 0;
      let totalNetCents = 0;

      const payslipData: any[] = [];

      for (const emp of employees) {
        const activeAssignment = emp.salaryStructures[0];
        const baseSalary = Number(activeAssignment.baseSalary);
        const components = activeAssignment.salaryStructure.components;

        let empGrossCents = CurrencyUtil.toMinorUnits(baseSalary);
        let empDeductionsCents = 0;

        const breakdown: any[] = [
          { component: 'Base Salary', type: 'EARNING', amount: baseSalary },
        ];

        for (const comp of components) {
          const compValue = Number(comp.value);
          const amount = CurrencyUtil.calculateComponent(baseSalary, comp.calculationType, compValue);
          const amountCents = CurrencyUtil.toMinorUnits(amount);

          if (comp.type === SalaryComponentType.EARNING) {
            empGrossCents += amountCents;
            breakdown.push({ component: comp.name, type: 'EARNING', amount });
          } else {
            empDeductionsCents += amountCents;
            breakdown.push({ component: comp.name, type: 'DEDUCTION', amount });
          }
        }

        const empNetCents = Math.max(0, empGrossCents - empDeductionsCents);

        totalGrossCents += empGrossCents;
        totalDeductionsCents += empDeductionsCents;
        totalNetCents += empNetCents;

        payslipData.push({
          employeeId: emp.id,
          grossPay: CurrencyUtil.fromMinorUnits(empGrossCents),
          totalDeductions: CurrencyUtil.fromMinorUnits(empDeductionsCents),
          netPay: CurrencyUtil.fromMinorUnits(empNetCents),
          breakdown,
          status: PayrollStatus.DRAFT,
        });
      }

      const run = await tx.payrollRun.create({
        data: {
          month: dto.month,
          year: dto.year,
          departmentId: dto.departmentId,
          status: PayrollStatus.DRAFT,
          totalGross: CurrencyUtil.fromMinorUnits(totalGrossCents),
          totalDeductions: CurrencyUtil.fromMinorUnits(totalDeductionsCents),
          totalNet: CurrencyUtil.fromMinorUnits(totalNetCents),
          processedAt: new Date(),
          payslips: {
            create: payslipData,
          },
        },
        include: { payslips: true },
      });

      await this.audit.log({
        actorId,
        actorEmail,
        action: AuditAction.RUN_PAYROLL,
        entityType: 'PAYROLL_RUN',
        entityId: run.id,
        afterState: { id: run.id, month: run.month, year: run.year, totalNet: run.totalNet },
      });

      return run;
    });
  }

  async approvePayrollRun(id: string, actorEmail: string, actorId?: string) {
    const run = await this.prisma.payrollRun.findUnique({ where: { id } });
    if (!run) throw new NotFoundException('Payroll run not found');

    if (run.status === PayrollStatus.APPROVED || run.status === PayrollStatus.PAID) {
      throw new BadRequestException(`Payroll run has already been ${run.status}`);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const approvedRun = await tx.payrollRun.update({
        where: { id },
        data: {
          status: PayrollStatus.APPROVED,
          approvedAt: new Date(),
          approvedBy: actorEmail,
        },
      });

      // Mark all associated payslips as APPROVED
      await tx.payslip.updateMany({
        where: { payrollRunId: id },
        data: { status: PayrollStatus.APPROVED, disbursementDate: new Date() },
      });

      return approvedRun;
    });

    await this.audit.log({
      actorId,
      actorEmail,
      action: AuditAction.APPROVE,
      entityType: 'PAYROLL_RUN',
      entityId: id,
      afterState: updated,
    });

    return updated;
  }

  async getPayslips(employeeId?: string, payrollRunId?: string) {
    return this.prisma.payslip.findMany({
      where: {
        ...(employeeId && { employeeId }),
        ...(payrollRunId && { payrollRunId }),
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeNumber: true,
            email: true,
            department: { select: { name: true } },
            designation: { select: { title: true } },
          },
        },
        payrollRun: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPayslipById(id: string) {
    const payslip = await this.prisma.payslip.findUnique({
      where: { id },
      include: {
        employee: {
          include: { department: true, designation: true },
        },
        payrollRun: true,
      },
    });

    if (!payslip) {
      throw new NotFoundException(`Payslip #${id} not found`);
    }

    return payslip;
  }
}
