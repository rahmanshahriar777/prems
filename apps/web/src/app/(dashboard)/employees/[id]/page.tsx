'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Briefcase,
  UserCheck,
  Calendar,
  Banknote,
  Clock,
  CalendarDays,
  ShieldCheck,
  Camera,
} from 'lucide-react';
import { DashboardLayout } from '../../../../components/layout/dashboard-layout';
import { api } from '../../../../lib/api-client';
import { useAuth } from '../../../../context/auth-context';
import { AvatarModal } from '../../../../components/profile/avatar-modal';
import { SystemRole } from '@ems/shared';

export default function EmployeeDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { user, hasRole } = useAuth();
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get(`/employees/${id}`)
      .then((data) => setEmployee(data))
      .catch(() => {
        // Mock fallback for demonstration
        setEmployee({
          id,
          employeeNumber: 'EMP-2026-0004',
          firstName: 'Sadia',
          lastName: 'Rahman',
          email: 'sadia.rahman@ems.local',
          phone: '+880 1711-000004',
          joiningDate: '2024-06-01',
          status: 'FULL_TIME',
          profileSummary: 'Senior full-stack TypeScript architect and microservices contributor.',
          department: { name: 'Engineering', code: 'ENG' },
          designation: { title: 'Senior Software Engineer', level: 4 },
          manager: { firstName: 'Shahriar', lastName: 'Rahman', email: 'manager@ems.local' },
          salaryStructures: [
            {
              baseSalary: 9500.0,
              effectiveFrom: '2024-06-01',
              salaryStructure: { name: 'Senior Engineering Salary Grade' },
            },
          ],
          leaveBalances: [
            { leaveType: { name: 'Annual Leave' }, remainingDays: 17, allocatedDays: 20 },
            { leaveType: { name: 'Sick Leave' }, remainingDays: 10, allocatedDays: 10 },
          ],
        });
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout title="Employee Profile">
        <div className="py-20 text-center text-slate-500 font-mono text-xs">
          Loading employee profile...
        </div>
      </DashboardLayout>
    );
  }

  if (!employee) {
    return (
      <DashboardLayout title="Employee Not Found">
        <div className="text-center py-16 space-y-3">
          <p className="text-sm text-slate-400">The requested employee profile does not exist.</p>
          <Link href="/employees" className="text-xs text-primary-400 hover:underline">
            ← Return to Directory
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`Employee: ${employee.firstName} ${employee.lastName}`}>
      <div className="space-y-6">
        {/* Back Link */}
        <Link
          href="/employees"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Directory</span>
        </Link>

        {/* Profile Header Hero */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative group shrink-0">
              {employee.avatarUrl ? (
                <img
                  src={employee.avatarUrl}
                  alt={`${employee.firstName} ${employee.lastName}`}
                  className="w-16 h-16 rounded-2xl object-cover border border-primary-500/40 shadow-glow"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary-600 to-cyan-500 flex items-center justify-center text-xl font-bold text-white shadow-glow">
                  {employee.firstName?.[0]}
                  {employee.lastName?.[0]}
                </div>
              )}

              {(user?.employeeId === employee.id ||
                user?.email === employee.email ||
                hasRole(SystemRole.SUPER_ADMIN, SystemRole.HR_ADMIN)) && (
                <button
                  type="button"
                  onClick={() => setIsAvatarModalOpen(true)}
                  title="Change profile picture"
                  className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white shadow-md transition hover:scale-110"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-100">
                  {employee.firstName} {employee.lastName}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold">
                  {employee.status}
                </span>
              </div>
              <p className="text-xs font-mono text-slate-400 mt-1">
                ID: {employee.employeeNumber} &bull; Joined{' '}
                {new Date(employee.joiningDate).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <div className="px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-2 text-slate-300">
              <Briefcase className="w-3.5 h-3.5 text-primary-400" />
              <span>{employee.designation?.title || 'Engineer'}</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-2 text-slate-300">
              <Building2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>{employee.department?.name || 'Department'}</span>
            </div>
          </div>
        </div>

        {/* Profile Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Contact & Bio */}
          <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-primary-400" />
              Contact & Overview
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-mono">Work Email</span>
                <span className="text-slate-200 font-mono">{employee.email}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-mono">Phone</span>
                <span className="text-slate-200">{employee.phone || 'Not provided'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-mono">Reports To</span>
                <span className="text-slate-200 font-medium">
                  {employee.manager ? `${employee.manager.firstName} ${employee.manager.lastName}` : 'Executive / None'}
                </span>
              </div>
              {employee.profileSummary && (
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-mono">Professional Summary</span>
                  <p className="text-slate-300 leading-relaxed mt-1">{employee.profileSummary}</p>
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Compensation Grade */}
          <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Banknote className="w-4 h-4 text-emerald-400" />
              Active Compensation
            </h3>

            {employee.salaryStructures?.[0] ? (
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-mono">Grade Plan</span>
                  <span className="text-slate-200 font-semibold">
                    {employee.salaryStructures[0].salaryStructure?.name || 'Standard Grade'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-mono">Monthly Base Salary</span>
                  <span className="text-lg font-bold text-emerald-400 font-mono">
                    BDT {Number(employee.salaryStructures[0].baseSalary).toLocaleString()} (Taka)
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-slate-400">
                  Detailed pay breakdowns and downloadable payslips are managed under the{' '}
                  <Link href="/payroll" className="text-primary-400 hover:underline">
                    Payroll Module
                  </Link>
                  .
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">No active salary structure assigned yet.</p>
            )}
          </div>

          {/* Column 3: Leave Balances */}
          <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-cyan-400" />
              Current Year Leave Entitlements
            </h3>

            <div className="space-y-2.5">
              {employee.leaveBalances && employee.leaveBalances.length > 0 ? (
                employee.leaveBalances.map((lb: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-slate-200">{lb.leaveType?.name || 'Leave'}</p>
                      <span className="text-[10px] text-slate-500 font-mono">Allocated: {lb.allocatedDays} days</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-300 font-bold font-mono">
                      {lb.remainingDays} days left
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500">Leave balances initialized upon first application.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <AvatarModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        onSuccess={(newAvatarUrl) => {
          setEmployee((prev: any) => ({
            ...prev,
            avatarUrl: newAvatarUrl,
          }));
        }}
      />
    </DashboardLayout>
  );
}
