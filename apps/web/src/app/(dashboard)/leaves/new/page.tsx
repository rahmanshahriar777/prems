'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  CalendarDays,
  UserCheck,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  Plane,
  HeartPulse,
  Coffee,
  ShieldAlert,
  Info,
  Building2,
  Briefcase,
  UserPlus,
  Phone,
} from 'lucide-react';
import { DashboardLayout } from '../../../../components/layout/dashboard-layout';
import { api } from '../../../../lib/api-client';
import '../../../../styles/leaves.css';
import '../../../../styles/employees.css';

interface EmployeeOption {
  id: string;
  firstName: string;
  lastName: string;
  employeeNumber?: string;
  email?: string;
  department?: { name: string; code?: string };
  designation?: { title: string };
}

interface LeaveTypeOption {
  id: string;
  name: string;
  code: string;
  defaultDaysPerYear: number;
  isPaid: boolean;
  description?: string;
}

interface LeaveBalanceOption {
  id?: string;
  leaveTypeId: string;
  allocatedDays: number;
  remainingDays: number;
  usedDays: number;
  leaveType?: { name: string; code?: string };
}

export default function NewLeaveRequestPage() {
  const router = useRouter();

  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeOption[]>([]);
  const [balances, setBalances] = useState<LeaveBalanceOption[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // Form State
  const [formData, setFormData] = useState({
    employeeId: '',
    leaveTypeId: '',
    startDate: todayStr,
    endDate: todayStr,
    reason: '',
    relieverName: '',
    emergencyContact: '',
  });

  // Initial metadata fetch
  useEffect(() => {
    let isMounted = true;
    const fetchMetadata = async () => {
      try {
        const [empsRes, typesRes] = await Promise.all([
          api.get('/employees', { params: { limit: 100 } }).catch(() => ({ items: [] })),
          api.get('/leave-types').catch(() => []),
        ]);

        if (isMounted) {
          const empList = Array.isArray(empsRes?.items) ? empsRes.items : (Array.isArray(empsRes) ? empsRes : []);
          setEmployees(empList);

          const typesList = Array.isArray(typesRes) ? typesRes : [];
          setLeaveTypes(typesList);

          // Preselect first employee & leave type if available
          setFormData((prev) => ({
            ...prev,
            employeeId: empList.length > 0 ? empList[0].id : '',
            leaveTypeId: typesList.length > 0 ? typesList[0].id : '',
          }));
        }
      } finally {
        if (isMounted) setLoadingMeta(false);
      }
    };

    fetchMetadata();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch balances when employee changes
  useEffect(() => {
    if (!formData.employeeId) {
      setBalances([]);
      return;
    }

    let isMounted = true;
    setLoadingBalances(true);
    api
      .get('/leave-balances', { params: { employeeId: formData.employeeId } })
      .then((res) => {
        if (isMounted && Array.isArray(res)) {
          setBalances(res);
        }
      })
      .catch(() => {
        if (isMounted) setBalances([]);
      })
      .finally(() => {
        if (isMounted) setLoadingBalances(false);
      });

    return () => {
      isMounted = false;
    };
  }, [formData.employeeId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      // If start date moves past end date, align end date
      if (name === 'startDate' && next.endDate < value) {
        next.endDate = value;
      }
      return next;
    });
  };

  // Calculate inclusive duration in days
  const durationDays = useMemo(() => {
    if (!formData.startDate || !formData.endDate) return 0;
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return 0;
    const diff = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  }, [formData.startDate, formData.endDate]);

  // Find balance for selected leave type
  const selectedBalance = useMemo(() => {
    return balances.find((b) => b.leaveTypeId === formData.leaveTypeId);
  }, [balances, formData.leaveTypeId]);

  const selectedEmployee = useMemo(() => {
    return employees.find((e) => e.id === formData.employeeId);
  }, [employees, formData.employeeId]);

  const selectedLeaveType = useMemo(() => {
    return leaveTypes.find((t) => t.id === formData.leaveTypeId);
  }, [leaveTypes, formData.leaveTypeId]);

  const isBalanceExceeded = useMemo(() => {
    if (!selectedBalance) return false;
    return durationDays > selectedBalance.remainingDays;
  }, [selectedBalance, durationDays]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!formData.employeeId) {
      setErrorMsg('Please select an employee beneficiary for this leave request.');
      return;
    }
    if (!formData.leaveTypeId) {
      setErrorMsg('Please select a leave category.');
      return;
    }
    if (!formData.startDate || !formData.endDate) {
      setErrorMsg('Start date and end date are required.');
      return;
    }
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      setErrorMsg('End date cannot be earlier than start date.');
      return;
    }
    if (!formData.reason.trim()) {
      setErrorMsg('Please provide a reason or justification for this leave request.');
      return;
    }

    setSubmitting(true);
    try {
      let combinedReason = formData.reason.trim();
      const metaNotes: string[] = [];
      if (formData.relieverName.trim()) {
        metaNotes.push(`Handover Reliever: ${formData.relieverName.trim()}`);
      }
      if (formData.emergencyContact.trim()) {
        metaNotes.push(`Emergency Reachability: ${formData.emergencyContact.trim()}`);
      }
      if (metaNotes.length > 0) {
        combinedReason += `\n[${metaNotes.join(' | ')}]`;
      }

      await api.post('/leave-requests', {
        employeeId: formData.employeeId,
        leaveTypeId: formData.leaveTypeId,
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: combinedReason,
      });

      setSuccessMsg('Leave request submitted successfully. Redirecting to leaves dashboard...');
      setTimeout(() => {
        router.push('/leaves');
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit leave request. Please check entitlement balance or details.');
    } finally {
      setSubmitting(false);
    }
  };

  const getLeaveIcon = (name: string = '') => {
    const n = name.toUpperCase();
    if (n.includes('ANNUAL') || n.includes('PAID')) return Plane;
    if (n.includes('SICK') || n.includes('MEDICAL')) return HeartPulse;
    if (n.includes('CASUAL') || n.includes('PERSONAL')) return Coffee;
    return CalendarDays;
  };

  return (
    <DashboardLayout title="Request Leave">
      <div className="leaves-editorial-wrapper">
        <div className="leave-page" style={{ maxWidth: '880px' }}>
          {/* Header & Back Link */}
          <div style={{ marginBottom: '24px' }}>
            <Link
              href="/leaves"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                color: 'var(--leave-text-secondary)',
                textDecoration: 'none',
                marginBottom: '16px',
                fontWeight: 500,
              }}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Paid Time Off & Leaves</span>
            </Link>

            <h1 className="leave-title">Submit Leave Request</h1>
            <p className="leave-subtitle">
              Record personnel time off, medical absence, or statutory leave requests with organizational tracking for Practical Roof Solutions Ltd.
            </p>
          </div>

          {/* Feedback Banners */}
          {errorMsg && (
            <div
              style={{
                background: 'var(--leave-rose-bg)',
                border: '1px solid var(--leave-rose)',
                borderRadius: 'var(--leave-radius-md)',
                padding: '14px 18px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: 'var(--leave-rose)',
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
                background: 'var(--leave-positive-bg)',
                border: '1px solid var(--leave-positive)',
                borderRadius: 'var(--leave-radius-md)',
                padding: '14px 18px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: 'var(--leave-positive)',
                fontSize: '13.5px',
              }}
            >
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Card 1: Beneficiary Identification */}
            <div
              style={{
                background: 'var(--leave-surface)',
                border: '1px solid var(--leave-border)',
                borderRadius: 'var(--leave-radius-lg)',
                padding: '24px',
                marginBottom: '20px',
                boxShadow: 'var(--leave-shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--leave-radius-sm)',
                    background: 'var(--leave-accent-light)',
                    color: 'var(--leave-accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--leave-text-primary)' }}>
                    Beneficiary Identification
                  </h3>
                  <p style={{ fontSize: '12.5px', color: 'var(--leave-text-tertiary)' }}>
                    Select employee record for entitlement deduction and attendance reconciliation.
                  </p>
                </div>
              </div>

              {loadingMeta ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--leave-text-tertiary)', fontSize: '13px', padding: '16px 0' }}>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading workforce metadata...</span>
                </div>
              ) : employees.length === 0 ? (
                <div
                  style={{
                    padding: '20px',
                    borderRadius: 'var(--leave-radius-md)',
                    background: 'var(--leave-warning-bg)',
                    border: '1px solid rgba(184, 134, 11, 0.3)',
                    color: 'var(--leave-warning)',
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
                    <span>No employee profiles registered yet. Please onboard an employee first to submit leave requests.</span>
                  </div>
                  <Link
                    href="/employees/new"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 14px',
                      background: 'var(--leave-accent)',
                      color: '#ffffff',
                      borderRadius: 'var(--leave-radius-sm)',
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
                <div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--leave-text-secondary)', marginBottom: '6px' }}>
                      Employee Beneficiary <span style={{ color: 'var(--leave-rose)' }}>*</span>
                    </label>
                    <select
                      name="employeeId"
                      value={formData.employeeId}
                      onChange={handleChange}
                      required
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: 'var(--leave-surface-muted)',
                        border: '1px solid var(--leave-border-subtle)',
                        borderRadius: 'var(--leave-radius-md)',
                        fontSize: '13px',
                        color: 'var(--leave-text-primary)',
                        outline: 'none',
                      }}
                    >
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.employeeNumber ? `[${emp.employeeNumber}] ` : ''}
                          {emp.firstName} {emp.lastName}
                          {emp.department?.name ? ` — ${emp.department.name}` : ''}
                          {emp.designation?.title ? ` (${emp.designation.title})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Selected Employee Summary Card */}
                  {selectedEmployee && (
                    <div
                      style={{
                        background: 'var(--leave-surface-muted)',
                        border: '1px solid var(--leave-border-subtle)',
                        borderRadius: 'var(--leave-radius-md)',
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: 'var(--leave-accent)',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 600,
                            fontSize: '13px',
                          }}
                        >
                          {selectedEmployee.firstName[0]}
                          {selectedEmployee.lastName[0]}
                        </div>
                        <div>
                          <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--leave-text-primary)' }}>
                            {selectedEmployee.firstName} {selectedEmployee.lastName}
                          </div>
                          <div style={{ fontSize: '11.5px', color: 'var(--leave-text-tertiary)', fontFamily: 'var(--leave-font-mono)' }}>
                            {selectedEmployee.employeeNumber || 'ID Pending'} • {selectedEmployee.department?.name || 'Department Unassigned'}
                          </div>
                        </div>
                      </div>

                      {/* Entitlements preview */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        {loadingBalances ? (
                          <div style={{ fontSize: '12px', color: 'var(--leave-text-tertiary)' }}>Fetching balances...</div>
                        ) : balances.length === 0 ? (
                          <span style={{ fontSize: '11.5px', color: 'var(--leave-text-secondary)' }}>
                            Standard quota auto-activates upon application
                          </span>
                        ) : (
                          balances.map((b, idx) => (
                            <div
                              key={idx}
                              style={{
                                padding: '4px 8px',
                                borderRadius: 'var(--leave-radius-sm)',
                                background: b.remainingDays > 0 ? 'var(--leave-positive-bg)' : 'var(--leave-rose-bg)',
                                color: b.remainingDays > 0 ? 'var(--leave-positive)' : 'var(--leave-rose)',
                                fontSize: '11.5px',
                                fontFamily: 'var(--leave-font-mono)',
                                fontWeight: 500,
                              }}
                            >
                              {b.leaveType?.name || 'Leave'}: <strong>{b.remainingDays}d</strong> rem
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Card 2: Leave Classification & Schedule */}
            <div
              style={{
                background: 'var(--leave-surface)',
                border: '1px solid var(--leave-border)',
                borderRadius: 'var(--leave-radius-lg)',
                padding: '24px',
                marginBottom: '20px',
                boxShadow: 'var(--leave-shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--leave-radius-sm)',
                    background: 'var(--leave-accent-light)',
                    color: 'var(--leave-accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--leave-text-primary)' }}>
                    Leave Classification & Schedule
                  </h3>
                  <p style={{ fontSize: '12.5px', color: 'var(--leave-text-tertiary)' }}>
                    Define the category of absence, date parameters, and required duration.
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--leave-text-secondary)', marginBottom: '6px' }}>
                    Leave Category <span style={{ color: 'var(--leave-rose)' }}>*</span>
                  </label>
                  <select
                    name="leaveTypeId"
                    value={formData.leaveTypeId}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      background: 'var(--leave-surface-muted)',
                      border: '1px solid var(--leave-border-subtle)',
                      borderRadius: 'var(--leave-radius-md)',
                      fontSize: '13px',
                      color: 'var(--leave-text-primary)',
                      outline: 'none',
                    }}
                  >
                    {leaveTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name} ({type.defaultDaysPerYear}d / yr • {type.isPaid ? 'Paid' : 'Unpaid'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--leave-text-secondary)', marginBottom: '6px' }}>
                    Entitlement Telemetry
                  </label>
                  <div
                    style={{
                      padding: '9px 12px',
                      background: 'var(--leave-surface-muted)',
                      border: '1px solid var(--leave-border-subtle)',
                      borderRadius: 'var(--leave-radius-md)',
                      fontSize: '13px',
                      color: 'var(--leave-text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span style={{ fontSize: '12px', color: 'var(--leave-text-secondary)' }}>
                      {selectedLeaveType?.name || 'Category'} Balance:
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--leave-font-mono)',
                        fontWeight: 600,
                        color: selectedBalance && selectedBalance.remainingDays > 0 ? 'var(--leave-accent)' : 'var(--leave-rose)',
                      }}
                    >
                      {selectedBalance ? `${selectedBalance.remainingDays} Days Available` : `${selectedLeaveType?.defaultDaysPerYear || 0} Days Standard`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Date Pickers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--leave-text-secondary)', marginBottom: '6px' }}>
                    Start Date <span style={{ color: 'var(--leave-rose)' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <CalendarDays className="w-4 h-4" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--leave-text-tertiary)' }} />
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      required
                      style={{
                        width: '100%',
                        padding: '9px 12px 9px 36px',
                        background: 'var(--leave-surface-muted)',
                        border: '1px solid var(--leave-border-subtle)',
                        borderRadius: 'var(--leave-radius-md)',
                        fontSize: '13px',
                        color: 'var(--leave-text-primary)',
                        fontFamily: 'var(--leave-font-mono)',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--leave-text-secondary)', marginBottom: '6px' }}>
                    End Date <span style={{ color: 'var(--leave-rose)' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <CalendarDays className="w-4 h-4" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--leave-text-tertiary)' }} />
                    <input
                      type="date"
                      name="endDate"
                      min={formData.startDate}
                      value={formData.endDate}
                      onChange={handleChange}
                      required
                      style={{
                        width: '100%',
                        padding: '9px 12px 9px 36px',
                        background: 'var(--leave-surface-muted)',
                        border: '1px solid var(--leave-border-subtle)',
                        borderRadius: 'var(--leave-radius-md)',
                        fontSize: '13px',
                        color: 'var(--leave-text-primary)',
                        fontFamily: 'var(--leave-font-mono)',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Duration and Validation Notice */}
              <div
                style={{
                  background: isBalanceExceeded ? 'var(--leave-rose-bg)' : 'var(--leave-accent-light)',
                  border: `1px solid ${isBalanceExceeded ? 'var(--leave-rose)' : 'var(--leave-accent-muted)'}`,
                  borderRadius: 'var(--leave-radius-md)',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock className="w-4 h-4" style={{ color: isBalanceExceeded ? 'var(--leave-rose)' : 'var(--leave-accent)' }} />
                  <span style={{ fontSize: '13px', fontWeight: 500, color: isBalanceExceeded ? 'var(--leave-rose)' : 'var(--leave-accent)' }}>
                    Calculated Duration: <strong>{durationDays} {durationDays === 1 ? 'Day' : 'Days'}</strong>
                  </span>
                </div>

                {isBalanceExceeded ? (
                  <span style={{ fontSize: '12px', color: 'var(--leave-rose)', fontWeight: 500 }}>
                    Notice: Requested duration exceeds recorded entitlement balance ({selectedBalance?.remainingDays || 0}d available).
                  </span>
                ) : (
                  <span style={{ fontSize: '12px', color: 'var(--leave-accent)' }}>
                    Inclusive dates within standard operational window
                  </span>
                )}
              </div>
            </div>

            {/* Card 3: Absence Justification & Continuity */}
            <div
              style={{
                background: 'var(--leave-surface)',
                border: '1px solid var(--leave-border)',
                borderRadius: 'var(--leave-radius-lg)',
                padding: '24px',
                marginBottom: '28px',
                boxShadow: 'var(--leave-shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--leave-radius-sm)',
                    background: 'var(--leave-accent-light)',
                    color: 'var(--leave-accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--leave-text-primary)' }}>
                    Absence Justification & Continuity
                  </h3>
                  <p style={{ fontSize: '12.5px', color: 'var(--leave-text-tertiary)' }}>
                    Provide clear context for management review, project coverage, and emergency reachability.
                  </p>
                </div>
              </div>

              {/* Reason Textarea */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--leave-text-secondary)', marginBottom: '6px' }}>
                  Reason & Operational Scope <span style={{ color: 'var(--leave-rose)' }}>*</span>
                </label>
                <textarea
                  name="reason"
                  rows={4}
                  value={formData.reason}
                  onChange={handleChange}
                  placeholder="State the purpose of time off (e.g. Scheduled annual holiday, recovery from medical appointment, family commitments)..."
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'var(--leave-surface-muted)',
                    border: '1px solid var(--leave-border-subtle)',
                    borderRadius: 'var(--leave-radius-md)',
                    fontSize: '13px',
                    color: 'var(--leave-text-primary)',
                    outline: 'none',
                    resize: 'vertical',
                    lineHeight: '1.5',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--leave-text-secondary)', marginBottom: '6px' }}>
                    Acting Reliever / Handover Personnel
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Briefcase className="w-4 h-4" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--leave-text-tertiary)' }} />
                    <input
                      type="text"
                      name="relieverName"
                      value={formData.relieverName}
                      onChange={handleChange}
                      placeholder="e.g. John Miller (Senior Estimator)"
                      style={{
                        width: '100%',
                        padding: '9px 12px 9px 36px',
                        background: 'var(--leave-surface-muted)',
                        border: '1px solid var(--leave-border-subtle)',
                        borderRadius: 'var(--leave-radius-md)',
                        fontSize: '13px',
                        color: 'var(--leave-text-primary)',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--leave-text-secondary)', marginBottom: '6px' }}>
                    Emergency Reachability Information
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Phone className="w-4 h-4" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--leave-text-tertiary)' }} />
                    <input
                      type="text"
                      name="emergencyContact"
                      value={formData.emergencyContact}
                      onChange={handleChange}
                      placeholder="e.g. +44 7700 900123 / personal@domain.com"
                      style={{
                        width: '100%',
                        padding: '9px 12px 9px 36px',
                        background: 'var(--leave-surface-muted)',
                        border: '1px solid var(--leave-border-subtle)',
                        borderRadius: 'var(--leave-radius-md)',
                        fontSize: '13px',
                        color: 'var(--leave-text-primary)',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>
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
                href="/leaves"
                style={{
                  padding: '9px 20px',
                  background: 'var(--leave-surface)',
                  border: '1px solid var(--leave-border)',
                  borderRadius: 'var(--leave-radius-md)',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'var(--leave-text-secondary)',
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
                className="leave-btn-primary"
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
                    <span>Submitting Request...</span>
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4" />
                    <span>Submit Leave Request</span>
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
