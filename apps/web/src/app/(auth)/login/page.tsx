'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  RefreshCw,
  ArrowLeft,
  Sparkles,
  Fingerprint
} from 'lucide-react';
import { useAuth } from '../../../context/auth-context';
import '../../../styles/login.css';

interface Persona {
  role: string;
  badge: string;
  email: string;
  badgeColor: string;
}

const DEMO_PERSONAS: Persona[] = [
  {
    role: 'Super Administrator',
    badge: 'SUPER_ADMIN',
    email: 'superadmin@ems.local',
    badgeColor: 'var(--login-rose)'
  },
  {
    role: 'HR Manager',
    badge: 'HR_ADMIN',
    email: 'hradmin@ems.local',
    badgeColor: 'var(--login-info)'
  },
  {
    role: 'Engineering Manager',
    badge: 'MANAGER',
    email: 'manager@ems.local',
    badgeColor: 'var(--login-warning)'
  },
  {
    role: 'Senior Staff Engineer',
    badge: 'EMPLOYEE',
    email: 'sadia.rahman@ems.local',
    badgeColor: 'var(--login-positive)'
  }
];

export default function LoginPage() {
  const router = useRouter();
  const { login, user } = useAuth();
  const [email, setEmail] = useState('superadmin@ems.local');
  const [password, setPassword] = useState('Password123!');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dhakaTime, setDhakaTime] = useState('Dhaka (UTC+6)');

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
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate. Please verify credentials or backend status.');
    } finally {
      setLoading(false);
    }
  };

  const quickFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
  };

  return (
    <div className="login-editorial-wrapper">
      <div className="login-container">
        {/* Header with Logo */}
        <div className="login-header">
          <Link href="/" className="login-brand-link">
            <div className="login-brand-mark">N</div>
            <div className="login-brand-text">
              <div className="login-brand-name">Neoteric Digital</div>
              <div className="login-brand-sub">
                <span>Identity Gateway</span>
                <span className="login-brand-badge">EMS</span>
              </div>
            </div>
          </Link>

          <h1 className="login-title">Enterprise Portal Sign In</h1>
          <p className="login-subtitle">
            Secure, role-governed workforce management gateway.
          </p>

          <div style={{ marginTop: '10px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 10px',
              borderRadius: '20px',
              background: 'var(--login-surface)',
              border: '1px solid var(--login-border)',
              fontFamily: 'var(--login-font-mono)',
              fontSize: '11px',
              color: 'var(--login-text-tertiary)'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--login-positive)' }}></span>
              <span>{dhakaTime}</span>
            </span>
          </div>
        </div>

        {/* Card */}
        <div className="login-card">
          {error && (
            <div className="login-error-alert">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="login-form-group">
              <label className="login-label">Official Work Email</label>
              <div className="login-input-wrapper">
                <Mail size={16} className="login-input-icon" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@ems.local"
                  className="login-input"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="login-form-group">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label className="login-label" style={{ margin: 0 }}>Password</label>
                <span style={{ fontSize: '11.5px', color: 'var(--login-text-tertiary)' }}>
                  Demo: <code style={{ fontFamily: 'var(--login-font-mono)', color: 'var(--login-accent)' }}>Password123!</code>
                </span>
              </div>

              <div className="login-input-wrapper">
                <Lock size={16} className="login-input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="login-input"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="login-password-toggle"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="login-btn-submit"
            >
              {loading ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Authenticate & Enter Workspace</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Quick-Fill Persona Chips */}
          <div className="login-quick-fill-section">
            <div className="login-quick-fill-header">One-Click Demo Personas</div>
            <div className="login-quick-fill-grid">
              {DEMO_PERSONAS.map((persona) => (
                <button
                  key={persona.email}
                  type="button"
                  onClick={() => quickFill(persona.email)}
                  className="login-persona-chip"
                  title={`Fill credentials for ${persona.role}`}
                >
                  <div className="login-persona-chip-role">
                    <span style={{ color: persona.badgeColor }}>{persona.badge}</span>
                    <span style={{ color: 'var(--login-text-tertiary)', fontSize: '9px' }}>FILL</span>
                  </div>
                  <div className="login-persona-chip-email">{persona.email}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Security watermark */}
        <div className="login-footer-telemetry">
          <ShieldCheck size={14} style={{ color: 'var(--login-positive)' }} />
          <span>AES-256 Encrypted &bull; RBAC Protected &bull; SOC2 Ready</span>
        </div>

        <div className="login-footer-links">
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <ArrowLeft size={13} />
            <span>Return to Neoteric Digital Overview</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
