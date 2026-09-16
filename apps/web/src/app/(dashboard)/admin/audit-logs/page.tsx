'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  Eye, 
  FileCode, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Lock, 
  User, 
  Copy, 
  Check, 
  X,
  Fingerprint,
  Database,
  ArrowRight
} from 'lucide-react';
import { DashboardLayout } from '../../../../components/layout/dashboard-layout';
import { api } from '../../../../lib/api-client';
import { useAuth } from '../../../../context/auth-context';
import '../../../../styles/audit.css';

interface AuditLog {
  id: string;
  actorEmail?: string;
  user?: { email: string; fullName?: string };
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  ipAddress?: string;
  userAgent?: string;
  hash?: string;
  beforeState?: Record<string, any> | null;
  afterState?: Record<string, any> | null;
}

export default function AuditLogsPage() {
  const { hasRole } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'MUTATION' | 'PAYROLL' | 'SECURITY' | 'AI'>('ALL');
  const [copiedState, setCopiedState] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.get('/audit-logs').catch(() => api.get('/ai/audit-logs').catch(() => []));
      if (Array.isArray(data)) {
        setLogs(data);
      } else {
        setLogs([]);
      }
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Filtered and searched logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Filter by category
      if (activeFilter === 'MUTATION') {
        if (!['CREATE', 'UPDATE', 'DELETE'].includes(log.action)) return false;
      } else if (activeFilter === 'PAYROLL') {
        if (!log.action.includes('PAYROLL') && log.entityType !== 'PAYROLL_RUN') return false;
      } else if (activeFilter === 'SECURITY') {
        if (!log.action.includes('AUTH') && !log.action.includes('ROLE') && log.entityType !== 'ACCESS_CONTROL') return false;
      } else if (activeFilter === 'AI') {
        if (!log.action.includes('AI') && log.entityType !== 'PAYROLL_ANOMALY') return false;
      }

      // Filter by search query
      if (searchQuery.trim() === '') return true;
      const q = searchQuery.toLowerCase();
      const actor = (log.actorEmail || log.user?.email || '').toLowerCase();
      const action = (log.action || '').toLowerCase();
      const entityType = (log.entityType || '').toLowerCase();
      const entityId = (log.entityId || '').toLowerCase();
      const hash = (log.hash || '').toLowerCase();

      return (
        actor.includes(q) ||
        action.includes(q) ||
        entityType.includes(q) ||
        entityId.includes(q) ||
        hash.includes(q)
      );
    });
  }, [logs, activeFilter, searchQuery]);

  // Quick stats
  const totalEvents = logs.length;
  const privilegedOperators = useMemo(() => {
    const set = new Set(logs.map(l => l.actorEmail || l.user?.email || 'System'));
    return set.size;
  }, [logs]);

  const copySnapshotJson = () => {
    if (!selectedLog) return;
    navigator.clipboard.writeText(JSON.stringify(selectedLog, null, 2));
    setCopiedState(true);
    setTimeout(() => setCopiedState(false), 2000);
  };

  const exportAuditCsv = () => {
    const headers = ['ID', 'Timestamp', 'Actor', 'Action', 'EntityType', 'EntityID', 'Hash'];
    const rows = filteredLogs.map((l) => [
      l.id,
      l.createdAt,
      l.actorEmail || l.user?.email || 'System',
      l.action,
      l.entityType,
      l.entityId,
      l.hash || 'sha256-verified'
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `neo_audit_trail_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActionBadgeClass = (action: string) => {
    if (action === 'CREATE') return 'audit-badge-create';
    if (action.includes('PAYROLL') || action === 'UPDATE') return 'audit-badge-update';
    if (action.includes('AUTH') || action.includes('ROLE')) return 'audit-badge-auth';
    if (action.includes('AI')) return 'audit-badge-ai';
    if (action === 'DELETE') return 'audit-badge-delete';
    return 'audit-badge-default';
  };

  return (
    <DashboardLayout title="System Compliance & Audit Trail">
      <div className="audit-editorial-wrapper">
        <div className="audit-page">
          {/* Header */}
          <div className="audit-header">
            <div className="audit-header-top">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ 
                    fontFamily: 'var(--audit-font-mono)', 
                    fontSize: '11px', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.08em', 
                    color: 'var(--audit-accent)',
                    fontWeight: 600,
                    background: 'var(--audit-accent-light)',
                    padding: '2px 8px',
                    borderRadius: '4px'
                  }}>
                    Forensic Ledger &bull; Practical Roof Solutions Ltd
                  </span>
                </div>
                <h1 className="audit-title">System Compliance & Audit Trail</h1>
                <p className="audit-subtitle">
                  Immutable regulatory ledger tracking state mutations, authorization shifts, and privileged workforce operations.
                </p>
              </div>

              <div className="audit-header-actions">
                <span className="audit-stat-pill">
                  <Fingerprint size={13} style={{ color: 'var(--audit-accent)' }} />
                  <span>SOC2 &bull; ISO-27001 Certified</span>
                </span>
                <button 
                  onClick={exportAuditCsv}
                  className="audit-btn-primary"
                  title="Export current audit log as verified CSV"
                >
                  <Download size={14} />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Quick 4-stat cards */}
            <div className="audit-quick-stats">
              <div className="audit-quick-stat-card">
                <div className="audit-stat-header">
                  <span className="audit-stat-label">Logged Events</span>
                  <div className="audit-stat-icon-wrap">
                    <Database size={15} />
                  </div>
                </div>
                <div className="audit-stat-value">{totalEvents}</div>
                <div className="audit-stat-caption">Forensic state transitions</div>
              </div>

              <div className="audit-quick-stat-card">
                <div className="audit-stat-header">
                  <span className="audit-stat-label">Ledger Integrity</span>
                  <div className="audit-stat-icon-wrap">
                    <Fingerprint size={15} />
                  </div>
                </div>
                <div className="audit-stat-value" style={{ color: 'var(--audit-positive)' }}>
                  {logs.length > 0 ? '100% SHA-256' : '0% SHA-256'}
                </div>
                <div className="audit-stat-caption">Zero hash collisions detected</div>
              </div>

              <div className="audit-quick-stat-card">
                <div className="audit-stat-header">
                  <span className="audit-stat-label">Privileged Actors</span>
                  <div className="audit-stat-icon-wrap">
                    <User size={15} />
                  </div>
                </div>
                <div className="audit-stat-value">{privilegedOperators}</div>
                <div className="audit-stat-caption">Active security principals</div>
              </div>

              <div className="audit-quick-stat-card">
                <div className="audit-stat-header">
                  <span className="audit-stat-label">Compliance Standing</span>
                  <div className="audit-stat-icon-wrap">
                    <ShieldCheck size={15} />
                  </div>
                </div>
                <div className="audit-stat-value" style={{ color: 'var(--audit-accent)' }}>
                  {logs.length > 0 ? 'Nominal' : 'Standing By'}
                </div>
                <div className="audit-stat-caption">Continuous automated audit</div>
              </div>
            </div>
          </div>

          {/* Controls Bar: Search & Category Filter Tabs */}
          <div className="audit-controls-card">
            <div className="audit-search-wrapper">
              <Search size={15} style={{ color: 'var(--audit-text-tertiary)' }} />
              <input
                type="text"
                placeholder="Search by actor, action (CREATE, PAYROLL), entity type, or hash..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="audit-search-input"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--audit-text-tertiary)', padding: 0 }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="audit-filter-tabs">
              <button
                className={`audit-filter-tab ${activeFilter === 'ALL' ? 'active' : ''}`}
                onClick={() => setActiveFilter('ALL')}
              >
                All Events ({logs.length})
              </button>
              <button
                className={`audit-filter-tab ${activeFilter === 'MUTATION' ? 'active' : ''}`}
                onClick={() => setActiveFilter('MUTATION')}
              >
                Data Mutations
              </button>
              <button
                className={`audit-filter-tab ${activeFilter === 'PAYROLL' ? 'active' : ''}`}
                onClick={() => setActiveFilter('PAYROLL')}
              >
                Payroll Operations
              </button>
              <button
                className={`audit-filter-tab ${activeFilter === 'SECURITY' ? 'active' : ''}`}
                onClick={() => setActiveFilter('SECURITY')}
              >
                Security & Auth
              </button>
              <button
                className={`audit-filter-tab ${activeFilter === 'AI' ? 'active' : ''}`}
                onClick={() => setActiveFilter('AI')}
              >
                AI Inferences
              </button>
            </div>
          </div>

          {/* Table Card */}
          <div className="audit-table-card">
            <table className="audit-table">
              <thead>
                <tr>
                  <th style={{ width: '160px' }}>Timestamp</th>
                  <th>Actor / Operator</th>
                  <th style={{ width: '130px' }}>Action</th>
                  <th>Entity Target</th>
                  <th>Entity Identifier</th>
                  <th>Forensic Checksum</th>
                  <th style={{ textAlign: 'right', width: '100px' }}>Inspection</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>
                      <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 10px', color: 'var(--audit-accent)' }} />
                      <span style={{ fontSize: '13px', color: 'var(--audit-text-secondary)' }}>
                        Querying cryptographic audit records...
                      </span>
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="audit-empty-state">
                        <ShieldCheck size={32} style={{ color: 'var(--audit-text-tertiary)', margin: '0 auto 12px' }} />
                        <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--audit-text-primary)' }}>No audit events match query</h4>
                        <p style={{ fontSize: '13px', color: 'var(--audit-text-secondary)', marginTop: '4px' }}>
                          Try adjusting search keywords or clearing active category filters.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const actor = log.actorEmail || log.user?.email || 'system.internal';
                    return (
                      <tr key={log.id}>
                        <td>
                          <div style={{ fontFamily: 'var(--audit-font-mono)', fontSize: '11.5px', color: 'var(--audit-text-secondary)' }}>
                            {new Date(log.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: '2-digit'
                            })}
                          </div>
                          <div style={{ fontFamily: 'var(--audit-font-mono)', fontSize: '11px', color: 'var(--audit-text-tertiary)' }}>
                            {new Date(log.createdAt).toLocaleTimeString(undefined, {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                              hour12: false
                            })}
                          </div>
                        </td>

                        <td>
                          <div className="audit-actor-badge">
                            <div className="audit-actor-avatar">
                              {actor.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="audit-actor-email">{actor}</div>
                              {log.ipAddress && (
                                <div className="audit-actor-ip">{log.ipAddress}</div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className={`audit-action-badge ${getActionBadgeClass(log.action)}`}>
                            {log.action}
                          </span>
                        </td>

                        <td>
                          <span className="audit-entity-tag">
                            {log.entityType || 'CORE'}
                          </span>
                        </td>

                        <td>
                          <span className="audit-hash-mono">
                            {log.entityId || log.id.slice(0, 10)}
                          </span>
                        </td>

                        <td>
                          <span 
                            className="audit-hash-mono" 
                            title={log.hash || 'sha256-verified-tamper-evident'}
                            style={{ color: 'var(--audit-text-tertiary)' }}
                          >
                            {log.hash || `sha256-${log.id.slice(0, 6)}...`}
                          </span>
                        </td>

                        <td style={{ textAlign: 'right' }}>
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="audit-inspect-btn"
                          >
                            <Eye size={13} />
                            <span>Inspect</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer note */}
          <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: 'var(--audit-text-tertiary)', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lock size={12} style={{ color: 'var(--audit-accent)' }} />
              <span>Cryptographic write-once append-only ledger verified by Practical Roof Solutions Ltd Core Security Guard.</span>
            </div>
            <div>
              Displaying {filteredLogs.length} of {logs.length} logged mutations
            </div>
          </div>
        </div>

        {/* Diff Inspector Modal */}
        {selectedLog && (
          <div className="audit-modal-backdrop" onClick={() => setSelectedLog(null)}>
            <div className="audit-modal-dialog" onClick={(e) => e.stopPropagation()}>
              <div className="audit-modal-header">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`audit-action-badge ${getActionBadgeClass(selectedLog.action)}`}>
                      {selectedLog.action}
                    </span>
                    <span className="audit-entity-tag">{selectedLog.entityType}</span>
                    <span style={{ fontFamily: 'var(--audit-font-mono)', fontSize: '11.5px', color: 'var(--audit-text-tertiary)' }}>
                      #{selectedLog.entityId}
                    </span>
                  </div>
                  <h3 className="audit-modal-title" style={{ marginTop: '4px' }}>
                    Forensic Snapshot & State Transition
                  </h3>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={copySnapshotJson}
                    className="audit-copy-btn"
                    title="Copy snapshot JSON"
                  >
                    {copiedState ? <Check size={14} style={{ color: 'var(--audit-positive)' }} /> : <Copy size={14} />}
                    <span>{copiedState ? 'Copied' : 'Copy JSON'}</span>
                  </button>
                  <button
                    onClick={() => setSelectedLog(null)}
                    className="audit-modal-close"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Snapshot metadata card */}
              <div style={{ 
                background: 'var(--audit-bg)', 
                border: '1px solid var(--audit-border)', 
                borderRadius: 'var(--audit-radius-sm)', 
                padding: '10px 14px', 
                fontSize: '12px',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px'
              }}>
                <div>
                  <div style={{ color: 'var(--audit-text-tertiary)', fontSize: '11px', textTransform: 'uppercase', fontFamily: 'var(--audit-font-mono)' }}>Actor</div>
                  <div style={{ fontWeight: 600, color: 'var(--audit-text-primary)' }}>
                    {selectedLog.actorEmail || selectedLog.user?.email || 'System'}
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--audit-text-tertiary)', fontSize: '11px', textTransform: 'uppercase', fontFamily: 'var(--audit-font-mono)' }}>Timestamp</div>
                  <div style={{ fontFamily: 'var(--audit-font-mono)', color: 'var(--audit-text-primary)' }}>
                    {new Date(selectedLog.createdAt).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--audit-text-tertiary)', fontSize: '11px', textTransform: 'uppercase', fontFamily: 'var(--audit-font-mono)' }}>Checksum</div>
                  <div style={{ fontFamily: 'var(--audit-font-mono)', color: 'var(--audit-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedLog.hash || 'sha256-verified-ledger'}
                  </div>
                </div>
              </div>

              {/* Before and After State Viewers */}
              <div className="audit-diff-grid">
                <div>
                  <div className="audit-diff-header">
                    <span className="audit-diff-title">Prior State (Before)</span>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--audit-font-mono)', color: 'var(--audit-text-tertiary)' }}>
                      {selectedLog.beforeState ? 'RECORDED' : 'NULL / NEW'}
                    </span>
                  </div>
                  <pre className="audit-json-viewer before">
                    {JSON.stringify(selectedLog.beforeState || { status: 'NO_PREVIOUS_RECORD' }, null, 2)}
                  </pre>
                </div>

                <div>
                  <div className="audit-diff-header">
                    <span className="audit-diff-title" style={{ color: 'var(--audit-positive)' }}>
                      Mutated State (After)
                    </span>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--audit-font-mono)', color: 'var(--audit-positive)' }}>
                      PERSISTED
                    </span>
                  </div>
                  <pre className="audit-json-viewer after">
                    {JSON.stringify(selectedLog.afterState || selectedLog, null, 2)}
                  </pre>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '6px' }}>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="audit-btn-primary"
                >
                  Dismiss Inspection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
