'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '../../../components/layout/dashboard-layout';
import { useAuth } from '../../../context/auth-context';
import { api } from '../../../lib/api-client';
import '../../../styles/dashboard.css';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    headcount: 0,
    attendanceRate: 0,
    pendingLeaves: 0,
    monthlyPayroll: '—',
    payrollPeriod: 'No runs yet',
  });
  const [clockStatus, setClockStatus] = useState<'IDLE' | 'CLOCKED_IN' | 'CLOCKED_OUT'>('IDLE');
  const [timeState, setTimeState] = useState({
    timeShort: '10:47',
    period: '10 AM',
    dateStr: 'Mon, 15 Sep 2026',
  });

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const timeShort = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/London',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(now);

      const period = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/London',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(now);

      const dateStr = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/London',
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(now);

      setTimeState({ timeShort, period, dateStr });
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);

    // Live backend metrics
    api.get('/employees?limit=1')
      .then((res) => {
        if (res?.meta?.total) {
          setStats((prev) => ({ ...prev, headcount: res.meta.total }));
        }
      })
      .catch(() => {});

    api.get('/leave-requests?status=PENDING')
      .then((res) => {
        if (Array.isArray(res)) {
          setStats((prev) => ({ ...prev, pendingLeaves: res.length }));
        }
      })
      .catch(() => {});

    api.get('/payroll/runs?limit=1&status=PAID')
      .then((res) => {
        const runs = res?.data ?? res;
        if (Array.isArray(runs) && runs.length > 0) {
          const latest = runs[0];
          const total = latest?.totalNetPay ?? latest?.totalGrossPay ?? 0;
          const formatted = total > 0
            ? `£${(total / 1000).toFixed(1)}K`
            : '£0';
          const period = latest?.periodLabel ?? latest?.month ?? 'Latest run';
          setStats((prev) => ({ ...prev, monthlyPayroll: formatted, payrollPeriod: period }));
        }
      })
      .catch(() => {});

    return () => clearInterval(interval);
  }, []);

  const handleClockAction = async () => {
    try {
      if (clockStatus === 'CLOCKED_IN') {
        await api.post('/attendance/clock-out', { notes: 'Clock out from dashboard' });
        setClockStatus('CLOCKED_OUT');
      } else {
        await api.post('/attendance/clock-in', { notes: 'Clock in from dashboard' });
        setClockStatus('CLOCKED_IN');
      }
    } catch {
      setClockStatus(clockStatus === 'CLOCKED_IN' ? 'CLOCKED_OUT' : 'CLOCKED_IN');
    }
  };

  const displayName = user?.firstName || 'System';

  return (
    <DashboardLayout title="Executive Workforce Dashboard">
      <div className="dashboard-editorial-wrapper">
        <div className="dash-page">

          {/* Welcome Section */}
          <div className="welcome-section">
            <div className="welcome-row">
              <div>
                <h1 className="welcome-greeting">Welcome back, {displayName}</h1>
                <p className="welcome-subtitle">
                  Practical Roof Solutions Ltd EMS — All enterprise operations active and nominal.
                </p>
              </div>
              <div className="welcome-meta">
                <span className="welcome-tag">
                  <span className="welcome-tag-dot" />
                  Live Platform
                </span>
                <span className="welcome-date">{timeState.dateStr}</span>
              </div>
            </div>
          </div>

          {/* KPIs Grid */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-header">
                <div className="kpi-icon green">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                  </svg>
                </div>
                <span className="kpi-trend up">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="19" x2="12" y2="5" />
                    <polyline points="5 12 12 5 19 12" />
                  </svg>
                  +12%
                </span>
              </div>
              <div className="kpi-value">{stats.headcount}</div>
              <div className="kpi-label">Total Headcount</div>
              <div className="kpi-context">Active workforce members</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-header">
                <div className="kpi-icon blue">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <span className="kpi-trend up">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="19" x2="12" y2="5" />
                    <polyline points="5 12 12 5 19 12" />
                  </svg>
                  +3.1%
                </span>
              </div>
              <div className="kpi-value">
                {stats.attendanceRate}
                <span className="kpi-unit">%</span>
              </div>
              <div className="kpi-label">Attendance Today</div>
              <div className="kpi-context">On-time shift arrival rate</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-header">
                <div className="kpi-icon amber">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <span className="kpi-trend neutral">On schedule</span>
              </div>
              <div className="kpi-value">{stats.pendingLeaves}</div>
              <div className="kpi-label">Pending Leaves</div>
              <div className="kpi-context">Awaiting manager approval</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-header">
                <div className="kpi-icon purple">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="12" x="2" y="6" rx="2" />
                    <circle cx="12" cy="12" r="2" />
                    <path d="M6 12h.01M18 12h.01" />
                  </svg>
                </div>
                <span className="kpi-trend up">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="19" x2="12" y2="5" />
                    <polyline points="5 12 12 5 19 12" />
                  </svg>
                  On time
                </span>
              </div>
              <div className="kpi-value">
                {stats.monthlyPayroll}
              </div>
              <div className="kpi-label">Monthly Payroll</div>
              <div className="kpi-context">{stats.payrollPeriod}</div>
            </div>

          </div>

          {/* System Modules Grid */}
          <div className="section-header">
            <span className="section-title">System Modules</span>
            <Link href="/employees" className="section-link">View all modules</Link>
          </div>
          <div className="module-grid">
            <Link href="/employees" className="module-card">
              <div className="module-icon teal">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div>
                <div className="module-title">Employees</div>
                <div className="module-desc">Manage employee profiles, roles, departments, and organizational structure.</div>
              </div>
              <div className="module-footer">
                <span className="module-stat">{stats.headcount} active members</span>
                <span className="module-arrow">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </span>
              </div>
            </Link>

            <Link href="/organization/departments" className="module-card">
              <div className="module-icon blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="6" height="13" rx="1" />
                  <rect x="9" y="3" width="6" height="17" rx="1" />
                  <rect x="16" y="10" width="6" height="10" rx="1" />
                </svg>
              </div>
              <div>
                <div className="module-title">Departments</div>
                <div className="module-desc">Organizational units, team structures, reporting hierarchies, and headcount allocation.</div>
              </div>
              <div className="module-footer">
                <span className="module-stat">Structures & org chart</span>
                <span className="module-arrow">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </span>
              </div>
            </Link>

            <Link href="/attendance" className="module-card">
              <div className="module-icon green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div>
                <div className="module-title">Attendance</div>
                <div className="module-desc">Daily clock-in/out tracking, shift management, overtime calculations, and attendance reports.</div>
              </div>
              <div className="module-footer">
                <span className="module-stat">{stats.attendanceRate}% today</span>
                <span className="module-arrow">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </span>
              </div>
            </Link>

            <Link href="/leaves" className="module-card">
              <div className="module-icon amber">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <div>
                <div className="module-title">Leaves</div>
                <div className="module-desc">Leave applications, approval workflows, balance tracking, and leave policy management.</div>
              </div>
              <div className="module-footer">
                <span className="module-stat">{stats.pendingLeaves} pending approvals</span>
                <span className="module-arrow">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </span>
              </div>
            </Link>

            <Link href="/payroll" className="module-card">
              <div className="module-icon purple">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="12" x="2" y="6" rx="2" />
                  <circle cx="12" cy="12" r="2" />
                  <path d="M6 12h.01M18 12h.01" />
                </svg>
              </div>
              <div>
                <div className="module-title">Payroll</div>
                <div className="module-desc">Salary processing, deductions, payslip generation, and disbursement tracking.</div>
              </div>
              <div className="module-footer">
                <span className="module-stat">{stats.monthlyPayroll !== '—' ? `${stats.monthlyPayroll} approved` : 'No payroll runs yet'}</span>
                <span className="module-arrow">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </span>
              </div>
            </Link>

            <Link href="/performance" className="module-card">
              <div className="module-icon teal">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              </div>
              <div>
                <div className="module-title">Performance</div>
                <div className="module-desc">Goal setting, review cycles, competency assessments, and development planning.</div>
              </div>
              <div className="module-footer">
                <span className="module-stat">Reviews & tracking</span>
                <span className="module-arrow">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </span>
              </div>
            </Link>

            <Link href="/ai-assistant" className="module-card">
              <div className="module-icon rose">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
                  <line x1="9" y1="21" x2="15" y2="21" />
                </svg>
              </div>
              <div>
                <div className="module-title">AI Assistant</div>
                <div className="module-desc">Generate documents, summarize data, draft policies, and get intelligent workforce insights.</div>
              </div>
              <div className="module-footer">
                <span className="module-stat">Powered by Gemini & Groq</span>
                <span className="module-arrow">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </span>
              </div>
            </Link>

            <Link href="/admin/audit-logs" className="module-card">
              <div className="module-icon amber">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </div>
              <div>
                <div className="module-title">Audit Trail</div>
                <div className="module-desc">System activity logs, compliance tracking, user action history, and security audit records.</div>
              </div>
              <div className="module-footer">
                <span className="module-stat">Full activity log</span>
                <span className="module-arrow">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </span>
              </div>
            </Link>
          </div>

          {/* Bottom Grid: Clock + Quick Actions */}
          <div className="bottom-grid">

            {/* Daily Time Clock */}
            <div className="clock-card">
              <span className="clock-label">Daily Time Clock</span>
              <div className="clock-time-display">{timeState.timeShort}</div>
              <div className="clock-period">{timeState.period}</div>
              <div className="clock-shift-info">
                <span className="clock-shift-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </span>
                <span className="clock-shift-text">Shift: <strong>09:00 – 18:00</strong></span>
              </div>
              <span className="clock-timezone">Europe/London (GMT/BST)</span>
              <div className="clock-divider" />
              <div className="clock-status">
                <span className={`clock-status-dot ${clockStatus === 'CLOCKED_IN' ? 'active' : ''}`} />
                {clockStatus === 'CLOCKED_IN'
                  ? 'Currently clocked in for today'
                  : 'Ready to begin your working hours'}
              </div>
              <button
                className={`clock-action-btn ${clockStatus === 'CLOCKED_IN' ? 'clocked-in' : ''}`}
                onClick={handleClockAction}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {clockStatus === 'CLOCKED_IN' ? 'Clock Out for Today' : 'Clock In for Today'}
              </button>
            </div>

            {/* Quick Actions */}
            <div className="actions-card">
              <div className="actions-header">
                <div>
                  <div className="actions-title">Quick Actions</div>
                  <div className="actions-subtitle">Common workforce management tasks</div>
                </div>
                <Link href="/employees" className="section-link">View all</Link>
              </div>
              <div className="actions-grid">
                <Link href="/employees" className="action-item">
                  <div className="action-icon teal">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <div className="action-info">
                    <span className="action-name">Employee Directory</span>
                    <span className="action-desc">Profiles & org structure</span>
                  </div>
                  <span className="action-arrow">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </span>
                </Link>

                <Link href="/leaves" className="action-item">
                  <div className="action-icon blue">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                  <div className="action-info">
                    <span className="action-name">Leave Requests</span>
                    <span className="action-desc">Apply & approve leaves</span>
                  </div>
                  <span className="action-arrow">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </span>
                </Link>

                <Link href="/payroll" className="action-item">
                  <div className="action-icon amber">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="20" height="12" x="2" y="6" rx="2" />
                      <circle cx="12" cy="12" r="2" />
                      <path d="M6 12h.01M18 12h.01" />
                    </svg>
                  </div>
                  <div className="action-info">
                    <span className="action-name">Generate Payslip</span>
                    <span className="action-desc">Create & distribute</span>
                  </div>
                  <span className="action-arrow">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </span>
                </Link>

                <Link href="/performance" className="action-item">
                  <div className="action-icon purple">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="20" x2="18" y2="10" />
                      <line x1="12" y1="20" x2="12" y2="4" />
                      <line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                  </div>
                  <div className="action-info">
                    <span className="action-name">Run Review Cycle</span>
                    <span className="action-desc">Initiate evaluations</span>
                  </div>
                  <span className="action-arrow">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </span>
                </Link>

                <Link href="/organization/departments" className="action-item">
                  <div className="action-icon green">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                  <div className="action-info">
                    <span className="action-name">Upload Document</span>
                    <span className="action-desc">Policies & contracts</span>
                  </div>
                  <span className="action-arrow">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </span>
                </Link>

                <Link href="/admin/audit-logs" className="action-item">
                  <div className="action-icon rose">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                  </div>
                  <div className="action-info">
                    <span className="action-name">View Audit Log</span>
                    <span className="action-desc">System activity trail</span>
                  </div>
                  <span className="action-arrow">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </span>
                </Link>
              </div>
            </div>

          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
