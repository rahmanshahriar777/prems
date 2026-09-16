import { PrismaClient, SystemRole, EmploymentStatus, Gender, AttendanceStatus, LeaveStatus, LeaveTypeEnum, PayrollStatus, SalaryComponentType, CalculationType, ReviewStatus, GoalStatus, AuditAction } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

// Deterministic PBKDF2 hash for demo accounts: Password123!
function hashPassword(password: string): string {
  const salt = 'ems_demo_static_salt_for_seeding_123';
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `pbkdf2$100000$${salt}$${hash}`;
}

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Roles
  const rolesData = [
    { name: SystemRole.SUPER_ADMIN, description: 'Super Administrator with unrestricted access', isSystem: true },
    { name: SystemRole.HR_ADMIN, description: 'HR Administrator managing employee lifecycles and records', isSystem: true },
    { name: SystemRole.MANAGER, description: 'Team Manager approving leaves and conducting reviews', isSystem: true },
    { name: SystemRole.EMPLOYEE, description: 'Standard Employee with personal access', isSystem: true },
    { name: SystemRole.AUDITOR, description: 'Auditor with read-only compliance and audit log access', isSystem: true },
  ];

  const roles: Record<string, any> = {};
  for (const r of rolesData) {
    roles[r.name] = await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: r,
    });
  }
  console.log(`✅ Roles seeded (${Object.keys(roles).length})`);

  // 2. Permissions
  const subjects = ['USER', 'EMPLOYEE', 'DEPARTMENT', 'DESIGNATION', 'ATTENDANCE', 'LEAVE', 'PAYROLL', 'PERFORMANCE', 'AUDIT_LOG', 'DOCUMENT'];
  const actions = ['CREATE', 'READ', 'UPDATE', 'DELETE', 'MANAGE', 'APPROVE'];

  for (const subject of subjects) {
    for (const action of actions) {
      await prisma.permission.upsert({
        where: { action_subject: { action, subject } },
        update: {},
        create: {
          action,
          subject,
          description: `Permission to ${action} ${subject}`,
        },
      });
    }
  }
  console.log('✅ Permissions seeded');

  // 3. Departments
  const deptEngineering = await prisma.department.upsert({
    where: { code: 'ENG' },
    update: {},
    create: { name: 'Engineering', code: 'ENG', description: 'Software Development & Platform Engineering' },
  });

  const deptHr = await prisma.department.upsert({
    where: { code: 'HR' },
    update: {},
    create: { name: 'Human Resources', code: 'HR', description: 'Talent Acquisition & Employee Operations' },
  });


  const deptFinance = await prisma.department.upsert({
    where: { code: 'FIN' },
    update: {},
    create: { name: 'Finance & Accounting', code: 'FIN', description: 'Financial Planning & Payroll Operations' },
  });

  const deptMarketing = await prisma.department.upsert({
    where: { code: 'MKT' },
    update: {},
    create: { name: 'Marketing', code: 'MKT', description: 'Brand Strategy, Public Relations and Growth Marketing' },
  });

  const deptLegal = await prisma.department.upsert({
    where: { code: 'LGL' },
    update: {},
    create: { name: 'Legal', code: 'LGL', description: 'Corporate Governance, Contracts and Regulatory Compliance' },
  });
  console.log('✅ Departments seeded');

  // 4. Designations
  const desigVpEng = await prisma.designation.upsert({
    where: { code: 'VP_ENG' },
    update: {},
    create: { title: 'VP of Engineering', code: 'VP_ENG', level: 6, departmentId: deptEngineering.id },
  });

  const desigSrEng = await prisma.designation.upsert({
    where: { code: 'SR_ENG' },
    update: {},
    create: { title: 'Senior Software Engineer', code: 'SR_ENG', level: 4, departmentId: deptEngineering.id },
  });

  const desigHrMgr = await prisma.designation.upsert({
    where: { code: 'HR_MGR' },
    update: {},
    create: { title: 'HR Operations Manager', code: 'HR_MGR', level: 5, departmentId: deptHr.id },
  });

  console.log('✅ Designations seeded');

  // 5. Users and Employees
  const demoPasswordHash = hashPassword('Password123!');

  // Super Admin
  const adminUser = await prisma.user.upsert({
    where: { email: 'superadmin@ems.local' },
    update: { passwordHash: demoPasswordHash },
    create: {
      email: 'superadmin@ems.local',
      passwordHash: demoPasswordHash,
      roles: { create: { roleId: roles[SystemRole.SUPER_ADMIN].id } },
    },
  });

  await prisma.employee.upsert({
    where: { email: 'superadmin@ems.local' },
    update: {},
    create: {
      employeeNumber: 'EMP-2026-0001',
      userId: adminUser.id,
      firstName: 'System',
      lastName: 'Administrator',
      email: 'superadmin@ems.local',
      phone: '+1 (555) 010-0001',
      departmentId: deptEngineering.id,
      designationId: desigVpEng.id,
      status: EmploymentStatus.FULL_TIME,
      joiningDate: new Date('2024-01-01'),
      profileSummary: 'Principal enterprise platform architect and super administrator.',
    },
  });

  // HR Admin
  const hrUser = await prisma.user.upsert({
    where: { email: 'hradmin@ems.local' },
    update: { passwordHash: demoPasswordHash },
    create: {
      email: 'hradmin@ems.local',
      passwordHash: demoPasswordHash,
      roles: { create: { roleId: roles[SystemRole.HR_ADMIN].id } },
    },
  });

  await prisma.employee.upsert({
    where: { email: 'hradmin@ems.local' },
    update: {},
    create: {
      employeeNumber: 'EMP-2026-0002',
      userId: hrUser.id,
      firstName: 'HR',
      lastName: 'Manager',
      email: 'hradmin@ems.local',
      phone: '+880 1711-000002',
      departmentId: deptHr.id,
      designationId: desigHrMgr.id,
      status: EmploymentStatus.FULL_TIME,
      joiningDate: new Date('2024-02-15'),
      profileSummary: 'Director of People and Human Resources operations.',
    },
  });

  // Manager
  const mgrUser = await prisma.user.upsert({
    where: { email: 'manager@ems.local' },
    update: { passwordHash: demoPasswordHash },
    create: {
      email: 'manager@ems.local',
      passwordHash: demoPasswordHash,
      roles: { create: { roleId: roles[SystemRole.MANAGER].id } },
    },
  });

  const managerEmployee = await prisma.employee.upsert({
    where: { email: 'manager@ems.local' },
    update: {},
    create: {
      employeeNumber: 'EMP-2026-0003',
      userId: mgrUser.id,
      firstName: 'Shahriar',
      lastName: 'Rahman',
      email: 'manager@ems.local',
      phone: '+880 1711-000003',
      departmentId: deptEngineering.id,
      designationId: desigVpEng.id,
      status: EmploymentStatus.FULL_TIME,
      joiningDate: new Date('2024-03-01'),
      profileSummary: 'Engineering Team Lead overseeing backend and cloud platform services.',
    },
  });

  // Team Employees
  const empUser = await prisma.user.upsert({
    where: { email: 'sadia.rahman@ems.local' },
    update: { passwordHash: demoPasswordHash },
    create: {
      email: 'sadia.rahman@ems.local',
      passwordHash: demoPasswordHash,
      roles: { create: { roleId: roles[SystemRole.EMPLOYEE].id } },
    },
  });

  const sadiaEmployee = await prisma.employee.upsert({
    where: { email: 'sadia.rahman@ems.local' },
    update: {},
    create: {
      employeeNumber: 'EMP-2026-0004',
      userId: empUser.id,
      firstName: 'Sadia',
      lastName: 'Rahman',
      email: 'sadia.rahman@ems.local',
      phone: '+880 1711-000004',
      departmentId: deptEngineering.id,
      designationId: desigSrEng.id,
      managerId: managerEmployee.id,
      status: EmploymentStatus.FULL_TIME,
      gender: Gender.FEMALE,
      joiningDate: new Date('2024-06-01'),
      profileSummary: 'Full-stack TypeScript developer specializing in distributed microservices and Next.js.',
    },
  });

  console.log('✅ Users & Employees seeded');

  // 6. Shifts
  const defaultShift = await prisma.shift.upsert({
    where: { id: 'default-shift-id' },
    update: {},
    create: {
      id: 'default-shift-id',
      name: 'Standard Morning Shift',
      startTime: '09:00',
      endTime: '18:00',
      gracePeriodMinutes: 15,
      isDefault: true,
    },
  });
  console.log('✅ Shifts seeded');

  // 7. Leave Types
  const leaveTypesData = [
    { name: 'Annual Paid Leave', code: 'ANNUAL', type: LeaveTypeEnum.ANNUAL, defaultDaysPerYear: 20, isPaid: true },
    { name: 'Sick Leave', code: 'SICK', type: LeaveTypeEnum.SICK, defaultDaysPerYear: 10, isPaid: true },
    { name: 'Casual Leave', code: 'CASUAL', type: LeaveTypeEnum.CASUAL, defaultDaysPerYear: 5, isPaid: true },
    { name: 'Unpaid Leave', code: 'UNPAID', type: LeaveTypeEnum.UNPAID, defaultDaysPerYear: 30, isPaid: false },
  ];

  const leaveTypes: Record<string, any> = {};
  for (const lt of leaveTypesData) {
    leaveTypes[lt.code] = await prisma.leaveType.upsert({
      where: { code: lt.code },
      update: {},
      create: lt,
    });
  }

  // Seed Leave Balance for Sadia Rahman
  await prisma.leaveBalance.upsert({
    where: {
      employeeId_leaveTypeId_year: {
        employeeId: sadiaEmployee.id,
        leaveTypeId: leaveTypes['ANNUAL'].id,
        year: 2026,
      },
    },
    update: {},
    create: {
      employeeId: sadiaEmployee.id,
      leaveTypeId: leaveTypes['ANNUAL'].id,
      year: 2026,
      allocatedDays: 20,
      usedDays: 3,
      pendingDays: 0,
      remainingDays: 17,
    },
  });

  // Seed Leave Request
  await prisma.leaveRequest.create({
    data: {
      employeeId: sadiaEmployee.id,
      leaveTypeId: leaveTypes['ANNUAL'].id,
      startDate: new Date('2026-09-20'),
      endDate: new Date('2026-09-22'),
      totalDays: 3,
      reason: 'Attending tech architecture summit and personal family event.',
      status: LeaveStatus.PENDING,
    },
  });
  console.log('✅ Leave types, balances, and sample request seeded');

  // 8. Attendance Record
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.attendanceRecord.upsert({
    where: {
      employeeId_date: {
        employeeId: sadiaEmployee.id,
        date: today,
      },
    },
    update: {},
    create: {
      employeeId: sadiaEmployee.id,
      date: today,
      clockInTime: new Date(new Date().setHours(9, 2, 0, 0)),
      clockOutTime: new Date(new Date().setHours(18, 5, 0, 0)),
      totalHoursWorked: 9.05,
      status: AttendanceStatus.PRESENT,
      shiftId: defaultShift.id,
      notes: 'On time. Completed Phase 1-6 testing sprint.',
    },
  });
  console.log('✅ Attendance record seeded');

  // 9. Salary Structure & Payroll
  const standardSalaryStructure = await prisma.salaryStructure.upsert({
    where: { id: 'standard-tech-structure' },
    update: {},
    create: {
      id: 'standard-tech-structure',
      name: 'Senior Engineering Salary Grade',
      description: 'Standard compensation structure with basic, HRA, and tax deductions',
      currency: 'BDT',
      isDefault: true,
      components: {
        create: [
          { name: 'Basic Pay', type: SalaryComponentType.EARNING, calculationType: CalculationType.PERCENTAGE_OF_GROSS, value: 50, isTaxable: true },
          { name: 'House Rent Allowance (HRA)', type: SalaryComponentType.EARNING, calculationType: CalculationType.PERCENTAGE_OF_BASIC, value: 40, isTaxable: true },
          { name: 'Medical & Transit Allowance', type: SalaryComponentType.EARNING, calculationType: CalculationType.FIXED, value: 500, isTaxable: false },
          { name: 'Income Tax (Estimated)', type: SalaryComponentType.DEDUCTION, calculationType: CalculationType.PERCENTAGE_OF_GROSS, value: 15, isTaxable: false },
        ],
      },
    },
  });

  await prisma.employeeSalaryStructure.upsert({
    where: { id: 'sadia-salary-assignment' },
    update: {},
    create: {
      id: 'sadia-salary-assignment',
      employeeId: sadiaEmployee.id,
      salaryStructureId: standardSalaryStructure.id,
      baseSalary: 9500.0,
      effectiveFrom: new Date('2024-06-01'),
      isActive: true,
    },
  });

  const payrollRun = await prisma.payrollRun.upsert({
    where: {
      month_year_departmentId: {
        month: 8,
        year: 2026,
        departmentId: deptEngineering.id,
      },
    },
    update: {},
    create: {
      month: 8,
      year: 2026,
      departmentId: deptEngineering.id,
      status: PayrollStatus.APPROVED,
      totalGross: 9500.0,
      totalNet: 8075.0,
      totalDeductions: 1425.0,
      processedAt: new Date('2026-08-31'),
      approvedAt: new Date('2026-08-31'),
      approvedBy: 'superadmin@ems.local',
    },
  });

  await prisma.payslip.upsert({
    where: {
      payrollRunId_employeeId: {
        payrollRunId: payrollRun.id,
        employeeId: sadiaEmployee.id,
      },
    },
    update: {},
    create: {
      payrollRunId: payrollRun.id,
      employeeId: sadiaEmployee.id,
      grossPay: 9500.0,
      totalDeductions: 1425.0,
      netPay: 8075.0,
      status: PayrollStatus.PAID,
      disbursementDate: new Date('2026-08-31'),
      breakdown: [
        { component: 'Basic Pay', type: 'EARNING', amount: 4750.0 },
        { component: 'House Rent Allowance (HRA)', type: 'EARNING', amount: 1900.0 },
        { component: 'Medical & Transit Allowance', type: 'EARNING', amount: 500.0 },
        { component: 'Special Performance Allowance', type: 'EARNING', amount: 2350.0 },
        { component: 'Income Tax (Estimated)', type: 'DEDUCTION', amount: 1425.0 },
      ],
    },
  });
  console.log('✅ Salary structure, payroll run, and payslip seeded');

  // 10. Performance Review Cycle & Goal
  const reviewCycle = await prisma.performanceReviewCycle.upsert({
    where: { id: 'cycle-h2-2026' },
    update: {},
    create: {
      id: 'cycle-h2-2026',
      title: 'H2 2026 Company Performance Appraisal Cycle',
      startDate: new Date('2026-07-01'),
      endDate: new Date('2026-12-31'),
      description: 'Mid-year and end-of-year engineering deliverable and leadership assessment.',
      isActive: true,
    },
  });

  await prisma.goal.create({
    data: {
      employeeId: sadiaEmployee.id,
      title: 'Architect Next-Gen NEO Employee Management Monorepo',
      description: 'Deliver production-ready TypeScript monorepo with Turborepo, NestJS, Next.js, and enterprise workforce management.',
      targetDate: new Date('2026-10-31'),
      progress: 85,
      status: GoalStatus.IN_PROGRESS,
    },
  });

  await prisma.performanceReview.upsert({
    where: {
      cycleId_employeeId: {
        cycleId: reviewCycle.id,
        employeeId: sadiaEmployee.id,
      },
    },
    update: {},
    create: {
      cycleId: reviewCycle.id,
      employeeId: sadiaEmployee.id,
      reviewerId: managerEmployee.id,
      selfRating: 4.8,
      selfAchievements: 'Designed and implemented end-to-end full-stack modules across Auth, Employee, Leave, and Performance.',
      selfImprovements: 'Expand automated Kubernetes chaos engineering tests.',
      managerRating: 4.9,
      managerFeedback: 'Exceptional architectural delivery. Code quality and documentation meet highest enterprise standards.',
      finalScore: 4.85,
      status: ReviewStatus.COMPLETED,
    },
  });
  console.log('✅ Performance cycle, goal, and review seeded');

  // 11. Audit Log
  await prisma.auditLog.create({
    data: {
      actorId: adminUser.id,
      actorEmail: 'superadmin@ems.local',
      action: AuditAction.CREATE,
      entityType: 'SYSTEM_BOOTSTRAP',
      entityId: 'ROOT',
      afterState: { status: 'INITIAL_SEED_COMPLETE', timestamp: new Date().toISOString() },
      ipAddress: '127.0.0.1',
    },
  });
  console.log('✅ System audit log seeded');

  console.log('🎉 Database seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
