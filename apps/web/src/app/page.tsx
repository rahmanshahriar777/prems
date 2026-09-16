'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Users,
  Clock,
  Banknote,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Lock,
  TrendingUp,
  Building2,
  Layers,
  Fingerprint,
  ExternalLink,
  ChevronRight,
  Database
} from 'lucide-react';
import { useAuth } from '../context/auth-context';
import '../styles/landing.css';

interface DemoAccount {
  role: string;
  email: string;
  desc: string;
  badge: string;
  badgeClass: string;
  avatar: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: 'Super Administrator',
    email: 'superadmin@ems.local',
    desc: 'Full platform governance, cryptographic audit ledgers, tenant controls, and root system telemetry.',
    badge: 'SUPER_ADMIN',
    badgeClass: 'badge-superadmin',
    avatar: 'SA'
  },
  {
    role: 'HR Manager',
    email: 'hradmin@ems.local',
    desc: 'Manages multi-tier departments, employee lifecycle, leave quotas, and automated payroll batches.',
    badge: 'HR_ADMIN',
    badgeClass: 'badge-hradmin',
    avatar: 'HR'
  },
  {
    role: 'Engineering Manager',
    email: 'manager@ems.local',
    desc: 'Direct report approvals, timesheet validations, competency evaluations, and OKR milestones.',
    badge: 'MANAGER',
    badgeClass: 'badge-manager',
    avatar: 'SR'
  },
  {
    role: 'Senior Staff Engineer',
    email: 'sadia.rahman@ems.local',
    desc: 'Self-service shift clock-in, itemized payslip inspection, PTO requests, and appraisal reviews.',
    badge: 'EMPLOYEE',
    badgeClass: 'badge-employee',
    avatar: 'SM'
  }
];

