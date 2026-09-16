import { Test, TestingModule } from '@nestjs/testing';
import { PayrollService } from './payroll.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AuditService } from '../../core/audit/audit.service';
import { ConflictException } from '@nestjs/common';
import { PayrollStatus } from '@ems/shared';

describe('PayrollService', () => {
  let service: PayrollService;
  let prismaService: any;
  let auditService: any;

  beforeEach(async () => {
    prismaService = {
      payrollRun: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      employee: {
        findMany: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(prismaService)),
    };

    auditService = {
      log: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayrollService,
        { provide: PrismaService, useValue: prismaService },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<PayrollService>(PayrollService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should prevent duplicate payroll runs for the same period (idempotency)', async () => {
    prismaService.payrollRun.findFirst.mockResolvedValue({
      id: 'existing-run',
      month: 9,
      year: 2026,
      status: PayrollStatus.DRAFT,
    });

    await expect(
      service.createPayrollRun({ month: 9, year: 2026 }),
    ).rejects.toThrow(ConflictException);
  });
});
