'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Banknote,
  Calendar,
  CalendarDays,
  Building2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  FileText,
  Users,
  Info,
  UserPlus,
  Coins,
  Receipt,
} from 'lucide-react';
import { DashboardLayout } from '../../../../components/layout/dashboard-layout';
import { api } from '../../../../lib/api-client';
import { useAuth } from '../../../../context/auth-context';
import '../../../../styles/payroll.css';
import '../../../../styles/employees.css';

interface DepartmentOption {
  id: string;
  name: string;
  code: string;
}

interface EmployeeOption {
  id: string;
  firstName: string;
  lastName: string;
  employeeNumber?: string;
  departmentId?: string;
  status?: string;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export default function NewPayrollRunPage() {
  const router = useRouter();
  const { user } = useAuth();

  const currentDate = new Date();
  const [month, setMonth] = useState<number>(currentDate.getMonth() + 1);
  const [year, setYear] = useState<number>(currentDate.getFullYear());
  const [departmentId, setDepartmentId] = useState<string>('');
  const [disbursementDate, setDisbursementDate] = useState<string>(
    new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
      .toISOString()
      .split('T')[0]
  );
  const [remarks, setRemarks] = useState<string>(
    'Scheduled monthly payroll disbursement for active personnel.'
  );

  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchMeta = async () => {
      try {
        const [deptsRes, empsRes] = await Promise.all([
          api.get('/departments').catch(() => []),
          api.get('/employees', { params: { limit: 100 } }).catch(() => ({ items: [] })),
        ]);

        if (isMounted) {
          if (Array.isArray(deptsRes)) setDepartments(deptsRes);
          const empList = Array.isArray(empsRes?.items)
            ? empsRes.items
            : Array.isArray(empsRes)
            ? empsRes
            : [];
          setEmployees(empList);
        }
      } finally {
        if (isMounted) setLoadingMeta(false);
      }
    };

    fetchMeta();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter employees matching selected department if scoped
  const eligibleEmployees = useMemo(() => {
    if (!departmentId) return employees;
    return employees.filter((e) => e.departmentId === departmentId);
  }, [employees, departmentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (month < 1 || month > 12) {
      setErrorMsg('Please select a valid payroll month between 1 and 12.');
      return;
    }

    if (year < 2020 || year > 2100) {
      setErrorMsg('Please enter a valid fiscal year.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        month: Number(month),
        year: Number(year),
      };

      if (departmentId) {
        payload.departmentId = departmentId;
      }

      await api.post('/payroll/runs', payload);

      setSuccessMsg(
        `Payroll run for ${MONTH_NAMES[month - 1]} ${year} executed successfully! Redirecting to compensation dashboard...`
      );
      setTimeout(() => {
        router.push('/payroll');
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to execute payroll cycle. Please verify employee records and configuration.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="Run Payroll Cycle">
      <div className="payroll-editorial-wrapper">
        <div className="pay-page" style={{ maxWidth: '880px' }}>
          {/* Header & Back Link */}
          <div style={{ marginBottom: '24px' }}>
            <Link
              href="/payroll"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                color: 'var(--pay-text-secondary)',
                textDecoration: 'none',
                marginBottom: '16px',
                fontWeight: 500,
              }}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Compensation & Payroll Runs</span>
            </Link>

            <h1 className="pay-title">Run Payroll Cycle</h1>
            <p className="pay-subtitle">
              Configure disbursement period, target organizational division, and execute decimal-safe compensation calculation for Practical Roof Solutions Ltd.
            </p>
          </div>

          {/* Feedback Banners */}
          {errorMsg && (
            <div
              style={{
                background: 'var(--pay-rose-bg)',
                border: '1px solid var(--pay-rose)',
                borderRadius: 'var(--pay-radius-md)',
                padding: '14px 18px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: 'var(--pay-rose)',
                fontSize: '13.5px',
              }}
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div
              style={{
                background: 'var(--pay-positive-bg)',
                border: '1px solid var(--pay-positive)',
                borderRadius: 'var(--pay-radius-md)',
                padding: '14px 18px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: 'var(--pay-positive)',
                fontSize: '13.5px',
              }}
            >
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Card 1: Cycle Parameters & Period Schedule */}
            <div
              style={{
                background: 'var(--pay-surface)',
                border: '1px solid var(--pay-border)',
                borderRadius: 'var(--pay-radius-lg)',
                padding: '24px',
                marginBottom: '20px',
                boxShadow: 'var(--pay-shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--pay-radius-sm)',
                    background: 'var(--pay-accent-light)',
                    color: 'var(--pay-accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--pay-text-primary)' }}>
                    Cycle Parameters & Period Schedule
                  </h3>
                  <p style={{ fontSize: '12.5px', color: 'var(--pay-text-tertiary)' }}>
                    Specify the accounting month, calendar year, and organizational scope.
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--pay-text-secondary)', marginBottom: '6px' }}>
                    Financial Month <span style={{ color: 'var(--pay-rose)' }}>*</span>
                  </label>
                  <select
                    value={month}
                    onChange={(e) => setMonth(parseInt(e.target.value, 10))}
                    required
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      background: 'var(--pay-surface-muted)',
                      border: '1px solid var(--pay-border-subtle)',
                      borderRadius: 'var(--pay-radius-md)',
                      fontSize: '13px',
                      color: 'var(--pay-text-primary)',
                      outline: 'none',
                    }}
                  >
                    {MONTH_NAMES.map((mName, idx) => (
                      <option key={idx + 1} value={idx + 1}>
                        Month {idx + 1} — {mName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--pay-text-secondary)', marginBottom: '6px' }}>
                    Fiscal Year <span style={{ color: 'var(--pay-rose)' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min={2020}
                    max={2100}
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value, 10))}
                    required
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      background: 'var(--pay-surface-muted)',
                      border: '1px solid var(--pay-border-subtle)',
                      borderRadius: 'var(--pay-radius-md)',
                      fontSize: '13px',
                      color: 'var(--pay-text-primary)',
                      fontFamily: 'var(--pay-font-mono)',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--pay-text-secondary)', marginBottom: '6px' }}>
                    Target Department Scope
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Building2
                      className="w-4 h-4"
                      style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--pay-text-tertiary)',
                      }}
                    />
                    <select
                      value={departmentId}
                      onChange={(e) => setDepartmentId(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px 9px 36px',
                        background: 'var(--pay-surface-muted)',
                        border: '1px solid var(--pay-border-subtle)',
                        borderRadius: 'var(--pay-radius-md)',
                        fontSize: '13px',
                        color: 'var(--pay-text-primary)',
                        outline: 'none',
                      }}
                    >
                      <option value="">All Departments (Organization-wide)</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--pay-text-secondary)', marginBottom: '6px' }}>
                    Disbursement Date Target
                  </label>
                  <div style={{ position: 'relative' }}>
                    <CalendarDays
                      className="w-4 h-4"
                      style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--pay-text-tertiary)',
                      }}
                    />
                    <input
                      type="date"
                      value={disbursementDate}
                      onChange={(e) => setDisbursementDate(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px 9px 36px',
                        background: 'var(--pay-surface-muted)',
                        border: '1px solid var(--pay-border-subtle)',
                        borderRadius: 'var(--pay-radius-md)',
                        fontSize: '13px',
                        color: 'var(--pay-text-primary)',
                        fontFamily: 'var(--pay-font-mono)',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Workforce Scope & Eligibility Telemetry */}
            <div
              style={{
                background: 'var(--pay-surface)',
                border: '1px solid var(--pay-border)',
                borderRadius: 'var(--pay-radius-lg)',
                padding: '24px',
                marginBottom: '20px',
                boxShadow: 'var(--pay-shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--pay-radius-sm)',
                    background: 'var(--pay-accent-light)',
                    color: 'var(--pay-accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--pay-text-primary)' }}>
                    Workforce Eligibility & Telemetry
                  </h3>
                  <p style={{ fontSize: '12.5px', color: 'var(--pay-text-tertiary)' }}>
                    Telemetry on active personnel eligible for automated payroll calculation.
                  </p>
                </div>
              </div>

              {loadingMeta ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--pay-text-tertiary)', fontSize: '13px', padding: '12px 0' }}>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading personnel data...</span>
                </div>
              ) : employees.length === 0 ? (
                <div
                  style={{
                    padding: '16px 20px',
                    borderRadius: 'var(--pay-radius-md)',
                    background: 'var(--pay-warning-bg)',
                    border: '1px solid rgba(184, 134, 11, 0.3)',
                    color: 'var(--pay-warning)',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Info className="w-5 h-5 flex-shrink-0" />
                    <span>No employee records found in directory. Onboard personnel first before executing payroll runs.</span>
                  </div>
                  <Link
                    href="/employees/new"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 14px',
                      background: 'var(--pay-accent)',
                      color: '#ffffff',
                      borderRadius: 'var(--pay-radius-sm)',
                      fontSize: '12px',
                      fontWeight: 500,
                      textDecoration: 'none',
                    }}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Onboard Employee</span>
                  </Link>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                  <div
                    style={{
                      padding: '14px 16px',
                      background: 'var(--pay-surface-muted)',
                      border: '1px solid var(--pay-border-subtle)',
                      borderRadius: 'var(--pay-radius-md)',
                    }}
                  >
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--pay-text-tertiary)', fontFamily: 'var(--pay-font-mono)' }}>
                      Eligible Personnel
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--pay-text-primary)', marginTop: '4px' }}>
                      {eligibleEmployees.length} {eligibleEmployees.length === 1 ? 'Employee' : 'Employees'}
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--pay-positive)', marginTop: '2px' }}>
                      Active for disbursement
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '14px 16px',
                      background: 'var(--pay-surface-muted)',
                      border: '1px solid var(--pay-border-subtle)',
                      borderRadius: 'var(--pay-radius-md)',
                    }}
                  >
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--pay-text-tertiary)', fontFamily: 'var(--pay-font-mono)' }}>
                      Operating Currency
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--pay-text-primary)', marginTop: '4px' }}>
                      GBP (£)
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--pay-text-tertiary)', marginTop: '2px' }}>
                      Minor units decimal-safe
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '14px 16px',
                      background: 'var(--pay-surface-muted)',
                      border: '1px solid var(--pay-border-subtle)',
                      borderRadius: 'var(--pay-radius-md)',
                    }}
                  >
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--pay-text-tertiary)', fontFamily: 'var(--pay-font-mono)' }}>
                      Automated Tax Handling
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--pay-text-primary)', marginTop: '4px' }}>
                      Withholding Ready
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--pay-accent)', marginTop: '2px' }}>
                      Statutory tax & allowances
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Card 3: Audit Remarks & Cycle Authorization */}
            <div
              style={{
                background: 'var(--pay-surface)',
                border: '1px solid var(--pay-border)',
                borderRadius: 'var(--pay-radius-lg)',
                padding: '24px',
                marginBottom: '28px',
                boxShadow: 'var(--pay-shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--pay-radius-sm)',
                    background: 'var(--pay-accent-light)',
                    color: 'var(--pay-accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--pay-text-primary)' }}>
                    Audit Remarks & Authorization
                  </h3>
                  <p style={{ fontSize: '12.5px', color: 'var(--pay-text-tertiary)' }}>
                    Administrative notes appended to the immutable financial ledger.
                  </p>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--pay-text-secondary)', marginBottom: '6px' }}>
                  Disbursement Remarks & Accounting Notes
                </label>
                <textarea
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Record accounting context, budget approvals, or operational details for auditors..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'var(--pay-surface-muted)',
                    border: '1px solid var(--pay-border-subtle)',
                    borderRadius: 'var(--pay-radius-md)',
                    fontSize: '13px',
                    color: 'var(--pay-text-primary)',
                    outline: 'none',
                    resize: 'vertical',
                    lineHeight: '1.5',
                  }}
                />
              </div>

              <div
                style={{
                  background: 'var(--pay-surface-muted)',
                  border: '1px solid var(--pay-border-subtle)',
                  borderRadius: 'var(--pay-radius-md)',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '12.5px',
                }}
              >
                <span style={{ color: 'var(--pay-text-secondary)' }}>Authorized Signatory:</span>
                <span style={{ fontFamily: 'var(--pay-font-mono)', fontWeight: 600, color: 'var(--pay-text-primary)' }}>
                  {user?.email || 'superadmin@ems.local'} [SUPER_ADMIN]
                </span>
              </div>
            </div>

            {/* Actions Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '12px',
                paddingTop: '8px',
              }}
            >
              <Link
                href="/payroll"
                style={{
                  padding: '9px 20px',
                  background: 'var(--pay-surface)',
                  border: '1px solid var(--pay-border)',
                  borderRadius: 'var(--pay-radius-md)',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'var(--pay-text-secondary)',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={submitting || loadingMeta}
                className="pay-btn-primary"
                style={{
                  padding: '10px 24px',
                  fontSize: '13.5px',
                  opacity: submitting ? 0.75 : 1,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                }}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Executing Payroll Cycle...</span>
                  </>
                ) : (
                  <>
                    <Banknote className="w-4 h-4" />
                    <span>Execute Payroll Run</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