export default function HomePage() {
  const router = useRouter();
  const { user, login } = useAuth();
  const [loggingIn, setLoggingIn] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dhakaTime, setDhakaTime] = useState<string>('Dhaka (UTC+6)');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const str = now.toLocaleTimeString('en-US', {
        timeZone: 'Asia/Dhaka',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      setDhakaTime(`${str} • Dhaka (UTC+6)`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleQuickLogin = async (email: string) => {
    setLoggingIn(email);
    setError(null);
    try {
      await login(email, 'Password123!');
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify the backend API server is running.');
      setLoggingIn(null);
    }
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="landing-editorial-root">
      {/* Navigation Header */}
      <header className="landing-nav">
        <Link href="/" className="landing-nav-brand">
          <div className="landing-brand-mark" style={{ background: '#ffffff', overflow: 'hidden', padding: '2px', border: '1px solid rgba(255,255,255,0.2)' }}>
            <img src="/logo.png" alt="Practical Roof Solutions Ltd" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div>
            <div className="landing-brand-title">Practical Roof Solutions Ltd</div>
            <div className="landing-brand-sub">
              <span>Workforce Operating System</span>
              <span className="landing-brand-badge">EMS v1.0</span>
            </div>
          </div>
        </Link>

        <div className="landing-nav-links">
          <a href="#personas" className="landing-nav-link" onClick={(e) => { e.preventDefault(); scrollToSection('personas'); }}>
            Demo Personas
          </a>
          <a href="#capabilities" className="landing-nav-link" onClick={(e) => { e.preventDefault(); scrollToSection('capabilities'); }}>
            Capabilities
          </a>
          <a href="#architecture" className="landing-nav-link" onClick={(e) => { e.preventDefault(); scrollToSection('architecture'); }}>
            Architecture
          </a>
          <Link href="/ai-assistant" className="landing-nav-link" style={{ color: 'var(--landing-accent)', fontWeight: 600 }}>
            AI Assistant
          </Link>
        </div>

        <div className="landing-nav-actions">
          <div className="landing-status-pill">
            <span className="landing-status-dot"></span>
            <span>{dhakaTime}</span>
          </div>

          {user ? (
            <Link href="/dashboard" className="landing-btn-primary">
              <span>Go to Dashboard</span>
              <ArrowRight size={14} />
            </Link>
          ) : (
            <Link href="/login" className="landing-btn-secondary">
              <Lock size={13} style={{ color: 'var(--landing-accent)' }} />
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-hero">
        <div style={{ marginBottom: '22px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <img
            src="/logo.png"
            alt="Practical Roof Solutions Ltd"
            style={{ maxHeight: '85px', width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.18))' }}
          />
        </div>

        <div className="landing-hero-tag">
          <Sparkles size={13} />
          <span>Enterprise Workforce Operating System &bull; Practical Roof Solutions Ltd</span>
        </div>

        <h1 className="landing-hero-title">
          Intelligent Workforce Operations, <br />
          <em>Orchestrated with Elegance.</em>
        </h1>

        <p className="landing-hero-subtitle">
          A unified, production-grade enterprise platform engineered for high-performance organizations.
          Harmonizing organizational hierarchies, precision payroll, shift attendance, and compliance-grade AI intelligence.
        </p>

        {error && (
          <div style={{
            padding: '12px 18px',
            borderRadius: 'var(--landing-radius-md)',
            background: 'var(--landing-rose-bg)',
            border: '1px solid rgba(160, 52, 74, 0.3)',
            color: 'var(--landing-rose)',
            fontSize: '13px',
            maxWidth: '540px',
            margin: '0 auto 24px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <div className="landing-hero-ctas">
          <button 
            onClick={() => scrollToSection('personas')} 
            className="landing-btn-hero-primary"
          >
            <span>Experience Demo Personas</span>
            <ChevronRight size={16} />
          </button>

          <Link href="/ai-assistant" className="landing-btn-hero-secondary">
            <Sparkles size={16} style={{ color: 'var(--landing-accent)' }} />
            <span>Open Executive AI Suite</span>
          </Link>
        </div>

        {/* Telemetry Trust Bar */}
        <div className="landing-trust-bar">
          <div className="landing-trust-item">
            <Layers size={16} />
            <span>6 Modular Systems</span>
          </div>
          <div className="landing-trust-item">
            <Fingerprint size={16} />
            <span>100% Tamper-Evident SHA-256</span>
          </div>
          <div className="landing-trust-item">
            <Banknote size={16} />
            <span>Decimal-Safe Payroll</span>
          </div>
          <div className="landing-trust-item">
            <ShieldCheck size={16} />
            <span>ISO-27001 & SOC2 Compliant</span>
          </div>
        </div>
      </section>

      {/* Demo Personas Section */}
      <section className="landing-section" id="personas">
        <div className="landing-section-header">
          <span className="landing-section-tag">Instant Persona Simulation</span>
          <h2 className="landing-section-title">Experience NEO EMS by Role</h2>
          <p className="landing-section-desc">
            Select any enterprise persona below for instantaneous, one-click authenticated entry.
          </p>
        </div>

        <div className="landing-personas-grid">
          {DEMO_ACCOUNTS.map((account) => (
            <div key={account.email} className="landing-persona-card">
              <div>
                <div className="landing-persona-top">
                  <span className={`landing-role-badge ${account.badgeClass}`}>
                    {account.badge}
                  </span>
                  <Lock size={13} style={{ color: 'var(--landing-text-tertiary)' }} />
                </div>

                <div className="landing-persona-header">
                  <div className="landing-persona-avatar">
                    {account.avatar}
                  </div>
                  <div>
                    <h3 className="landing-persona-name">{account.role}</h3>
                    <div className="landing-persona-email">{account.email}</div>
                  </div>
                </div>

                <p className="landing-persona-desc">{account.desc}</p>
              </div>

              <button
                onClick={() => handleQuickLogin(account.email)}
                disabled={loggingIn !== null}
                className="landing-persona-btn"
              >
                <span>{loggingIn === account.email ? 'Authenticating...' : `Sign In as ${account.badge}`}</span>
                <ArrowRight size={13} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Capabilities Grid */}
      <section className="landing-section" id="capabilities">
        <div className="landing-section-header">
          <span className="landing-section-tag">Core Enterprise Engine</span>
          <h2 className="landing-section-title">Engineered for Modern Enterprise Scale</h2>
          <p className="landing-section-desc">
            Every module built with strict architectural guardrails, transaction safety, and clean aesthetics.
          </p>
        </div>

        <div className="landing-caps-grid">
          {/* Card 1: Directory */}
          <div className="landing-cap-card">
            <div className="landing-cap-icon">
              <Building2 size={20} />
            </div>
            <h3 className="landing-cap-title">Organizational Hierarchy & Directory</h3>
            <p className="landing-cap-desc">
              Multi-tier department structures, manager-employee reporting lines, headcount distribution, and real-time organizational charts.
            </p>
            <div className="landing-cap-meta">
              <CheckCircle2 size={13} />
              <span>Multi-Level Department Trees</span>
            </div>
          </div>

          {/* Card 2: Attendance & Leave */}
          <div className="landing-cap-card">
            <div className="landing-cap-icon">
              <Clock size={20} />
            </div>
            <h3 className="landing-cap-title">Daily Attendance & Leave Management</h3>
            <p className="landing-cap-desc">
              Clock-in/out tracking with IP verification, automatic shift duration tallying, and transaction-safe paid time off request lifecycles.
            </p>
            <div className="landing-cap-meta">
              <CheckCircle2 size={13} />
              <span>Automated Overtime & Shift Calculations</span>
            </div>
          </div>

          {/* Card 3: Payroll */}
          <div className="landing-cap-card">
            <div className="landing-cap-icon">
              <Banknote size={20} />
            </div>
            <h3 className="landing-cap-title">Decimal-Safe Compensation & Payroll</h3>
            <p className="landing-cap-desc">
              Accurate base salary and allowance disbursements with zero floating-point drift, tax withholdings, and downloadable itemized payslips.
            </p>
            <div className="landing-cap-meta">
              <CheckCircle2 size={13} />
              <span>Batch ACH Disbursements</span>
            </div>
          </div>

          {/* Card 4: Performance */}
          <div className="landing-cap-card">
            <div className="landing-cap-icon">
              <TrendingUp size={20} />
            </div>
            <h3 className="landing-cap-title">Performance Appraisals & Goals</h3>
            <p className="landing-cap-desc">
              360-degree review cycles, self and manager rating calibrations, OKR milestone completion trackers, and qualitative feedback capture.
            </p>
            <div className="landing-cap-meta">
              <CheckCircle2 size={13} />
              <span>Quarterly OKRs & Calibrated Ratings</span>
            </div>
          </div>

          {/* Card 5: Audit Trail */}
          <div className="landing-cap-card">
            <div className="landing-cap-icon">
              <ShieldCheck size={20} />
            </div>
            <h3 className="landing-cap-title">Forensic Audit Trail & Ledger</h3>
            <p className="landing-cap-desc">
              Immutable write-once log recording state mutations, role escalations, and payroll executions with SHA-256 tamper-evident checksums.
            </p>
            <div className="landing-cap-meta">
              <CheckCircle2 size={13} />
              <span>SOC2 & ISO-27001 Alignment</span>
            </div>
          </div>

          {/* Card 6: AI Assistant */}
          <div className="landing-cap-card">
            <div className="landing-cap-icon">
              <Sparkles size={20} />
            </div>
            <h3 className="landing-cap-title">Executive AI Intelligence</h3>
            <p className="landing-cap-desc">
              Query organizational headcounts, synthesize compensation variances, draft review feedback, and summarize workforce shifts via conversational LLM.
            </p>
            <div className="landing-cap-meta">
              <CheckCircle2 size={13} />
              <span>Natural Language Workforce Analytics</span>
            </div>
          </div>
        </div>

        {/* Stack & Compliance Banner */}
        <div className="landing-banner" id="architecture">
          <div className="landing-banner-content">
            <span style={{ 
              fontFamily: 'var(--landing-font-mono)', 
              fontSize: '11px', 
              color: 'var(--landing-accent)', 
              textTransform: 'uppercase', 
              letterSpacing: '0.08em',
              fontWeight: 600
            }}>
              Production Architecture
            </span>
            <h3 style={{ marginTop: '4px' }}>Built on Next.js 14, NestJS, and PostgreSQL</h3>
            <p>
              Engineered with Turborepo monorepo architecture, Prisma ORM, JWT stateless security, Docker containerization, and strict TypeScript types across web, backend, and shared libraries.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link href="/dashboard" className="landing-btn-primary">
              <span>Enter Application</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="landing-brand-mark" style={{ width: '32px', height: '32px', background: '#ffffff', overflow: 'hidden', padding: '1.5px', border: '1px solid rgba(255,255,255,0.15)' }}>
              <img src="/logo.png" alt="Practical Roof Solutions Ltd" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <span className="landing-footer-copy">
              &copy; {new Date().getFullYear()} Practical Roof Solutions Ltd. All rights reserved.
            </span>
          </div>

          <div className="landing-footer-meta">
            NEO EMS &bull; Dhaka (UTC+6) &bull; Enterprise Monorepo v1.0
          </div>
        </div>
      </footer>
    </div>
  );
}
