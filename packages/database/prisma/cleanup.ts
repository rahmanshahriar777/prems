import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Starting dummy data cleanup...\n');

  // 1. Performance & Professional Development
  console.log('🗑️  Clearing Performance & Professional Development...');
  await prisma.feedback.deleteMany({});
  await prisma.goal.deleteMany({});
  await prisma.performanceReview.deleteMany({});
  await prisma.performanceReviewCycle.deleteMany({});
  console.log('   ✅ Feedback, Goals, Reviews, Cycles cleared');

  // 2. Compensation & Payroll Runs
  console.log('🗑️  Clearing Compensation & Payroll Runs...');
  await prisma.payslip.deleteMany({});
  await prisma.payrollRun.deleteMany({});
  await prisma.employeeSalaryStructure.deleteMany({});
  await prisma.salaryComponent.deleteMany({});
  await prisma.salaryStructure.deleteMany({});
  console.log('   ✅ Payslips, Payroll Runs, Salary Structures cleared');

  // 3. Paid Time Off & Leaves
  console.log('🗑️  Clearing Paid Time Off & Leaves...');
  await prisma.leaveApproval.deleteMany({});
  await prisma.leaveRequest.deleteMany({});
  await prisma.leaveBalance.deleteMany({});
  await prisma.leaveType.deleteMany({});
  await prisma.holiday.deleteMany({});
  console.log('   ✅ Leave Approvals, Requests, Balances, Types, Holidays cleared');

  // 4. Daily Attendance Tracker
  console.log('🗑️  Clearing Daily Attendance Tracker...');
  await prisma.attendanceRecord.deleteMany({});
  await prisma.shift.deleteMany({});
  console.log('   ✅ Attendance Records and Shifts cleared');

  // 5. Employees (non-superadmin), Employment History, Documents
  console.log('🗑️  Clearing dummy Employees...');
  await prisma.document.deleteMany({});
  await prisma.employeeEmploymentHistory.deleteMany({});
  // Delete all employees except the superadmin's linked employee (if any)
  const superadminUser = await prisma.user.findUnique({ where: { email: 'superadmin@ems.local' } });
  await prisma.employee.deleteMany({
    where: {
      userId: {
        not: superadminUser?.id ?? undefined,
      },
    },
  });
  // Also delete the superadmin's employee record if it exists (it's dummy data too)
  if (superadminUser) {
    await prisma.employee.deleteMany({ where: { userId: superadminUser.id } });
  }
  console.log('   ✅ Employees cleared');

  // 6. Organizational Departments & Designations
  console.log('🗑️  Clearing Organizational Departments & Designations...');
  await prisma.designation.deleteMany({});
  await prisma.department.deleteMany({});
  console.log('   ✅ Designations and Departments cleared');

  // 7. System Compliance & Audit Trail
  console.log('🗑️  Clearing System Compliance & Audit Trail...');
  await prisma.auditLog.deleteMany({});
  await prisma.loginAuditLog.deleteMany({});
  console.log('   ✅ Audit Logs and Login Audit Logs cleared');

  // 8. Notifications
  await prisma.notification.deleteMany({});
  console.log('   ✅ Notifications cleared');

  console.log('\n🎉 Cleanup complete! The following core data was preserved:');
  const userCount = await prisma.user.count();
  const roleCount = await prisma.role.count();
  const permCount = await prisma.permission.count();
  console.log(`   👤 Users: ${userCount} (superadmin preserved)`);
  console.log(`   🔐 Roles: ${roleCount}`);
  console.log(`   🛡️  Permissions: ${permCount}`);
}

main()
  .catch((e) => {
    console.error('❌ Cleanup failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
