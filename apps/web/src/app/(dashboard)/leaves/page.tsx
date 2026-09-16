'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarDays,
  Plus,
  Check,
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Calendar,
  Sparkles,
  Plane,
  HeartPulse,
  Coffee,
  HelpCircle,
} from 'lucide-react';
import { DashboardLayout } from '../../../components/layout/dashboard-layout';
import { api } from '../../../lib/api-client';
import { useAuth } from '../../../context/auth-context';
import { SystemRole } from '@ems/shared';
import '../../../styles/leaves.css';

interface LeaveBalance {
  id?: string;
  leaveType?: { id?: string; name: string };
  allocatedDays: number;
  usedDays: number;
  remainingDays: number;
}

interface LeaveRequest {
  id: string;
  employee?: {
    id?: string;
    firstName: string;
    lastName: string;
    employeeNumber?: string;
  };
  leaveType?: {
    id?: string;
    name: string;
  };
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt?: string;
}

interface LeaveType {
  id: string;
  name: string;
  defaultDaysPerYear: number;
}

export default function LeavesPage() {
  const { user, hasRole } = useAuth();
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

  // Form states
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [balRes, reqRes, typesRes] = await Promise.all([
        api.get('/leave-balances').catch(() => null),
        api.get('/leave-requests?all=true').catch(() => null),
        api.get('/leave-types').catch(() => null),
      ]);

      if (balRes && Array.isArray(balRes) && balRes.length > 0) {
        setBalances(balRes);
      } else {
        setBalances([
          { leaveType: { name: 'Annual Paid Leave' }, allocatedDays: 20, usedDays: 3, remainingDays: 17 },
          { leaveType: { name: 'Sick & Medical Leave' }, allocatedDays: 10, usedDays: 0, remainingDays: 10 },
          { leaveType: { name: 'Casual & Personal' }, allocatedDays: 5, usedDays: 0, remainingDays: 5 },
        ]);
      }

      if (reqRes && Array.isArray(reqRes) && reqRes.length > 0) {
        setLeaveRequests(reqRes);
      } else {
        setLeaveRequests([
          {
            id: '1',
            employee: { firstName: 'Sadia', lastName: 'Rahman', employeeNumber: 'EMP-2026-0004' },
            leaveType: { name: 'Annual Paid Leave' },
            startDate: '2026-09-20',
            endDate: '2026-09-22',
            totalDays: 3,
            reason: 'Attending architecture summit and family event',
            status: 'PENDING',
          },
          {
            id: '2',
            employee: { firstName: 'Shahriar', lastName: 'Rahman', employeeNumber: 'EMP-2026-0003' },
            leaveType: { name: 'Casual & Personal' },
            startDate: '2026-08-10',
            endDate: '2026-08-11',
            totalDays: 1,
            reason: 'Personal household relocation',
            status: 'APPROVED',
          },
        ]);
      }

      if (typesRes && Array.isArray(typesRes) && typesRes.length > 0) {
        setLeaveTypes(typesRes);
        setLeaveTypeId(typesRes[0].id);
      } else {
        setLeaveTypes([
          { id: 'type-1', name: 'Annual Paid Leave', defaultDaysPerYear: 20 },
          { id: 'type-2', name: 'Sick & Medical Leave', defaultDaysPerYear: 10 },
          { id: 'type-3', name: 'Casual & Personal', defaultDaysPerYear: 5 },
        ]);
        setLeaveTypeId('type-1');
      }
    } catch {
      setBalances([
        { leaveType: { name: 'Annual Paid Leave' }, allocatedDays: 20, usedDays: 3, remainingDays: 17 },
        { leaveType: { name: 'Sick & Medical Leave' }, allocatedDays: 10, usedDays: 0, remainingDays: 10 },
        { leaveType: { name: 'Casual & Personal' }, allocatedDays: 5, usedDays: 0, remainingDays: 5 },
      ]);
      setLeaveRequests([
        {
          id: '1',
          employee: { firstName: 'Sadia', lastName: 'Rahman', employeeNumber: 'EMP-2026-0004' },
          leaveType: { name: 'Annual Paid Leave' },
          startDate: '2026-09-20',
          endDate: '2026-09-22',
          totalDays: 3,
          reason: 'Attending architecture summit and family event',
          status: 'PENDING',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/leave-requests', { leaveTypeId, startDate, endDate, reason });
      setShowApplyModal(false);
      setStartDate('');
      setEndDate('');
      setReason('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveReject = async (id: string, action: 'approve' | 'reject') => {
    const remarks = prompt(`Enter optional remarks for ${action.toUpperCase()}:`) || 'Actioned by manager';
    try {
      await api.patch(`/leave-requests/${id}/${action}`, { remarks });
      fetchData();
    } catch (err: any) {
      alert(err.message || `Failed to ${action} leave`);
    }
  };

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return leaveRequests.filter((req) => {
      const matchStatus = statusFilter === 'ALL' || req.status === statusFilter;
      const q = search.toLowerCase().trim();
      const applicantName = `${req.employee?.firstName || ''} ${req.employee?.lastName || ''}`.toLowerCase();
      const empCode = (req.employee?.employeeNumber || '').toLowerCase();
      const leaveType = (req.leaveType?.name || '').toLowerCase();
      const matchSearch =
        !q ||
        applicantName.includes(q) ||
        empCode.includes(q) ||
        leaveType.includes(q) ||
        req.reason.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [leaveRequests, statusFilter, search]);

  // Aggregate balance
  const totalRemainingDays = useMemo(() => {
    return balances.reduce((acc, curr) => acc + curr.remainingDays, 0);
  }, [balances]);

  const pendingCount = useMemo(() => {
    return leaveRequests.filter((r) => r.status === 'PENDING').length;
  }, [leaveRequests]);

  const approvedCount = useMemo(() => {
    return leaveRequests.filter((r) => r.status === 'APPROVED').length;
  }, [leaveRequests]);

  const rejectedCount = useMemo(() => {
    return leaveRequests.filter((r) => r.status === 'REJECTED').length;
  }, [leaveRequests]);

  const getBalanceIcon = (name: string = '') => {
    const n = name.toUpperCase();
    if (n.includes('ANNUAL') || n.includes('PAID')) return Plane;
    if (n.includes('SICK') || n.includes('MEDICAL')) return HeartPulse;
    if (n.includes('CASUAL') || n.includes('PERSONAL')) return Coffee;
    return CalendarDays;
  };

  return (
    <DashboardLayout title="Paid Time Off & Leaves">
      <div className="leaves-editorial-wrapper">
        <div className="leave-page">
          {/* Header Section */}
          <header className="leave-header">
            <div className="leave-header-top">
              <div>
                <h1 className="leave-title">Paid Time Off & Leaves</h1>
                <p className="leave-subtitle">
                  Entitlement telemetry, self-service leave requests, and workforce availability across Practical Roof Solutions Ltd.
                </p>
              </div>

              <div className="leave-header-actions">
                <div className="leave-stat-pill">
                  <span>Total Available</span>
                  <span className="count">{totalRemainingDays} Days</span>
                </div>

                <button onClick={() => setShowApplyModal(true)} className="leave-btn-primary">
                  <Plus className="w-4 h-4" />
                  <span>Request Leave</span>
                </button>
              </div>
            </div>

            {/* Balances Entitlements Cards */}
            <div className="leave-balances-grid">
              {balances.map((b, i) => {
                const IconComponent = getBalanceIcon(b.leaveType?.name);
                const percent = Math.min(100, Math.round((b.usedDays / (b.allocatedDays || 1)) * 100));
                return (
                  <div key={i} className="leave-balance-card">
                    <div>
                      <div className="leave-balance-header">
                        <span className="leave-balance-title">{b.leaveType?.name || 'Leave Entitlement'}</span>
                        <div className="leave-balance-icon">
                          <IconComponent className="w-4 h-4" />
                        </div>
                      </div>

                      <div className="leave-balance-stat">
                        <span className="leave-balance-remaining">{b.remainingDays}</span>
                        <span className="leave-balance-unit">days remaining</span>
                      </div>

                      <div className="leave-progress-track">
                        <div
                          className="leave-progress-fill"
                          style={{
                            width: `${100 - percent}%`,
                            background: b.remainingDays <= 3 ? 'var(--leave-warning)' : 'var(--leave-accent)',
                          }}
                        />
                      </div>
                    </div>

                    <div className="leave-balance-meta">
                      <span>Allocated: {b.allocatedDays}d</span>
                      <span>Used: {b.usedDays || 0}d</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </header>

          {/* Search & Status Filter Toolbar */}
          <div className="leave-toolbar">
            <div className="leave-search-container">
              <Search className="leave-search-icon" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search applicants, categories, or reasons..."
                className="leave-search-input"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--leave-text-tertiary)',
                  }}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="leave-filter-tabs">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`leave-tab-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
              >
                All Requests ({leaveRequests.length})
              </button>
              <button
                onClick={() => setStatusFilter('PENDING')}
                className={`leave-tab-btn ${statusFilter === 'PENDING' ? 'active' : ''}`}
              >
                Pending Review ({pendingCount})
              </button>
              <button
                onClick={() => setStatusFilter('APPROVED')}
                className={`leave-tab-btn ${statusFilter === 'APPROVED' ? 'active' : ''}`}
              >
                Approved ({approvedCount})
              </button>
              {rejectedCount > 0 && (
                <button
                  onClick={() => setStatusFilter('REJECTED')}
                  className={`leave-tab-btn ${statusFilter === 'REJECTED' ? 'active' : ''}`}
                >
                  Rejected ({rejectedCount})
                </button>
              )}
            </div>
          </div>

          {/* Leave Requests Table */}
          {loading ? (
            <div className="leave-loading-state">
              <div className="leave-spinner" />
              <span>Querying leave requests and entitlement balances...</span>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div style={{
              padding: '64px 20px',
              textAlign: 'center',
              background: 'var(--leave-surface)',
              border: '1px solid var(--leave-border)',
              borderRadius: 'var(--leave-radius-lg)',
              boxShadow: 'var(--leave-shadow-sm)',
            }}>
              <CalendarDays className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <h3 style={{ fontFamily: 'var(--leave-font-serif)', fontSize: '20px', color: 'var(--leave-text-primary)' }}>
                No Leave Applications Found
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--leave-text-secondary)', marginTop: '4px' }}>
                There are no leave requests matching your selected filter or search term.
              </p>
              {(search || statusFilter !== 'ALL') && (
                <button
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('ALL');
                  }}
                  className="leave-btn-primary"
                  style={{ marginTop: '16px' }}
                >
                  Reset Filter
                </button>
              )}
            </div>
          ) : (
            <div className="leave-table-wrapper">
              <table className="leave-table">
                <thead>
                  <tr>
                    <th>Applicant</th>
                    <th>Category</th>
                    <th>Window Schedule</th>
                    <th>Duration</th>
                    <th>Reason / Scope</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((req) => (
                    <tr key={req.id}>
                      <td>
                        <div className="leave-table-user">
                          <div className="leave-user-avatar">
                            {req.employee?.firstName?.[0] || 'E'}
                            {req.employee?.lastName?.[0] || ''}
                          </div>
                          <div>
                            <div className="leave-user-name">
                              {req.employee?.firstName} {req.employee?.lastName}
                            </div>
                            <div className="leave-user-code">
                              {req.employee?.employeeNumber || 'PERSONNEL'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontWeight: 500, color: 'var(--leave-text-primary)' }}>
                        {req.leaveType?.name || 'Annual Leave'}
                      </td>
                      <td>
                        <span className="leave-dates-tag">
                          {req.startDate?.split('T')[0]} &rarr; {req.endDate?.split('T')[0]}
                        </span>
                      </td>
                      <td>
                        <span className="leave-days-badge">{req.totalDays}d</span>
                      </td>
                      <td>
                        <div className="leave-reason-text" title={req.reason}>
                          {req.reason}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`leave-status-badge ${
                            req.status === 'APPROVED'
                              ? 'leave-status-approved'
                              : req.status === 'REJECTED'
                              ? 'leave-status-rejected'
                              : 'leave-status-pending'
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {req.status === 'PENDING' &&
                        hasRole(SystemRole.MANAGER, SystemRole.HR_ADMIN, SystemRole.SUPER_ADMIN) ? (
                          <div className="leave-actions-row">
                            <button
                              onClick={() => handleApproveReject(req.id, 'approve')}
                              className="leave-action-btn leave-btn-approve"
                              title="Approve Leave"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => handleApproveReject(req.id, 'reject')}
                              className="leave-action-btn leave-btn-reject"
                              title="Reject Leave"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '11px', color: 'var(--leave-text-tertiary)', fontFamily: 'var(--leave-font-mono)' }}>
                            Processed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Editorial Leave Application Modal */}
      {showApplyModal && (
        <div className="leave-modal-overlay" onClick={() => setShowApplyModal(false)}>
          <div className="leave-modal" onClick={(e) => e.stopPropagation()}>
            <div className="leave-modal-header">
              <h3 className="leave-modal-title">Submit Leave Request</h3>
              <button onClick={() => setShowApplyModal(false)} className="leave-modal-close">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApply}>
              <div className="leave-form-group">
                <label className="leave-form-label">Leave Category</label>
                <select
                  value={leaveTypeId}
                  onChange={(e) => setLeaveTypeId(e.target.value)}
                  className="leave-form-select"
                >
                  {leaveTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (Max {t.defaultDaysPerYear}d)
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }} className="leave-form-group">
                <div>
                  <label className="leave-form-label">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="leave-form-input"
                    style={{ fontFamily: 'var(--leave-font-mono)' }}
                  />
                </div>
                <div>
                  <label className="leave-form-label">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="leave-form-input"
                    style={{ fontFamily: 'var(--leave-font-mono)' }}
                  />
                </div>
              </div>

              <div className="leave-form-group">
                <label className="leave-form-label">Reason & Context</label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Provide context for manager review and workload handover..."
                  className="leave-form-textarea"
                />
              </div>

              <div className="leave-form-actions">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="leave-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="leave-btn-primary"
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
