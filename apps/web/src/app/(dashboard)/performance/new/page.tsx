'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Target,
  UserCheck,
  Calendar,
  Layers,
  Flag,
  CheckCircle2,
  AlertCircle,
  Loader2,
  TrendingUp,
  Sparkles,
  Award,
  Building2,
  ShieldAlert,
} from 'lucide-react';
import { DashboardLayout } from '../../../../components/layout/dashboard-layout';
import { api } from '../../../../lib/api-client';
import { useAuth } from '../../../../context/auth-context';
import '../../../../styles/performance.css';
import '../../../../styles/employees.css';

interface EmployeeOption {
  id: string;
  firstName: string;
  lastName: string;
  employeeNumber?: string;
  email?: string;
  department?: { name: string };
  designation?: { title: string };
}

const PERFORMANCE_CATEGORIES = [
  'Engineering & Platform',
  'Operations & Roofing Quality',
  'Client Success & Commercial',
  'Quality & Compliance',
  'Leadership & Mentorship',
  'Safety & Field Protocol',
  'UI/UX Excellence',
  'Continuous Learning',
];

export default function NewGoalPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const defaultTargetDate = new Date(new Date().setMonth(new Date().getMonth() + 3))
    .toISOString()
    .split('T')[0];

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'Engineering & Platform',
    employeeId: '',
    targetDate: defaultTargetDate,
    progress: 0,
    status: 'NOT_STARTED',
    priority: 'HIGH',
    description: '',
  });

  useEffect(() => {
    let isMounted = true;
    const fetchMetadata = async () => {
      try {
        const res = await api.get('/employees', { params: { limit: 100 } }).catch(() => ({ items: [] }));
        if (isMounted) {
          const list = Array.isArray(res?.items) ? res.items : (Array.isArray(res) ? res : []);
          setEmployees(list);

          // If current logged-in user has an employeeId, prefer that; else first employee
          const myEmp = list.find((e: EmployeeOption) => e.id === user?.employeeId);
          if (myEmp) {
            setFormData((prev) => ({ ...prev, employeeId: myEmp.id }));
          } else if (list.length > 0) {
            setFormData((prev) => ({ ...prev, employeeId: list[0].id }));
          }
        }
      } finally {
        if (isMounted) setLoadingMeta(false);
      }
    };
    fetchMetadata();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'progress' ? Number(value) : value,
    }));
  };

  const selectedEmployee = employees.find((e) => e.id === formData.employeeId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!formData.title.trim()) {
      setErrorMsg('Please provide an Objective / Key Result title.');
      return;
    }
    if (!formData.targetDate) {
      setErrorMsg('Please specify a target completion date.');
      return;
    }

    setSubmitting(true);
    try {
      let combinedDescription = formData.description.trim();
      if (formData.priority) {
        combinedDescription = `Priority: ${formData.priority}. ${combinedDescription}`.trim();
      }

      await api.post('/goals', {
        title: formData.title.trim(),
        category: formData.category,
        employeeId: formData.employeeId || undefined,
        targetDate: formData.targetDate,
        progress: Number(formData.progress),
        status: formData.status,
        description: combinedDescription || undefined,
      });

      setSuccessMsg('Performance Objective / OKR established successfully! Redirecting...');
      setTimeout(() => {
        router.push('/performance');
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to establish performance target. Please check inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="Establish Performance Target / OKR">
      <div className="performance-editorial-wrapper">
        <div className="perf-page" style={{ maxWidth: '880px', margin: '0 auto' }}>
          {/* Header & Back Link */}
          <div style={{ marginBottom: '24px' }}>
            <Link
              href="/performance"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                color: 'var(--perf-text-secondary)',
                textDecoration: 'none',
                marginBottom: '16px',
                fontWeight: 500,
              }}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Performance & OKRs</span>
            </Link>

            <h1 className="perf-title">Establish Performance Target / OKR</h1>
            <p className="perf-subtitle">
              Define quantifiable milestones, target completion horizons, performance categories, and baseline telemetry for Practical Roof Solutions Ltd.
            </p>
          </div>

          {/* Feedback Banners */}
          {errorMsg && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--perf-radius-md)',
                padding: '14px 18px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: '#dc2626',
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
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: 'var(--perf-radius-md)',
                padding: '14px 18px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: '#059669',
                fontSize: '13.5px',
              }}
            >
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Card 1: Objective & Strategic Focus */}
              <div
                style={{
                  background: 'var(--perf-surface)',
                  border: '1px solid var(--perf-border)',
                  borderRadius: 'var(--perf-radius-xl)',
                  padding: '24px',
                  boxShadow: 'var(--perf-shadow-sm)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', borderBottom: '1px solid var(--perf-border-subtle)', paddingBottom: '14px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: 'rgba(37, 99, 235, 0.08)',
                      color: 'var(--perf-accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Target className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--perf-text)', margin: 0 }}>
                      1. Objective & Strategic Focus
                    </h2>
                    <p style={{ fontSize: '12px', color: 'var(--perf-text-tertiary)', margin: '2px 0 0' }}>
                      Clearly specify the quantifiable target or key performance milestone.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="perf-form-group">
                    <label className="perf-form-label">
                      Objective / Key Result Title <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      required
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="e.g. Implement dual provider inference resilience and automated failover"
                      className="perf-form-input"
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="perf-form-group">
                      <label className="perf-form-label">
                        Performance Category <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="perf-form-input"
                      >
                        {PERFORMANCE_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="perf-form-group">
                      <label className="perf-form-label">Priority Weighting</label>
                      <select
                        name="priority"
                        value={formData.priority}
                        onChange={handleChange}
                        className="perf-form-input"
                      >
                        <option value="CRITICAL">Critical (Tier 1 Priority)</option>
                        <option value="HIGH">High (Tier 2 Priority)</option>
                        <option value="NORMAL">Normal (Standard Objective)</option>
                        <option value="LOW">Low (Exploratory / Optional)</option>
                      </select>
                    </div>
                  </div>

                  <div className="perf-form-group">
                    <label className="perf-form-label">Strategic Alignment & Context (Optional)</label>
                    <textarea
                      name="description"
                      rows={3}
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Detail key metrics, expected deliverables, and organizational impact for Practical Roof Solutions Ltd..."
                      className="perf-form-input"
                      style={{ resize: 'vertical' }}
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Ownership & Target Timeline */}
              <div
                style={{
                  background: 'var(--perf-surface)',
                  border: '1px solid var(--perf-border)',
                  borderRadius: 'var(--perf-radius-xl)',
                  padding: '24px',
                  boxShadow: 'var(--perf-shadow-sm)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', borderBottom: '1px solid var(--perf-border-subtle)', paddingBottom: '14px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: 'rgba(16, 185, 129, 0.08)',
                      color: '#059669',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--perf-text)', margin: 0 }}>
                      2. Ownership & Target Timeline
                    </h2>
                    <p style={{ fontSize: '12px', color: 'var(--perf-text-tertiary)', margin: '2px 0 0' }}>
                      Assign accountability to an employee and set target completion dates.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
                    <div className="perf-form-group">
                      <label className="perf-form-label">
                        Assigned Employee / Owner <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <select
                        name="employeeId"
                        required
                        value={formData.employeeId}
                        onChange={handleChange}
                        className="perf-form-input"
                      >
                        {employees.length === 0 && <option value="">No employees found</option>}
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.firstName} {emp.lastName} {emp.employeeNumber ? `(${emp.employeeNumber})` : ''}
                            {emp.designation?.title ? ` • ${emp.designation.title}` : ''}
                          </option>
                        ))}
                      </select>
                      {selectedEmployee && (
                        <span style={{ fontSize: '11px', color: 'var(--perf-text-tertiary)', marginTop: '4px', display: 'block' }}>
                          Department: {selectedEmployee.department?.name || 'General Operations'}
                        </span>
                      )}
                    </div>

                    <div className="perf-form-group">
                      <label className="perf-form-label">
                        Target Completion Date <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="date"
                        name="targetDate"
                        required
                        value={formData.targetDate}
                        onChange={handleChange}
                        className="perf-form-input"
                        style={{ fontFamily: 'var(--perf-font-mono)' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="perf-form-group">
                      <label className="perf-form-label">Initial Status</label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="perf-form-input"
                      >
                        <option value="NOT_STARTED">NOT STARTED</option>
                        <option value="IN_PROGRESS">IN PROGRESS</option>
                        <option value="ON_HOLD">ON HOLD</option>
                        <option value="COMPLETED">COMPLETED</option>
                      </select>
                    </div>

                    <div className="perf-form-group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label className="perf-form-label" style={{ marginBottom: 0 }}>
                          Current Progress
                        </label>
                        <span style={{ fontFamily: 'var(--perf-font-mono)', fontWeight: 600, fontSize: '13px', color: 'var(--perf-accent)' }}>
                          {formData.progress}%
                        </span>
                      </div>
                      <input
                        type="range"
                        name="progress"
                        min="0"
                        max="100"
                        value={formData.progress}
                        onChange={handleChange}
                        style={{ width: '100%', marginTop: '10px' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Card Preview */}
              <div
                style={{
                  background: 'var(--perf-surface)',
                  border: '1px solid var(--perf-border)',
                  borderRadius: 'var(--perf-radius-xl)',
                  padding: '24px',
                  boxShadow: 'var(--perf-shadow-sm)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--perf-text)' }}>
                    Live Dashboard Preview
                  </span>
                </div>

                <div className="perf-goal-card" style={{ margin: 0 }}>
                  <div className="perf-goal-top">
                    <div>
                      <div className="perf-goal-name">
                        {formData.title || 'Objective / Key Result Title'}
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--perf-text-tertiary)', fontFamily: 'var(--perf-font-mono)' }}>
                        {formData.category} {selectedEmployee ? `• ${selectedEmployee.firstName} ${selectedEmployee.lastName}` : ''}
                      </span>
                    </div>
                    <span className="perf-goal-percent">{formData.progress}%</span>
                  </div>

                  <div className="perf-progress-bar">
                    <div
                      className="perf-progress-fill"
                      style={{
                        width: `${formData.progress}%`,
                        background: formData.progress === 100 ? 'var(--perf-positive)' : 'var(--perf-accent)',
                      }}
                    />
                  </div>

                  <div className="perf-goal-meta">
                    <span>Target: {formData.targetDate || '2026-12-31'}</span>
                    <span
                      className={`perf-goal-badge ${
                        formData.progress === 100 ? 'perf-goal-completed' : 'perf-goal-active'
                      }`}
                    >
                      {formData.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: '12px',
                  marginTop: '12px',
                  marginBottom: '40px',
                }}
              >
                <Link
                  href="/performance"
                  style={{
                    padding: '10px 20px',
                    borderRadius: 'var(--perf-radius-md)',
                    border: '1px solid var(--perf-border)',
                    background: 'var(--perf-surface)',
                    color: 'var(--perf-text-secondary)',
                    textDecoration: 'none',
                    fontSize: '13.5px',
                    fontWeight: 500,
                  }}
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={submitting}
                  className="perf-btn-primary"
                  style={{
                    padding: '10px 24px',
                    fontSize: '13.5px',
                    opacity: submitting ? 0.7 : 1,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                  }}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Establishing Target...</span>
                    </>
                  ) : (
                    <>
                      <Target className="w-4 h-4" />
                      <span>Establish Performance Target</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
