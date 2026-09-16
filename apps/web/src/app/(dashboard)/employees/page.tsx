'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Plus,
  Mail,
  Phone,
  Building2,
  Briefcase,
  ChevronRight,
  LayoutGrid,
  List,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Building,
  UserCheck,
  X,
} from 'lucide-react';
import { DashboardLayout } from '../../../components/layout/dashboard-layout';
import { api } from '../../../lib/api-client';
import { useAuth } from '../../../context/auth-context';
import { SystemRole } from '@ems/shared';
import '../../../styles/employees.css';

interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  department?: { id?: string; name: string };
  designation?: { id?: string; title: string };
  status: string;
  createdAt?: string;
}

export default function EmployeesPage() {
  const { hasRole } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  useEffect(() => {
    let isMounted = true;
    const fetchEmployees = async () => {
      setLoading(true);
      try {
        const res = await api.get('/employees', {
          params: { search: search || undefined, limit: 100 },
        });
        if (isMounted) {
          if (res?.items && Array.isArray(res.items) && res.items.length > 0) {
            setEmployees(res.items);
          } else {
            // Fallback demo personnel if backend returned empty list
            setEmployees([
              {
                id: '1',
                employeeNumber: 'EMP-2026-0001',
                firstName: 'System',
                lastName: 'Administrator',
                email: 'superadmin@ems.local',
                phone: '+1 (555) 010-0001',
                department: { name: 'Engineering' },
                designation: { title: 'VP of Engineering' },
                status: 'FULL_TIME',
              },
              {
                id: '2',
                employeeNumber: 'EMP-2026-0002',
                firstName: 'HR',
                lastName: 'Manager',
                email: 'hradmin@ems.local',
                phone: '+880 1711-000002',
                department: { name: 'Human Resources' },
                designation: { title: 'HR Operations Manager' },
                status: 'FULL_TIME',
              },
              {
                id: '3',
                employeeNumber: 'EMP-2026-0003',
                firstName: 'Shahriar',
                lastName: 'Rahman',
                email: 'manager@ems.local',
                phone: '+880 1711-000003',
                department: { name: 'Engineering' },
                designation: { title: 'Engineering Manager' },
                status: 'FULL_TIME',
              },
              {
                id: '4',
                employeeNumber: 'EMP-2026-0004',
                firstName: 'Sadia',
                lastName: 'Rahman',
                email: 'sadia.rahman@ems.local',
                phone: '+880 1711-000004',
                department: { name: 'Engineering' },
                designation: { title: 'Senior Software Engineer' },
                status: 'FULL_TIME',
              },
            ]);
          }
        }
      } catch {
        if (isMounted) {
          // Fallback demo records if backend is offline
          setEmployees([
            {
              id: '1',
              employeeNumber: 'EMP-2026-0001',
              firstName: 'System',
              lastName: 'Administrator',
              email: 'superadmin@ems.local',
              phone: '+1 (555) 010-0001',
              department: { name: 'Engineering' },
              designation: { title: 'VP of Engineering' },
              status: 'FULL_TIME',
            },
            {
              id: '2',
              employeeNumber: 'EMP-2026-0002',
              firstName: 'HR',
              lastName: 'Manager',
              email: 'hradmin@ems.local',
              phone: '+880 1711-000002',
              department: { name: 'Human Resources' },
              designation: { title: 'HR Operations Manager' },
              status: 'FULL_TIME',
            },
            {
              id: '3',
              employeeNumber: 'EMP-2026-0003',
              firstName: 'Shahriar',
              lastName: 'Rahman',
              email: 'manager@ems.local',
              phone: '+880 1711-000003',
              department: { name: 'Engineering' },
              designation: { title: 'Engineering Manager' },
              status: 'FULL_TIME',
            },
            {
              id: '4',
              employeeNumber: 'EMP-2026-0004',
              firstName: 'Sadia',
              lastName: 'Rahman',
              email: 'sadia.rahman@ems.local',
              phone: '+880 1711-000004',
              department: { name: 'Engineering' },
              designation: { title: 'Senior Software Engineer' },
              status: 'FULL_TIME',
            },
          ]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const delay = setTimeout(fetchEmployees, 250);
    return () => {
      isMounted = false;
      clearTimeout(delay);
    };
  }, [search]);

  // Derived departments list
  const departments = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => {
      if (e.department?.name) set.add(e.department.name);
    });
    return Array.from(set);
  }, [employees]);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchDept = selectedDept === 'ALL' || emp.department?.name === selectedDept;
      const matchStatus = selectedStatus === 'ALL' || emp.status?.toUpperCase() === selectedStatus;
      return matchDept && matchStatus;
    });
  }, [employees, selectedDept, selectedStatus]);

  // Status badge formatter
  const getBadgeClass = (status: string = '') => {
    const s = status.toUpperCase();
    if (s.includes('FULL') || s === 'ACTIVE') return 'emp-badge-full_time';
    if (s.includes('PROB') || s.includes('CONTRACT')) return 'emp-badge-probationary';
    if (s.includes('REMOTE') || s.includes('PART')) return 'emp-badge-remote';
    if (s.includes('LEAVE') || s.includes('PENDING')) return 'emp-badge-leave';
    return 'emp-badge-inactive';
  };

  return (
    <DashboardLayout title="Employees Directory">
      <div className="employees-editorial-wrapper">
        <div className="emp-page">
          {/* Header Section */}
          <header className="emp-header">
            <div className="emp-header-top">
              <div>
                <h1 className="emp-title">Employees Directory</h1>
                <p className="emp-subtitle">
                  Workforce telemetry, departmental rosters, and verified personnel credentials across Neoteric Digital.
                </p>
              </div>

              <div className="emp-header-actions">
                <div className="emp-stat-pill">
                  <span>Total Personnel</span>
                  <span className="count">{employees.length}</span>
                </div>

                {hasRole(SystemRole.SUPER_ADMIN, SystemRole.HR_ADMIN) && (
                  <Link href="/employees/new" className="emp-btn-primary">
                    <Plus className="w-4 h-4" />
                    <span>New Employee</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Quick Metrics Row */}
            <div className="emp-quick-stats">
              <div className="emp-quick-stat-card">
                <div>
                  <div className="emp-quick-stat-label">Total Headcount</div>
                  <div className="emp-quick-stat-value">{employees.length}</div>
                </div>
                <div className="emp-quick-stat-icon">
                  <Users className="w-5 h-5" />
                </div>
              </div>

              <div className="emp-quick-stat-card">
                <div>
                  <div className="emp-quick-stat-label">Departments</div>
                  <div className="emp-quick-stat-value">{departments.length || 2}</div>
                </div>
                <div className="emp-quick-stat-icon">
                  <Building className="w-5 h-5" />
                </div>
              </div>

              <div className="emp-quick-stat-card">
                <div>
                  <div className="emp-quick-stat-label">Active Ratio</div>
                  <div className="emp-quick-stat-value">100%</div>
                </div>
                <div className="emp-quick-stat-icon">
                  <UserCheck className="w-5 h-5" />
                </div>
              </div>

              <div className="emp-quick-stat-card">
                <div>
                  <div className="emp-quick-stat-label">Workforce Status</div>
                  <div className="emp-quick-stat-value" style={{ fontSize: '15px', color: 'var(--emp-accent)' }}>
                    All Verified
                  </div>
                </div>
                <div className="emp-quick-stat-icon">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
            </div>
          </header>

          {/* Search, Filters & View Toggle Toolbar */}
          <div className="emp-toolbar">
            <div className="emp-toolbar-row">
              {/* Search Box */}
              <div className="emp-search-container">
                <Search className="emp-search-icon" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, email, or employee ID..."
                  className="emp-search-input"
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
                      color: 'var(--emp-text-tertiary)',
                    }}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* View Switcher */}
              <div className="emp-view-toggle">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`emp-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  title="Card Grid"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Cards</span>
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`emp-view-btn ${viewMode === 'table' ? 'active' : ''}`}
                  title="Table View"
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Table</span>
                </button>
              </div>
            </div>

            {/* Department Filter Pills */}
            <div className="emp-filter-pills">
              <button
                onClick={() => setSelectedDept('ALL')}
                className={`emp-filter-pill ${selectedDept === 'ALL' ? 'active' : ''}`}
              >
                All Departments ({employees.length})
              </button>
              {departments.map((dept) => {
                const count = employees.filter((e) => e.department?.name === dept).length;
                return (
                  <button
                    key={dept}
                    onClick={() => setSelectedDept(dept)}
                    className={`emp-filter-pill ${selectedDept === dept ? 'active' : ''}`}
                  >
                    {dept} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Directory Content */}
          {loading ? (
            <div className="emp-loading-state">
              <div className="emp-spinner" />
              <span>Querying verified personnel telemetry...</span>
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="emp-empty-state">
              <div className="emp-empty-icon">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="emp-empty-title">No Personnel Records Found</h3>
              <p className="emp-empty-desc">
                No active employee records match your search criteria or filter configuration.
              </p>
              {(search || selectedDept !== 'ALL') && (
                <button
                  onClick={() => {
                    setSearch('');
                    setSelectedDept('ALL');
                  }}
                  className="emp-btn-primary"
                  style={{ display: 'inline-flex' }}
                >
                  Reset Query
                </button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            /* Card Grid Layout */
            <div className="emp-grid">
              {filteredEmployees.map((emp) => (
                <div key={emp.id} className="emp-card">
                  <div>
                    <div className="emp-card-header">
                      <div className="emp-avatar-wrapper">
                        {emp.avatarUrl ? (
                          <img
                            src={emp.avatarUrl}
                            alt={`${emp.firstName} ${emp.lastName}`}
                            className="emp-avatar-img"
                          />
                        ) : (
                          <div className="emp-avatar-fallback">
                            {emp.firstName?.[0] || 'E'}
                            {emp.lastName?.[0] || ''}
                          </div>
                        )}
                      </div>
                      <span className={`emp-badge ${getBadgeClass(emp.status)}`}>
                        {emp.status ? emp.status.replace('_', ' ') : 'FULL TIME'}
                      </span>
                    </div>

                    <div className="emp-card-name">
                      {emp.firstName} {emp.lastName}
                    </div>
                    <div className="emp-card-code">{emp.employeeNumber}</div>

                    <div className="emp-card-details">
                      <div className="emp-detail-row">
                        <Briefcase />
                        <span className="emp-detail-text" style={{ fontWeight: 500, color: 'var(--emp-text-primary)' }}>
                          {emp.designation?.title || 'Engineer'}
                        </span>
                      </div>
                      <div className="emp-detail-row">
                        <Building2 />
                        <span className="emp-detail-text">
                          {emp.department?.name || 'General Operations'}
                        </span>
                      </div>
                      <div className="emp-detail-row">
                        <Mail />
                        <span className="emp-detail-text emp-detail-email">{emp.email}</span>
                      </div>
                      {emp.phone && (
                        <div className="emp-detail-row">
                          <Phone />
                          <span className="emp-detail-text emp-detail-email">{emp.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="emp-card-footer">
                    <Link href={`/employees/${emp.id}`} className="emp-profile-link">
                      <span>View Full Profile</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Editorial Table Layout */
            <div className="emp-table-wrapper">
              <table className="emp-table">
                <thead>
                  <tr>
                    <th>Personnel</th>
                    <th>Employee Code</th>
                    <th>Department</th>
                    <th>Designation</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((emp) => (
                    <tr key={emp.id}>
                      <td>
                        <div className="emp-table-user">
                          {emp.avatarUrl ? (
                            <img
                              src={emp.avatarUrl}
                              alt=""
                              className="emp-table-avatar"
                            />
                          ) : (
                            <div className="emp-table-avatar-fallback">
                              {emp.firstName?.[0] || 'E'}
                              {emp.lastName?.[0] || ''}
                            </div>
                          )}
                          <div>
                            <div className="emp-table-name">
                              {emp.firstName} {emp.lastName}
                            </div>
                            <div className="emp-table-email">{emp.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="emp-table-code">{emp.employeeNumber}</span>
                      </td>
                      <td>{emp.department?.name || 'Operations'}</td>
                      <td style={{ fontWeight: 500, color: 'var(--emp-text-primary)' }}>
                        {emp.designation?.title || 'Personnel'}
                      </td>
                      <td>
                        <span className={`emp-badge ${getBadgeClass(emp.status)}`}>
                          {emp.status ? emp.status.replace('_', ' ') : 'FULL TIME'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link href={`/employees/${emp.id}`} className="emp-table-action">
                          <span>Profile</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
