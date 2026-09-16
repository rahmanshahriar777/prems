import { Job } from 'bullmq';
import { prisma, PayrollStatus } from '@ems/database';

export interface PayrollJobData {
  payrollRunId: string;
  month: number;
  year: number;
}

export async function processPayroll(job: Job<PayrollJobData>) {
  console.log(`[Worker:Payroll] Processing async payroll batch for run ${job.data.payrollRunId}`);

  await prisma.payrollRun.update({
    where: { id: job.data.payrollRunId },
    data: { status: PayrollStatus.PROCESSING },
  });

  // Simulation of background generation
  await new Promise((resolve) => setTimeout(resolve, 500));

  await prisma.payrollRun.update({
    where: { id: job.data.payrollRunId },
    data: { status: PayrollStatus.DRAFT },
  });

  console.log(`[Worker:Payroll] Finished batch calculation for run ${job.data.payrollRunId}`);
  return { success: true };
}
