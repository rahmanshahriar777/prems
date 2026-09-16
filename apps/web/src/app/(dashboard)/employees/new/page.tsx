'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  UserPlus,
  Building2,
  Briefcase,
  Mail,
  Phone,
  Calendar,
  MapPin,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { DashboardLayout } from '../../../../components/layout/dashboard-layout';
import { api } from '../../../../lib/api-client';
import '../../../../styles/employees.css';

interface Department {
  id: string;
  name: string;
  code: string;
}

interface Designation {
  id: string;
  title: string;
  departmentId?: string;
}

export default function NewEmployeePage() {
  const router = useRouter();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: 'MALE',
    departmentId: '',
    designationId: '',
    status: 'FULL_TIME',
    joiningDate: new Date().toISOString().split('T')[0],
    address: '',
    profileSummary: '',
  });

  useEffect(() => {
    let isMounted = true;
    const loadMetadata = async () => {
      try {
        const [deptsRes, desigsRes] = await Promise.all([
          api.get('/departments').catch(() => []),
          api.get('/designations').catch(() => []),
        ]);
        if (isMounted) {
          if (Array.isArray(deptsRes)) setDepartments(deptsRes);
          if (Array.isArray(desigsRes)) setDesignations(desigsRes);
        }
      } finally {
        if (isMounted) setLoadingMeta(false);
      }
    };
    loadMetadata();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
      setErrorMsg('First Name, Last Name, and Work Email are required fields.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        status: formData.status,
        joiningDate: formData.joiningDate,
      };

      if (formData.phone.trim()) payload.phone = formData.phone.trim();
      if (formData.dateOfBirth) payload.dateOfBirth = formData.dateOfBirth;
      if (formData.gender) payload.gender = formData.gender;
      if (formData.address.trim()) payload.address = formData.address.trim();
      if (formData.profileSummary.trim()) payload.profileSummary = formData.profileSummary.trim();
      if (formData.departmentId) payload.departmentId = formData.departmentId;
      if (formData.designationId) payload.designationId = formData.designationId;

      await api.post('/employees', payload);

      setSuccessMsg('Employee profile registered successfully. Redirecting to directory...');
      setTimeout(() => {
        router.push('/employees');
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create employee record. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter designations matching selected department if applicable
  const availableDesignations = formData.departmentId
    ? designations.filter(
        (d) => !d.departmentId || d.departmentId === formData.departmentId
      )
    : designations;

  return (
    <DashboardLayout title="Onboard New Employee">
      <div className="employees-editorial-wrapper">
        <div className="emp-page" style={{ maxWidth: '880px' }}>
          {/* Header & Back Link */}
          <div style={{ marginBottom: '24px' }}>
            <Link
              href="/employees"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                color: 'var(--emp-text-secondary)',
                textDecoration: 'none',
                marginBottom: '16px',
                fontWeight: 500,
              }}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Directory</span>
            </Link>

            <h1 className="emp-title">Onboard New Employee</h1>
            <p className="emp-subtitle">
              Register personnel credentials, organizational assignment, and contractual details for Practical Roof Solutions Ltd.
            </p>
          </div>

          {/* Feedback Banners */}
          {errorMsg && (
            <div
              style={{
                background: 'var(--emp-rose-bg)',
                border: '1px solid var(--emp-rose)',
                borderRadius: 'var(--emp-radius-md)',
                padding: '14px 18px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: 'var(--emp-rose)',
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
                background: 'var(--emp-positive-bg)',
                border: '1px solid var(--emp-positive)',
                borderRadius: 'var(--emp-radius-md)',
                padding: '14px 18px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: 'var(--emp-positive)',
                fontSize: '13.5px',
              }}
            >
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Card 1: Personal Details */}
            <div
              style={{
                background: 'var(--emp-surface)',
                border: '1px solid var(--emp-border)',
                borderRadius: 'var(--emp-radius-lg)',
                padding: '24px',
                marginBottom: '20px',
                boxShadow: 'var(--emp-shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--emp-radius-sm)',
                    background: 'var(--emp-accent-light)',
                    color: 'var(--emp-accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--emp-text-primary)' }}>
                    Personal Identity & Contact
                  </h3>
                  <p style={{ fontSize: '12.5px', color: 'var(--emp-text-tertiary)' }}>
                    Core identification and communication endpoints.
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--emp-text-secondary)', marginBottom: '6px' }}>
                    First Name <span style={{ color: 'var(--emp-rose)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="e.g. David"
                    required
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      background: 'var(--emp-surface-muted)',
                      border: '1px solid var(--emp-border-subtle)',
                      borderRadius: 'var(--emp-radius-md)',
                      fontSize: '13px',
                      color: 'var(--emp-text-primary)',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--emp-text-secondary)', marginBottom: '6px' }}>
                    Last Name <span style={{ color: 'var(--emp-rose)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="e.g. Miller"
                    required
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      background: 'var(--emp-surface-muted)',
                      border: '1px solid var(--emp-border-subtle)',
                      borderRadius: 'var(--emp-radius-md)',
                      fontSize: '13px',
                      color: 'var(--emp-text-primary)',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--emp-text-secondary)', marginBottom: '6px' }}>
                    Work Email Address <span style={{ color: 'var(--emp-rose)' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail className="w-4 h-4" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--emp-text-tertiary)' }} />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="e.g. david.m@practicalroof.co.uk"
                      required
                      style={{
                        width: '100%',
                        padding: '9px 12px 9px 36px',
                        background: 'var(--emp-surface-muted)',
                        border: '1px solid var(--emp-border-subtle)',
                        borderRadius: 'var(--emp-radius-md)',
                        fontSize: '13px',
                        color: 'var(--emp-text-primary)',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--emp-text-secondary)', marginBottom: '6px' }}>
                    Contact Phone
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Phone className="w-4 h-4" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--emp-text-tertiary)' }} />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="e.g. +44 20 7946 0958"
                      style={{
                        width: '100%',
                        padding: '9px 12px 9px 36px',
                        background: 'var(--emp-surface-muted)',
                        border: '1px solid var(--emp-border-subtle)',
                        borderRadius: 'var(--emp-radius-md)',
                        fontSize: '13px',
                        color: 'var(--emp-text-primary)',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--emp-text-secondary)', marginBottom: '6px' }}>
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      background: 'var(--emp-surface-muted)',
                      border: '1px solid var(--emp-border-subtle)',
                      borderRadius: 'var(--emp-radius-md)',
                      fontSize: '13px',
                      color: 'var(--emp-text-primary)',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--emp-text-secondary)', marginBottom: '6px' }}>
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      background: 'var(--emp-surface-muted)',
                      border: '1px solid var(--emp-border-subtle)',
                      borderRadius: 'var(--emp-radius-md)',
                      fontSize: '13px',
                      color: 'var(--emp-text-primary)',
                      outline: 'none',
                    }}
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other / Non-binary</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Card 2: Organization & Employment Status */}
            <div
              style={{
                background: 'var(--emp-surface)',
                border: '1px solid var(--emp-border)',
                borderRadius: 'var(--emp-radius-lg)',
                padding: '24px',
                marginBottom: '20px',
                boxShadow: 'var(--emp-shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--emp-radius-sm)',
                    background: 'var(--emp-info-bg)',
                    color: 'var(--emp-info)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--emp-text-primary)' }}>
                    Organizational Assignment
                  </h3>
                  <p style={{ fontSize: '12.5px', color: 'var(--emp-text-tertiary)' }}>
                    Department structure, title designation, and contractual cadence.
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--emp-text-secondary)', marginBottom: '6px' }}>
                    Department
                  </label>
                  <select
                    name="departmentId"
                    value={formData.departmentId}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      background: 'var(--emp-surface-muted)',
                      border: '1px solid var(--emp-border-subtle)',
                      borderRadius: 'var(--emp-radius-md)',
                      fontSize: '13px',
                      color: 'var(--emp-text-primary)',
                      outline: 'none',
                    }}
                  >
                    <option value="">-- Unassigned / Direct --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--emp-text-secondary)', marginBottom: '6px' }}>
                    Designation / Title
                  </label>
                  <select
                    name="designationId"
                    value={formData.designationId}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      background: 'var(--emp-surface-muted)',
                      border: '1px solid var(--emp-border-subtle)',
                      borderRadius: 'var(--emp-radius-md)',
                      fontSize: '13px',
                      color: 'var(--emp-text-primary)',
                      outline: 'none',
                    }}
                  >
                    <option value="">-- Unassigned / General --</option>
                    {availableDesignations.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--emp-text-secondary)', marginBottom: '6px' }}>
                    Employment Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      background: 'var(--emp-surface-muted)',
                      border: '1px solid var(--emp-border-subtle)',
                      borderRadius: 'var(--emp-radius-md)',
                      fontSize: '13px',
                      color: 'var(--emp-text-primary)',
                      outline: 'none',
                    }}
                  >
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="CONTRACT">Contractor</option>
                    <option value="PROBATIONARY">Probationary</option>
                    <option value="INTERN">Intern</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--emp-text-secondary)', marginBottom: '6px' }}>
                    Official Joining Date
                  </label>
                  <input
                    type="date"
                    name="joiningDate"
                    value={formData.joiningDate}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      background: 'var(--emp-surface-muted)',
                      border: '1px solid var(--emp-border-subtle)',
                      borderRadius: 'var(--emp-radius-md)',
                      fontSize: '13px',
                      color: 'var(--emp-text-primary)',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Card 3: Location & Profile Summary */}
            <div
              style={{
                background: 'var(--emp-surface)',
                border: '1px solid var(--emp-border)',
                borderRadius: 'var(--emp-radius-lg)',
                padding: '24px',
                marginBottom: '28px',
                boxShadow: 'var(--emp-shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--emp-radius-sm)',
                    background: 'var(--emp-purple-bg)',
                    color: 'var(--emp-purple)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--emp-text-primary)' }}>
                    Workstation & Professional Summary
                  </h3>
                  <p style={{ fontSize: '12.5px', color: 'var(--emp-text-tertiary)' }}>
                    Primary work base and executive summary for organizational records.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--emp-text-secondary)', marginBottom: '6px' }}>
                    Work Location / Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="e.g. London Office, 102 Fleet Street, London EC4A 2AE"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      background: 'var(--emp-surface-muted)',
                      border: '1px solid var(--emp-border-subtle)',
                      borderRadius: 'var(--emp-radius-md)',
                      fontSize: '13px',
                      color: 'var(--emp-text-primary)',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--emp-text-secondary)', marginBottom: '6px' }}>
                    Professional Summary / Notes
                  </label>
                  <textarea
                    name="profileSummary"
                    value={formData.profileSummary}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Provide a brief summary of primary roles, responsibilities, or onboarding directives..."
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      background: 'var(--emp-surface-muted)',
                      border: '1px solid var(--emp-border-subtle)',
                      borderRadius: 'var(--emp-radius-md)',
                      fontSize: '13px',
                      color: 'var(--emp-text-primary)',
                      outline: 'none',
                      resize: 'vertical',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
              <Link
                href="/employees"
                style={{
                  padding: '9px 18px',
                  borderRadius: 'var(--emp-radius-md)',
                  border: '1px solid var(--emp-border)',
                  background: 'var(--emp-surface)',
                  color: 'var(--emp-text-secondary)',
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
                className="emp-btn-primary"
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
                    <span>Registering Personnel...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Create Employee Record</span>
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
