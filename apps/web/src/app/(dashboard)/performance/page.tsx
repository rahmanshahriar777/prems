'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Target,
  Star,
  Award,
  Plus,
  MessageSquare,
  Search,
  X,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
  Compass,
  FileCheck,
} from 'lucide-react';
import { DashboardLayout } from '../../../components/layout/dashboard-layout';
import { api } from '../../../lib/api-client';
import { useAuth } from '../../../context/auth-context';
import '../../../styles/performance.css';

interface Goal {
  id: string;
  title: string;
  targetDate?: string;
  progress: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'AT_RISK';
  category?: string;
}

interface Review {
  id: string;
  cycle?: { title: string };
  selfRating?: number;
  managerRating?: number;
  finalScore?: number;
  status?: string;
  managerFeedback?: string;
}

interface ReviewCycle {
  id: string;
  title: string;
  isActive?: boolean;
}

export default function PerformancePage() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [cycles, setCycles] = useState<ReviewCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');

  // Modal State
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [targetDate, setTargetDate] = useState('2026-12-31');
  const [initialProgress, setInitialProgress] = useState(15);
  const [submitting, setSubmitting] = useState(false);

  const fetchPerformance = async () => {
    setLoading(true);
    try {
      const [goalsRes, reviewsRes, cyclesRes] = await Promise.all([
        api.get('/goals').catch(() => null),
        api.get('/performance/reviews').catch(() => null),
        api.get('/performance/cycles').catch(() => null),
      ]);

      if (goalsRes && Array.isArray(goalsRes)) {
        setGoals(goalsRes);
      } else {
        setGoals([]);
      }

      if (reviewsRes && Array.isArray(reviewsRes)) {
        setReviews(reviewsRes);
      } else {
        setReviews([]);
      }

      if (cyclesRes && Array.isArray(cyclesRes)) {
        setCycles(cyclesRes);
      } else {
        setCycles([]);
      }
    } catch {
      setGoals([]);
      setReviews([]);
      setCycles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformance();
  }, []);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/goals', {
        title: newGoalTitle,
        targetDate,
        progress: Number(initialProgress),
        status: 'IN_PROGRESS',
      });
      setShowGoalModal(false);
      setNewGoalTitle('');
      fetchPerformance();
    } catch (err: any) {
      alert(err.message || 'Goal saved');
      setShowGoalModal(false);
      fetchPerformance();
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered goals
  const filteredGoals = useMemo(() => {
    return goals.filter((g) => {
      const matchStatus = statusFilter === 'ALL' || g.status === statusFilter;
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        g.title.toLowerCase().includes(q) ||
        (g.category && g.category.toLowerCase().includes(q));
      return matchStatus && matchSearch;
    });
  }, [goals, statusFilter, search]);

  const latestReview = reviews[0];

  return (
    <DashboardLayout title="Performance & Professional Development">
      <div className="performance-editorial-wrapper">
        <div className="perf-page">
          {/* Header Section */}
          <header className="perf-header">
            <div className="perf-header-top">
              <div>
                <h1 className="perf-title">Performance & Professional Development</h1>
                <p className="perf-subtitle">
                  Quarterly appraisal cycles, OKRs, competency reviews, and continuous leadership telemetry across Practical Roof Solutions Ltd.
                </p>
              </div>

              <div className="perf-header-actions">
                <div className="perf-stat-pill">
                  <span>Active Cycle</span>
                  <span className="count">{cycles.length > 0 ? cycles[0].title : 'No Active Cycles'}</span>
                </div>

                <Link href="/performance/new" className="perf-btn-primary">
                  <Plus className="w-4 h-4" />
                  <span>Set New Goal / OKR</span>
                </Link>
              </div>
            </div>

            {/* 4 Quick Stat Cards */}
            <div className="perf-quick-stats">
              <div className="perf-quick-stat-card">
                <div>
                  <div className="perf-quick-stat-label">Appraisal Rating</div>
                  <div className="perf-quick-stat-value" style={{ color: 'var(--perf-warning)' }}>
                    {latestReview?.finalScore ? `${latestReview.finalScore} / 5.0` : 'Pending Appraisal'}
                  </div>
                </div>
                <div className="perf-quick-stat-icon">
                  <Star className="w-5 h-5" />
                </div>
              </div>

              <div className="perf-quick-stat-card">
                <div>
                  <div className="perf-quick-stat-label">Active OKRs</div>
                  <div className="perf-quick-stat-value">{goals.length} Goals</div>
                </div>
                <div className="perf-quick-stat-icon">
                  <Target className="w-5 h-5" />
                </div>
              </div>

              <div className="perf-quick-stat-card">
                <div>
                  <div className="perf-quick-stat-label">Avg Completion Rate</div>
                  <div className="perf-quick-stat-value">
                    {goals.length
                      ? `${Math.round(goals.reduce((acc, c) => acc + c.progress, 0) / goals.length)}%`
                      : '0%'}
                  </div>
                </div>
                <div className="perf-quick-stat-icon">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>

              <div className="perf-quick-stat-card">
                <div>
                  <div className="perf-quick-stat-label">Leadership Standing</div>
                  <div className="perf-quick-stat-value" style={{ fontSize: '15px', color: 'var(--perf-accent)' }}>
                    {reviews.length ? 'Top Decile' : 'Pending Review'}
                  </div>
                </div>
                <div className="perf-quick-stat-icon">
                  <Award className="w-5 h-5" />
                </div>
              </div>
            </div>
          </header>

          {/* Main 2-Column Grid Layout */}
          <div className="perf-grid-layout">
            {/* Left Column: Active Goals & OKRs */}
            <div className="perf-goals-container">
              <div className="perf-goals-header">
                <div className="perf-goals-title">
                  <Target className="w-5 h-5 text-emerald-600" />
                  <span>Key Objectives & Performance Targets</span>
                </div>
                <span className="perf-goals-count">{filteredGoals.length} tracked</span>
              </div>

              {/* Toolbar */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                  <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: 'var(--perf-text-tertiary)' }} />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Filter objectives..."
                    style={{
                      width: '100%',
                      padding: '7px 10px 7px 32px',
                      background: 'var(--perf-surface-muted)',
                      border: '1px solid var(--perf-border-subtle)',
                      borderRadius: 'var(--perf-radius-md)',
                      fontSize: '12px',
                      outline: 'none',
                    }}
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--perf-text-tertiary)' }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={() => setStatusFilter('ALL')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      border: '1px solid var(--perf-border)',
                      background: statusFilter === 'ALL' ? 'var(--perf-accent-light)' : 'transparent',
                      color: statusFilter === 'ALL' ? 'var(--perf-accent)' : 'var(--perf-text-secondary)',
                      fontWeight: statusFilter === 'ALL' ? 600 : 500,
                      cursor: 'pointer',
                    }}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setStatusFilter('IN_PROGRESS')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      border: '1px solid var(--perf-border)',
                      background: statusFilter === 'IN_PROGRESS' ? 'var(--perf-accent-light)' : 'transparent',
                      color: statusFilter === 'IN_PROGRESS' ? 'var(--perf-accent)' : 'var(--perf-text-secondary)',
                      fontWeight: statusFilter === 'IN_PROGRESS' ? 600 : 500,
                      cursor: 'pointer',
                    }}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => setStatusFilter('COMPLETED')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      border: '1px solid var(--perf-border)',
                      background: statusFilter === 'COMPLETED' ? 'var(--perf-accent-light)' : 'transparent',
                      color: statusFilter === 'COMPLETED' ? 'var(--perf-accent)' : 'var(--perf-text-secondary)',
                      fontWeight: statusFilter === 'COMPLETED' ? 600 : 500,
                      cursor: 'pointer',
                    }}
                  >
                    Done
                  </button>
                </div>
              </div>

              {/* Goals Cards List */}
              <div className="perf-goals-list">
                {filteredGoals.length > 0 ? (
                  filteredGoals.map((g) => (
                    <div key={g.id} className="perf-goal-card">
                      <div className="perf-goal-top">
                        <div>
                          <div className="perf-goal-name">{g.title}</div>
                          {g.category && (
                            <span style={{ fontSize: '11px', color: 'var(--perf-text-tertiary)', fontFamily: 'var(--perf-font-mono)' }}>
                              {g.category}
                            </span>
                          )}
                        </div>
                        <span className="perf-goal-percent">{g.progress}%</span>
                      </div>

                      <div className="perf-progress-bar">
                        <div
                          className="perf-progress-fill"
                          style={{
                            width: `${g.progress}%`,
                            background: g.progress === 100 ? 'var(--perf-positive)' : 'var(--perf-accent)',
                          }}
                        />
                      </div>

                      <div className="perf-goal-meta">
                        <span>Target: {g.targetDate?.split('T')[0] || '2026-12-31'}</span>
                        <span
                          className={`perf-goal-badge ${
                            g.progress === 100 ? 'perf-goal-completed' : 'perf-goal-active'
                          }`}
                        >
                          {g.status ? g.status.replace('_', ' ') : 'IN PROGRESS'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '48px 24px',
                      background: 'var(--perf-surface-muted)',
                      borderRadius: 'var(--perf-radius-lg)',
                      border: '1px dashed var(--perf-border)',
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: 'rgba(37, 99, 235, 0.08)',
                        color: 'var(--perf-accent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '12px',
                      }}
                    >
                      <Target className="w-5 h-5" />
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--perf-text)', marginBottom: '4px' }}>
                      No Performance Objectives
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--perf-text-tertiary)', maxWidth: '320px', margin: '0 0 16px 0' }}>
                      No active OKRs or quarterly targets recorded. Establish a target to initiate tracked telemetry.
                    </p>
                    <Link
                      href="/performance/new"
                      className="perf-btn-primary"
                      style={{ fontSize: '12px', padding: '6px 14px', textDecoration: 'none' }}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Establish New Target</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Latest Appraisal Review */}
            <div className="perf-appraisal-container">
              <div className="perf-appraisal-header">
                <Award className="w-5 h-5 text-amber-600" />
                <span>Executive Appraisal Result</span>
              </div>

              {latestReview ? (
                <>
                  <div className="perf-score-card">
                    <div className="perf-score-number">{latestReview.finalScore || '0.0'}</div>
                    <div className="perf-score-desc">Evaluation Complete</div>
                    <span style={{ fontSize: '10.5px', fontFamily: 'var(--perf-font-mono)', color: 'var(--perf-text-tertiary)' }}>
                      Benchmark: Cycle Appraisal
                    </span>
                  </div>

                  <div className="perf-ratings-breakdown">
                    <div className="perf-rating-row">
                      <span className="perf-rating-label">Self Evaluation:</span>
                      <span className="perf-rating-val">{latestReview.selfRating ? `${latestReview.selfRating} / 5.0` : 'Pending'}</span>
                    </div>
                    <div className="perf-rating-row">
                      <span className="perf-rating-label">Manager Appraisal:</span>
                      <span className="perf-rating-val">{latestReview.managerRating ? `${latestReview.managerRating} / 5.0` : 'Pending'}</span>
                    </div>
                  </div>

                  {latestReview.managerFeedback && (
                    <div className="perf-feedback-quote">
                      "{latestReview.managerFeedback}"
                    </div>
                  )}
                </>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '48px 24px',
                    background: 'var(--perf-surface-muted)',
                    borderRadius: 'var(--perf-radius-lg)',
                    border: '1px dashed var(--perf-border)',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: 'rgba(217, 119, 6, 0.08)',
                      color: '#d97706',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '12px',
                    }}
                  >
                    <Award className="w-5 h-5" />
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--perf-text)', marginBottom: '4px' }}>
                    No Finalized Appraisals
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--perf-text-tertiary)', maxWidth: '280px', margin: '0' }}>
                    Appraisal scorecards, manager ratings, and verified competencies will display here once review cycles are conducted.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create New Goal Modal */}
      {showGoalModal && (
        <div className="perf-modal-overlay" onClick={() => setShowGoalModal(false)}>
          <div className="perf-modal" onClick={(e) => e.stopPropagation()}>
            <div className="perf-modal-header">
              <h3 className="perf-modal-title">Set Performance Target / OKR</h3>
              <button
                onClick={() => setShowGoalModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--perf-text-tertiary)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGoal}>
              <div className="perf-form-group">
                <label className="perf-form-label">Objective / Key Result Title</label>
                <input
                  type="text"
                  required
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  placeholder="e.g. Implement dual provider inference resilience"
                  className="perf-form-input"
                />
              </div>

              <div className="perf-form-group">
                <label className="perf-form-label">Target Completion Date</label>
                <input
                  type="date"
                  required
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="perf-form-input"
                  style={{ fontFamily: 'var(--perf-font-mono)' }}
                />
              </div>

              <div className="perf-form-group">
                <label className="perf-form-label">Current Progress ({initialProgress}%)</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={initialProgress}
                  onChange={(e) => setInitialProgress(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--perf-accent)' }}
                />
              </div>

              <div className="perf-form-actions">
                <button
                  type="button"
                  onClick={() => setShowGoalModal(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--perf-radius-md)',
                    border: '1px solid var(--perf-border)',
                    background: 'var(--perf-surface-muted)',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="perf-btn-primary"
                >
                  {submitting ? 'Saving...' : 'Save Objective'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
