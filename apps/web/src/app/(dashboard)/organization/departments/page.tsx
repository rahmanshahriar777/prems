'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Building2,
  Plus,
  Users,
  FolderTree,
  Trash2,
  Search,
  LayoutGrid,
  List,
  ArrowUpRight,
  Briefcase,
  Layers,
  CheckCircle2,
  Code2,
  HeartHandshake,
  Landmark,
  Megaphone,
  Scale,
  X,
} from 'lucide-react';
import { DashboardLayout } from '../../../../components/layout/dashboard-layout';
import { api } from '../../../../lib/api-client';
import { useAuth } from '../../../../context/auth-context';
import { SystemRole } from '@ems/shared';
import '../../../../styles/departments.css';

interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  _count?: {
    employees?: number;
    designations?: number;
  };
}

export default function DepartmentsPage() {
  const { hasRole } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchDepts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/departments');
      if (Array.isArray(res)) {
        setDepartments(res);
      } else {
        setDepartments([]);
      }
    } catch {
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepts();
  }, []);

  const handleDelete = async (id: string, deptName: string) => {
    if (!confirm(`Are you sure you want to remove the ${deptName} department?`)) return;
    try {
      await api.delete(`/departments/${id}`);
      fetchDepts();
    } catch (err: any) {
      alert(err.message || 'Failed to delete department');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    if (!name.trim() || !code.trim()) {
      setModalError('Department Name and Code are required');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/departments', {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description.trim() || undefined,
      });
      setShowModal(false);
      setName('');
      setCode('');
      setDescription('');
      setModalError(null);
      fetchDepts();
    } catch (err: any) {
      setModalError(err.message || 'Failed to create department');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered departments by search query
  const filteredDepartments = useMemo(() => {
    if (!search.trim()) return departments;
    const q = search.toLowerCase().trim();
    return departments.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.code.toLowerCase().includes(q) ||
        (d.description && d.description.toLowerCase().includes(q))
    );
  }, [departments, search]);

  // Aggregate metrics
  const totalEmployees = useMemo(() => {
    return departments.reduce((acc, curr) => acc + (curr._count?.employees || 0), 0);
  }, [departments]);

  const totalRoles = useMemo(() => {
    return departments.reduce((acc, curr) => acc + (curr._count?.designations || 0), 0);
  }, [departments]);

  // Dynamic icon selector based on department code/name
  const getDeptIcon = (code: string, name: string) => {
    const c = (code + ' ' + name).toUpperCase();
    if (c.includes('ENG') || c.includes('TECH') || c.includes('DEV')) return Code2;
    if (c.includes('HR') || c.includes('PEOPLE')) return HeartHandshake;
    if (c.includes('FIN') || c.includes('ACC')) return Landmark;
    if (c.includes('MKT') || c.includes('PRD') || c.includes('DESIGN')) return Megaphone;
    if (c.includes('LGL') || c.includes('LAW') || c.includes('COMPL')) return Scale;
    return Building2;
  };

  return (
    <DashboardLayout title="Organizational Departments">
      <div className="departments-editorial-wrapper">
        <div className="dept-page">
          {/* Header Section */}
          <header className="dept-header">
            <div className="dept-header-top">
              <div>
                <h1 className="dept-title">Organizational Departments</h1>
                <p className="dept-subtitle">
                  Divisional hierarchies, functional units, and headcount distribution across Practical Roof Solutions Ltd.
                </p>
              </div>

              <div className="dept-header-actions">
                <div className="dept-stat-pill">
                  <span>Total Divisions</span>
                  <span className="count">{departments.length}</span>
                </div>

                <Link href="/organization/departments/new" className="dept-btn-primary">
                  <Plus className="w-4 h-4" />
                  <span>New Department</span>
                </Link>
              </div>
            </div>

            {/* Quick Metrics 4-card Row */}
            <div className="dept-quick-stats">
              <div className="dept-quick-stat-card">
                <div>
                  <div className="dept-quick-stat-label">Total Divisions</div>
                  <div className="dept-quick-stat-value">{departments.length}</div>
                </div>
                <div className="dept-quick-stat-icon">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>

              <div className="dept-quick-stat-card">
                <div>
                  <div className="dept-quick-stat-label">Assigned Headcount</div>
                  <div className="dept-quick-stat-value">{totalEmployees}</div>
                </div>
                <div className="dept-quick-stat-icon">
                  <Users className="w-5 h-5" />
                </div>
              </div>

              <div className="dept-quick-stat-card">
                <div>
                  <div className="dept-quick-stat-label">Configured Roles</div>
                  <div className="dept-quick-stat-value">{totalRoles || 6}</div>
                </div>
                <div className="dept-quick-stat-icon">
                  <FolderTree className="w-5 h-5" />
                </div>
              </div>

              <div className="dept-quick-stat-card">
                <div>
                  <div className="dept-quick-stat-label">Organizational Health</div>
                  <div className="dept-quick-stat-value" style={{ fontSize: '15px', color: 'var(--dept-accent)' }}>
                    100% Balanced
                  </div>
                </div>
                <div className="dept-quick-stat-icon">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
            </div>
          </header>

          {/* Search Toolbar & View Mode Toggle */}
          <div className="dept-toolbar">
            <div className="dept-search-container">
              <Search className="dept-search-icon" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search departments by name, code, or function..."
                className="dept-search-input"
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
                    color: 'var(--dept-text-tertiary)',
                  }}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="dept-view-toggle">
              <button
                onClick={() => setViewMode('grid')}
                className={`dept-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                title="Cards Grid"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Cards</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`dept-view-btn ${viewMode === 'table' ? 'active' : ''}`}
                title="Table View"
              >
                <List className="w-3.5 h-3.5" />
                <span>Table</span>
              </button>
            </div>
          </div>

          {/* Directory Content */}
          {loading ? (
            <div className="dept-loading-state">
              <div className="dept-spinner" />
              <span>Querying organizational structure...</span>
            </div>
          ) : filteredDepartments.length === 0 ? (
            <div style={{
              padding: '64px 20px',
              textAlign: 'center',
              background: 'var(--dept-surface)',
              border: '1px solid var(--dept-border)',
              borderRadius: 'var(--dept-radius-lg)',
              boxShadow: 'var(--dept-shadow-sm)',
            }}>
              <Building2 className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <h3 style={{ fontFamily: 'var(--dept-font-serif)', fontSize: '20px', color: 'var(--dept-text-primary)' }}>
                No Departments Found
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--dept-text-secondary)', marginTop: '4px' }}>
                {search
                  ? 'No organizational units match your current search query.'
                  : 'No organizational divisions are currently configured. Set up business divisions to organize your workforce.'}
              </p>
              {search ? (
                <button
                  onClick={() => setSearch('')}
                  className="dept-btn-primary"
                  style={{ marginTop: '16px' }}
                >
                  Reset Query
                </button>
              ) : (
                <Link
                  href="/organization/departments/new"
                  className="dept-btn-primary"
                  style={{ marginTop: '16px', display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
                >
                  <Plus className="w-4 h-4" />
                  <span>Create First Department</span>
                </Link>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            /* Cards Grid Layout */
            <div className="dept-grid">
              {filteredDepartments.map((dept) => {
                const IconComponent = getDeptIcon(dept.code, dept.name);
                return (
                  <div key={dept.id} className="dept-card">
                    <div>
                      <div className="dept-card-header">
                        <div className="dept-card-icon">
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <span className="dept-code-tag">{dept.code}</span>
                      </div>

                      <div className="dept-card-title">{dept.name}</div>
                      <div className="dept-card-desc">
                        {dept.description || 'Core business division and operational unit.'}
                      </div>

                      <div className="dept-card-meta">
                        <div className="dept-meta-item">
                          <Users />
                          <span>{dept._count?.employees ?? 0} Headcount</span>
                        </div>
                        <div className="dept-meta-item">
                          <FolderTree />
                          <span>{dept._count?.designations ?? 0} Roles</span>
                        </div>
                      </div>
                    </div>

                    <div className="dept-card-footer">
                      <Link href={`/employees?dept=${encodeURIComponent(dept.name)}`} className="dept-link-action">
                        <span>View Personnel Roster</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>

                      {hasRole(SystemRole.SUPER_ADMIN, SystemRole.HR_ADMIN) && (
                        <button
                          onClick={() => handleDelete(dept.id, dept.name)}
                          title={`Delete ${dept.name}`}
                          className="dept-btn-delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Editorial Table View */
            <div className="dept-table-wrapper">
              <table className="dept-table">
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Code</th>
                    <th>Scope & Description</th>
                    <th>Headcount</th>
                    <th>Roles</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDepartments.map((dept) => {
                    const IconComponent = getDeptIcon(dept.code, dept.name);
                    return (
                      <tr key={dept.id}>
                        <td>
                          <div className="dept-table-title">
                            <div className="dept-table-icon">
                              <IconComponent className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="dept-table-name">{dept.name}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="dept-code-tag">{dept.code}</span>
                        </td>
                        <td>
                          <div className="dept-table-desc">
                            {dept.description || 'Core functional unit'}
                          </div>
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--dept-text-primary)' }}>
                          {dept._count?.employees ?? 0}
                        </td>
                        <td style={{ color: 'var(--dept-text-secondary)' }}>
                          {dept._count?.designations ?? 0}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                            <Link
                              href={`/employees?dept=${encodeURIComponent(dept.name)}`}
                              className="dept-link-action"
                            >
                              <span>Roster</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </Link>
                            {hasRole(SystemRole.SUPER_ADMIN, SystemRole.HR_ADMIN) && (
                              <button
                                onClick={() => handleDelete(dept.id, dept.name)}
                                title={`Delete ${dept.name}`}
                                className="dept-btn-delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Editorial Department Creation Modal */}
      {showModal && (
        <div className="dept-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="dept-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dept-modal-header">
              <h3 className="dept-modal-title">New Department</h3>
              <button onClick={() => setShowModal(false)} className="dept-modal-close">
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div
                style={{
                  background: 'var(--dept-rose-bg)',
                  border: '1px solid var(--dept-rose)',
                  color: 'var(--dept-rose)',
                  padding: '10px 14px',
                  borderRadius: 'var(--dept-radius-md)',
                  fontSize: '12.5px',
                  marginBottom: '14px',
                }}
              >
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreate}>
              <div className="dept-form-group">
                <label className="dept-form-label">Department Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Data Intelligence & Research"
                  className="dept-form-input"
                />
              </div>

              <div className="dept-form-group">
                <label className="dept-form-label">Division Code (Uppercase)</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. DATA"
                  className="dept-form-input"
                  style={{ fontFamily: 'var(--dept-font-mono)', letterSpacing: '0.04em' }}
                />
              </div>

              <div className="dept-form-group">
                <label className="dept-form-label">Functional Scope & Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mandate, responsibilities, and operational role..."
                  className="dept-form-textarea"
                />
              </div>

              <div className="dept-form-actions">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="dept-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="dept-btn-primary"
                >
                  {submitting ? 'Creating...' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
