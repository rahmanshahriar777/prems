'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  FolderTree,
  FileText,
  User,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Layers,
  Code2,
  Briefcase,
} from 'lucide-react';
import { DashboardLayout } from '../../../../../components/layout/dashboard-layout';
import { api } from '../../../../../lib/api-client';
import '../../../../../styles/departments.css';

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
}

export default function NewDepartmentPage() {
  const router = useRouter();

  const [existingDepts, setExistingDepts] = useState<DepartmentOption[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    parentId: '',
    headEmployeeId: '',
    description: '',
  });

  useEffect(() => {
    let isMounted = true;
    const fetchMetadata = async () => {
      try {
        const [deptsRes, empsRes] = await Promise.all([
          api.get('/departments').catch(() => []),
          api.get('/employees', { params: { limit: 100 } }).catch(() => ({ items: [] })),
        ]);
        if (isMounted) {
          if (Array.isArray(deptsRes)) setExistingDepts(deptsRes);
          if (Array.isArray(empsRes?.items)) setEmployees(empsRes.items);
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'code' ? value.toUpperCase() : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const trimmedName = formData.name.trim();
    const trimmedCode = formData.code.trim().toUpperCase();

    if (!trimmedName || !trimmedCode) {
      setErrorMsg('Department Name and Division Code are required fields.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        name: trimmedName,
        code: trimmedCode,
      };

      if (formData.description.trim()) {
        payload.description = formData.description.trim();
      }
      if (formData.parentId) {
        payload.parentId = formData.parentId;
      }
      if (formData.headEmployeeId) {
        payload.headEmployeeId = formData.headEmployeeId;
      }

      await api.post('/departments', payload);

      setSuccessMsg(`Department '${trimmedName}' created successfully! Redirecting...`);
      setTimeout(() => {
        router.push('/organization/departments');
      }, 1100);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create department. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="Create Department">
      <div className="departments-editorial-wrapper">
        <div className="dept-page" style={{ maxWidth: '880px' }}>
          {/* Header & Back Link */}
          <div style={{ marginBottom: '24px' }}>
            <Link
              href="/organization/departments"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                color: 'var(--dept-text-secondary)',
                textDecoration: 'none',
                marginBottom: '16px',
                fontWeight: 500,
              }}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Departments</span>
            </Link>

            <h1 className="dept-title">Create New Department</h1>
            <p className="dept-subtitle">
              Configure a business division, division code, hierarchy level, and operational mandate for Practical Roof Solutions Ltd.
            </p>
          </div>

          {/* Feedback Banners */}
          {errorMsg && (
            <div
              style={{
                background: 'var(--dept-rose-bg)',
                border: '1px solid var(--dept-rose)',
                borderRadius: 'var(--dept-radius-md)',
                padding: '14px 18px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: 'var(--dept-rose)',
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
                background: 'var(--dept-positive-bg)',
                border: '1px solid var(--dept-positive)',
                borderRadius: 'var(--dept-radius-md)',
                padding: '14px 18px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: 'var(--dept-positive)',
                fontSize: '13.5px',
              }}
            >
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Card 1: Division Identification & Code */}
            <div
              style={{
                background: 'var(--dept-surface)',
                border: '1px solid var(--dept-border)',
                borderRadius: 'var(--dept-radius-lg)',
                padding: '24px',
                marginBottom: '20px',
                boxShadow: 'var(--dept-shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--dept-radius-sm)',
                    background: 'var(--dept-accent-light)',
                    color: 'var(--dept-accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--dept-text-primary)' }}>
                    Department Identity & Code
                  </h3>
                  <p style={{ fontSize: '12.5px', color: 'var(--dept-text-tertiary)' }}>
                    Primary title, short division code, and organizational nesting.
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--dept-text-secondary)', marginBottom: '6px' }}>
                    Department Name <span style={{ color: 'var(--dept-rose)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Operations & Roofing"
                    required
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      background: 'var(--dept-surface-muted)',
                      border: '1px solid var(--dept-border)',
                      borderRadius: 'var(--dept-radius-md)',
                      fontSize: '13px',
                      color: 'var(--dept-text-primary)',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--dept-text-secondary)', marginBottom: '6px' }}>
                    Division Code <span style={{ color: 'var(--dept-rose)' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Code2 className="w-4 h-4" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--dept-text-tertiary)' }} />
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleChange}
                      placeholder="e.g. OPS"
                      required
                      maxLength={10}
                      style={{
                        width: '100%',
                        padding: '9px 12px 9px 36px',
                        background: 'var(--dept-surface-muted)',
                        border: '1px solid var(--dept-border)',
                        borderRadius: 'var(--dept-radius-md)',
                        fontSize: '13px',
                        fontFamily: 'var(--dept-font-mono)',
                        letterSpacing: '0.04em',
                        color: 'var(--dept-text-primary)',
                        outline: 'none',
                        textTransform: 'uppercase',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--dept-text-secondary)', marginBottom: '6px' }}>
                    Parent Department (Hierarchy Nesting)
                  </label>
                  <select
                    name="parentId"
                    value={formData.parentId}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      background: 'var(--dept-surface-muted)',
                      border: '1px solid var(--dept-border)',
                      borderRadius: 'var(--dept-radius-md)',
                      fontSize: '13px',
                      color: 'var(--dept-text-primary)',
                      outline: 'none',
                    }}
                  >
                    <option value="">-- None (Top-Level Division) --</option>
                    {existingDepts.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--dept-text-secondary)', marginBottom: '6px' }}>
                    Department Lead / Head Personnel
                  </label>
                  <select
                    name="headEmployeeId"
                    value={formData.headEmployeeId}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      background: 'var(--dept-surface-muted)',
                      border: '1px solid var(--dept-border)',
                      borderRadius: 'var(--dept-radius-md)',
                      fontSize: '13px',
                      color: 'var(--dept-text-primary)',
                      outline: 'none',
                    }}
                  >
                    <option value="">-- Unassigned / To Be Designated --</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} {emp.employeeNumber ? `(${emp.employeeNumber})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Card 2: Operational Scope & Responsibilities */}
            <div
              style={{
                background: 'var(--dept-surface)',
                border: '1px solid var(--dept-border)',
                borderRadius: 'var(--dept-radius-lg)',
                padding: '24px',
                marginBottom: '28px',
                boxShadow: 'var(--dept-shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--dept-radius-sm)',
                    background: 'var(--dept-info-bg)',
                    color: 'var(--dept-info)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--dept-text-primary)' }}>
                    Functional Scope & Mandate
                  </h3>
                  <p style={{ fontSize: '12.5px', color: 'var(--dept-text-tertiary)' }}>
                    Division responsibilities, core workflows, and operational objectives.
                  </p>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--dept-text-secondary)', marginBottom: '6px' }}>
                  Operational Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Describe the department's charter, operational jurisdiction, team coverage, or compliance mandates..."
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    background: 'var(--dept-surface-muted)',
                    border: '1px solid var(--dept-border)',
                    borderRadius: 'var(--dept-radius-md)',
                    fontSize: '13px',
                    color: 'var(--dept-text-primary)',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>
            </div>

            {/* Actions Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
              <Link
                href="/organization/departments"
                style={{
                  padding: '9px 18px',
                  borderRadius: 'var(--dept-radius-md)',
                  border: '1px solid var(--dept-border)',
                  background: 'var(--dept-surface)',
                  color: 'var(--dept-text-secondary)',
                  fontSize: '13px',
                  fontWeight: 500,
                  textDecoration: 'none',
                }}
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={submitting}
                className="dept-btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 22px',
                  opacity: submitting ? 0.7 : 1,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                }}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Department...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Create Department</span>
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
