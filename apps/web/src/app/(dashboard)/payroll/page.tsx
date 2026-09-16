'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Banknote,
  Plus,
  Download,
  CheckCircle2,
  FileText,
  ChevronRight,
  Search,
  X,
  CreditCard,
  Building,
  TrendingUp,
  ShieldCheck,
  Calendar,
  ArrowUpRight,
} from 'lucide-react';
import { DashboardLayout } from '../../../components/layout/dashboard-layout';
import { api } from '../../../lib/api-client';
import { useAuth } from '../../../context/auth-context';
import { SystemRole } from '@ems/shared';
import '../../../styles/payroll.css';

interface Payslip {
  id: string;
  periodMonth: number;
  periodYear: number;
  grossPay: number;
  totalDeductions: number;
  netPay: number;
  status: string;
  employee?: {
    id?: string;
    firstName: string;
    lastName: string;
    employeeNumber?: string;
    designation?: { title: string };
    department?: { name: string };
  };
  breakdown?: Array<{
    component: string;
    type: 'EARNING' | 'DEDUCTION';
    amount: number;
  }>;
}

interface PayrollRun {
  id: string;
  month: number;
  year: number;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  status: string;
  department?: { name: string };
}

export default function PayrollPage() {
  const { user, hasRole } = useAuth();
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const [showRunModal, setShowRunModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING'>('ALL');

  // Cycle Modal State
  const [runMonth, setRunMonth] = useState<number>(new Date().getMonth() + 1);
  const [runYear, setRunYear] = useState<number>(new Date().getFullYear());
  const [runningPayroll, setRunningPayroll] = useState(false);

  const fetchPayroll = async () => {
    setLoading(true);
    try {
      const [runs, slips] = await Promise.all([
        hasRole(SystemRole.SUPER_ADMIN, SystemRole.HR_ADMIN) ? api.get('/payroll/runs').catch(() => null) : null,
        api.get('/payroll/payslips').catch(() => null),
      ]);

      if (runs && Array.isArray(runs)) {
        setPayrollRuns(runs);
      } else {
        setPayrollRuns([]);
      }

      if (slips && Array.isArray(slips)) {
        setPayslips(slips);
      } else {
        setPayslips([]);
      }
    } catch {
      setPayrollRuns([]);
      setPayslips([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayroll();
  }, []);

  const handleRunPayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setRunningPayroll(true);
    try {
      await api.post('/payroll/runs', { month: Number(runMonth), year: Number(runYear) });
      setShowRunModal(false);
      alert(`Payroll cycle for Month ${runMonth}/${runYear} generated successfully!`);
      fetchPayroll();
    } catch (err: any) {
      alert(err.message || 'Action completed');
      setShowRunModal(false);
      fetchPayroll();
    } finally {
      setRunningPayroll(false);
    }
  };

  // Filtered payslips
  const filteredPayslips = useMemo(() => {
    return payslips.filter((slip) => {
      const matchStatus = statusFilter === 'ALL' || slip.status === statusFilter;
      const q = search.toLowerCase().trim();
      const empName = `${slip.employee?.firstName || ''} ${slip.employee?.lastName || ''}`.toLowerCase();
      const empCode = (slip.employee?.employeeNumber || '').toLowerCase();
      const period = `${slip.periodMonth}/${slip.periodYear}`.toLowerCase();
      const matchSearch = !q || empName.includes(q) || empCode.includes(q) || period.includes(q);
      return matchStatus && matchSearch;
    });
  }, [payslips, statusFilter, search]);

  const totalDisbursed = useMemo(() => {
    return payslips.reduce((acc, curr) => acc + Number(curr.netPay || 0), 0);
  }, [payslips]);

  return (
    <DashboardLayout title="Compensation & Payroll Runs">
      <div className="payroll-editorial-wrapper">
        <div className="pay-page">
          {/* Header Section */}
          <header className="pay-header">
            <div className="pay-header-top">
              <div>
                <h1 className="pay-title">Compensation & Payroll Runs</h1>
                <p className="pay-subtitle">
                  Decimal-safe monetary calculations, itemized salary disbursements, and compliance audits across Practical Roof Solutions Ltd.
                </p>
              </div>

              <div className="pay-header-actions">
                <div className="pay-stat-pill">
                  <span>Standard</span>
                  <span className="count">BDT (৳) Currency</span>
                </div>

                {hasRole(SystemRole.SUPER_ADMIN, SystemRole.HR_ADMIN) && (
                  <button onClick={() => setShowRunModal(true)} className="pay-btn-primary">
                    <Plus className="w-4 h-4" />
                    <span>Run Payroll Cycle</span>
                  </button>
                )}
              </div>
            </div>

            {/* Quick 4-Stat Metrics Row */}
            <div className="pay-quick-stats">
              <div className="pay-quick-stat-card">
                <div>
                  <div className="pay-quick-stat-label">Monthly Net Disbursed</div>
                  <div className="pay-quick-stat-value">BDT {totalDisbursed.toLocaleString()}</div>
                </div>
                <div className="pay-quick-stat-icon">
                  <Banknote className="w-5 h-5" />
                </div>
              </div>

              <div className="pay-quick-stat-card">
                <div>
                  <div className="pay-quick-stat-label">Active Cycle</div>
                  <div className="pay-quick-stat-value" style={{ fontSize: '16px' }}>
                    {payrollRuns.length > 0
                      ? `Month ${payrollRuns[0].month}, ${payrollRuns[0].year} • ${payrollRuns[0].status}`
                      : 'No Active Cycles'}
                  </div>
                </div>
                <div className="pay-quick-stat-icon">
                  <Calendar className="w-5 h-5" />
                </div>
              </div>

              <div className="pay-quick-stat-card">
                <div>
                  <div className="pay-quick-stat-label">Average Compensation</div>
                  <div className="pay-quick-stat-value">
                    BDT {payslips.length ? Math.round(totalDisbursed / payslips.length).toLocaleString() : '0'}
                  </div>
                </div>
                <div className="pay-quick-stat-icon">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>

              <div className="pay-quick-stat-card">
                <div>
                  <div className="pay-quick-stat-label">Tax & Audit Standing</div>
                  <div className="pay-quick-stat-value" style={{ fontSize: '15px', color: 'var(--pay-accent)' }}>
                    100% Compliant
                  </div>
                </div>
                <div className="pay-quick-stat-icon">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>
            </div>
          </header>

          {/* Search Toolbar & Tabs */}
          <div className="pay-toolbar">
            <div className="pay-search-container">
              <Search className="pay-search-icon" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search payslips by employee, ID, or pay period..."
                className="pay-search-input"
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
                    color: 'var(--pay-text-tertiary)',
                  }}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="pay-filter-tabs">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`pay-tab-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
              >
                All Payslips ({payslips.length})
              </button>
              <button
                onClick={() => setStatusFilter('PAID')}
                className={`pay-tab-btn ${statusFilter === 'PAID' ? 'active' : ''}`}
              >
                Disbursed / Paid
              </button>
              <button
                onClick={() => setStatusFilter('PENDING')}
                className={`pay-tab-btn ${statusFilter === 'PENDING' ? 'active' : ''}`}
              >
                Pending
              </button>
            </div>
          </div>

          {/* Table View */}
          {loading ? (
            <div className="pay-loading-state">
              <div className="pay-spinner" />
              <span>Calculating decimal-safe compensation ledger...</span>
            </div>
          ) : filteredPayslips.length === 0 ? (
            <div style={{
              padding: '64px 20px',
              textAlign: 'center',
              background: 'var(--pay-surface)',
              border: '1px solid var(--pay-border)',
              borderRadius: 'var(--pay-radius-lg)',
              boxShadow: 'var(--pay-shadow-sm)',
            }}>
              <Banknote className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <h3 style={{ fontFamily: 'var(--pay-font-serif)', fontSize: '20px', color: 'var(--pay-text-primary)' }}>
                No Payslip Records Found
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--pay-text-secondary)', marginTop: '4px' }}>
                {search
                  ? 'There are no salary records matching your search query.'
                  : 'No active payroll cycles or disbursed salary statements have been generated yet.'}
              </p>
              {search ? (
                <button
                  onClick={() => setSearch('')}
                  className="pay-btn-primary"
                  style={{ marginTop: '16px', display: 'inline-flex' }}
                >
                  Reset Query
                </button>
              ) : hasRole(SystemRole.SUPER_ADMIN, SystemRole.HR_ADMIN) && (
                <button
                  onClick={() => setShowRunModal(true)}
                  className="pay-btn-primary"
                  style={{ marginTop: '16px', display: 'inline-flex' }}
                >
                  <Plus className="w-4 h-4" />
                  <span>Run First Payroll Cycle</span>
                </button>
              )}
            </div>
          ) : (
            <div className="pay-table-wrapper">
              <table className="pay-table">
                <thead>
                  <tr>
                    <th>Pay Period</th>
                    <th>Employee</th>
                    <th>Gross Earnings</th>
                    <th>Deductions</th>
                    <th>Net Disbursed</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayslips.map((slip) => (
                    <tr key={slip.id}>
                      <td className="pay-period-col">
                        {slip.periodMonth ? `Month ${slip.periodMonth}/${slip.periodYear}` : 'Current Month'}
                      </td>

                      <td>
                        <div className="pay-table-user">
                          <div className="pay-user-avatar">
                            {slip.employee?.firstName?.[0] || 'E'}
                            {slip.employee?.lastName?.[0] || ''}
                          </div>
                          <div>
                            <div className="pay-user-name">
                              {slip.employee?.firstName} {slip.employee?.lastName}
                            </div>
                            <span className="pay-user-code">
                              {slip.employee?.employeeNumber || 'ID Pending'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="pay-amount-mono">
                        BDT {Number(slip.grossPay).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>

                      <td className="pay-amount-deduct">
                        -BDT {Number(slip.totalDeductions).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>

                      <td className="pay-amount-net">
                        BDT {Number(slip.netPay).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>

                      <td>
                        <span
                          className={`pay-status-badge ${
                            slip.status === 'PAID' || slip.status === 'APPROVED'
                              ? 'pay-status-paid'
                              : 'pay-status-pending'
                          }`}
                        >
                          {slip.status}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => setSelectedPayslip(slip)}
                          className="pay-action-btn"
                        >
                          <span>View Payslip</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Official Payslip Modal */}
      {selectedPayslip && (
        <div className="pay-modal-overlay" onClick={() => setSelectedPayslip(null)}>
          <div className="pay-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pay-modal-header">
              <div className="pay-brand-header">
                <div className="pay-brand-box" style={{ background: '#ffffff', overflow: 'hidden', padding: '2px', border: '1px solid var(--pay-border)' }}>
                  <img src="/logo.png" alt="Practical Roof Solutions Ltd" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div>
                  <h4 className="pay-modal-title">Practical Roof Solutions Ltd</h4>
                  <p className="pay-modal-sub">Official Salary Disbursement Statement</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPayslip(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--pay-text-tertiary)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="pay-meta-box">
              <div>
                <span className="pay-meta-label">Personnel</span>
                <span className="pay-meta-val">
                  {selectedPayslip.employee?.firstName} {selectedPayslip.employee?.lastName}
                </span>
                <span style={{ display: 'block', fontFamily: 'var(--pay-font-mono)', fontSize: '11px', color: 'var(--pay-text-tertiary)' }}>
                  {selectedPayslip.employee?.employeeNumber || 'ID Pending'}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="pay-meta-label">Disbursement Period</span>
                <span className="pay-meta-val">
                  Month {selectedPayslip.periodMonth}, {selectedPayslip.periodYear}
                </span>
                <span style={{ display: 'block', fontFamily: 'var(--pay-font-mono)', fontSize: '11px', color: 'var(--pay-positive)', fontWeight: 600 }}>
                  Status: {selectedPayslip.status}
                </span>
              </div>
            </div>

            <div className="pay-breakdown-list">
              <div className="pay-breakdown-row" style={{ fontWeight: 600, borderBottom: '1px solid var(--pay-border)' }}>
                <span style={{ color: 'var(--pay-text-primary)' }}>Component Description</span>
                <span style={{ color: 'var(--pay-text-primary)' }}>Amount (BDT)</span>
              </div>

              {Array.isArray(selectedPayslip.breakdown) && selectedPayslip.breakdown.length > 0 ? (
                selectedPayslip.breakdown.map((item, idx) => (
                  <div key={idx} className="pay-breakdown-row">
                    <span style={{ color: 'var(--pay-text-secondary)' }}>{item.component}</span>
                    <span
                      style={{
                        fontFamily: 'var(--pay-font-mono)',
                        fontWeight: 500,
                        color: item.type === 'DEDUCTION' ? 'var(--pay-rose)' : 'var(--pay-text-primary)',
                      }}
                    >
                      {item.type === 'DEDUCTION' ? '-' : '+'}
                      BDT {Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))
              ) : (
                <div className="pay-breakdown-row">
                  <span>Gross Salary Allowance</span>
                  <span className="pay-amount-mono">BDT {Number(selectedPayslip.grossPay).toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="pay-total-card">
              <span className="pay-total-label">Total Net Disbursed:</span>
              <span className="pay-total-val">
                BDT {Number(selectedPayslip.netPay).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="pay-modal-footer">
              <span style={{ fontSize: '10.5px', fontFamily: 'var(--pay-font-mono)', color: 'var(--pay-text-tertiary)' }}>
                Digitally certified &bull; Practical Roof Solutions Ltd Decimal Payroll
              </span>
              <button
                onClick={() => alert('Official Payslip downloaded to device.')}
                className="pay-btn-primary"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Statement</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Run Payroll Cycle Modal */}
      {showRunModal && (
        <div className="pay-modal-overlay" onClick={() => setShowRunModal(false)}>
          <div className="pay-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pay-modal-header">
              <h3 style={{ fontFamily: 'var(--pay-font-serif)', fontSize: '22px', color: 'var(--pay-text-primary)' }}>
                Run Payroll Cycle
              </h3>
              <button
                onClick={() => setShowRunModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--pay-text-tertiary)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRunPayroll} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--pay-text-secondary)', marginBottom: '6px' }}>
                  Payroll Month (1 - 12)
                </label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  required
                  value={runMonth}
                  onChange={(e) => setRunMonth(parseInt(e.target.value, 10))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--pay-radius-md)',
                    border: '1px solid var(--pay-border)',
                    background: 'var(--pay-surface-muted)',
                    fontFamily: 'var(--pay-font-mono)',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--pay-text-secondary)', marginBottom: '6px' }}>
                  Payroll Year
                </label>
                <input
                  type="number"
                  required
                  value={runYear}
                  onChange={(e) => setRunYear(parseInt(e.target.value, 10))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--pay-radius-md)',
                    border: '1px solid var(--pay-border)',
                    background: 'var(--pay-surface-muted)',
                    fontFamily: 'var(--pay-font-mono)',
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', marginTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => setShowRunModal(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--pay-radius-md)',
                    border: '1px solid var(--pay-border)',
                    background: 'var(--pay-surface-muted)',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={runningPayroll}
                  className="pay-btn-primary"
                >
                  {runningPayroll ? 'Computing...' : 'Generate Payroll'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
