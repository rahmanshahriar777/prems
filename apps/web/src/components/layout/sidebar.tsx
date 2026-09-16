'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Building2,
  Clock,
  Calendar,
  CalendarDays,
  Banknote,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/auth-context';
import { SystemRole } from '@ems/shared';
import { AvatarModal } from '../profile/avatar-modal';
import '../../styles/sidebar.css';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  isLive?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user, logout, hasRole } = useAuth();
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  const navSections: NavSection[] = [
    {
      title: 'Overview',
      items: [
        { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }
      ]
    },
    {
      title: 'People & Org',
      items: [
        { label: 'Employees', href: '/employees', icon: Users, badge: '4' },
        { label: 'Departments', href: '/organization/departments', icon: Building2, badge: '5' },
        { label: 'Calendar', href: '/calendar', icon: Calendar, badge: 'Today' },
        { label: 'Attendance', href: '/attendance', icon: Clock, badge: 'Active' },
        { label: 'Leaves', href: '/leaves', icon: CalendarDays },
        { label: 'Payroll', href: '/payroll', icon: Banknote, badge: 'Aug Paid' },
        { label: 'Performance', href: '/performance', icon: TrendingUp, badge: '4.85 ★' },
      ]
    }
  ];

  // Compliance section for authorized roles
  if (hasRole(SystemRole.SUPER_ADMIN, SystemRole.HR_ADMIN, SystemRole.AUDITOR)) {
    navSections.push({
      title: 'Compliance & Audit',
      items: [
        { label: 'Audit Trail', href: '/admin/audit-logs', icon: ShieldCheck, badge: 'SOC2' }
      ]
    });
  }

  // AI Suite section
  navSections.push({
    title: 'Intelligence',
    items: [
      { label: 'AI Assistant', href: '/ai-assistant', icon: Sparkles, badge: 'LIVE', isLive: true }
    ]
  });

  const isItemActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    if (href === '/admin/audit-logs') {
      return pathname.includes('audit-logs');
    }
    return pathname === href || pathname.startsWith(href);
  };

  const userInitials = user?.firstName
    ? `${user.firstName.charAt(0)}${user.lastName ? user.lastName.charAt(0) : ''}`
    : 'SR';

  return (
    <aside className="sidebar-editorial">
      {/* Brand Header */}
      <Link href="/dashboard" className="sidebar-brand">
        <div className="sidebar-brand-left">
          <div className="sidebar-brand-mark">N</div>
          <div>
            <div className="sidebar-brand-title">Neoteric</div>
            <div className="sidebar-brand-sub">
              <span className="sidebar-brand-label">Digital</span>
              <span className="sidebar-brand-dot"></span>
              <span className="sidebar-brand-type">EMS</span>
            </div>
          </div>
        </div>

        <span className="sidebar-system-badge">
          v1.0
        </span>
      </Link>

      {/* Navigation Scroll Area */}
      <nav className="sidebar-nav-container">
        {navSections.map((section) => (
          <div key={section.title} className="sidebar-section">
            <div className="sidebar-section-label">{section.title}</div>
            {section.items.map((item) => {
              const active = isItemActive(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-link ${active ? 'active' : ''}`}
                >
                  <Icon className="sidebar-icon" />
                  <span>{item.label}</span>

                  {item.badge && (
                    <span className={`sidebar-badge ${item.isLive ? 'live' : ''}`}>
                      {item.isLive && <span className="sidebar-badge-dot" />}
                      <span>{item.badge}</span>
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User Footer Profile */}
      <div className="sidebar-footer">
        <div className="sidebar-user-card">
          <button
            type="button"
            onClick={() => setIsAvatarModalOpen(true)}
            title="Click to change your profile picture"
            className="sidebar-user-info-btn"
          >
            <div className="sidebar-avatar">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt="Avatar"
                />
              ) : (
                <span>{userInitials}</span>
              )}
            </div>

            <div className="sidebar-user-details">
              <div className="sidebar-user-name">
                {user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Shahriar Rahman' : 'Shahriar Rahman'}
              </div>
              <div className="sidebar-user-role">
                <span>{user?.roles?.[0] || 'SUPER_ADMIN'}</span>
              </div>
            </div>
          </button>

          <button
            onClick={() => logout()}
            title="Sign Out"
            className="sidebar-logout-btn"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>

      <AvatarModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
      />
    </aside>
  );
};
