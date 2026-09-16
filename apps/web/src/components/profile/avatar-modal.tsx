'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Camera,
  Trash2,
  Check,
  Image as ImageIcon,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Link as LinkIcon,
} from 'lucide-react';
import { api } from '../../lib/api-client';
import { useAuth } from '../../context/auth-context';
import '../../styles/employees.css';

interface AvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newAvatarUrl: string | null) => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&h=256&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&h=256&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&h=256&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=256&h=256&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=256&h=256&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=256&h=256&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=256&h=256&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=256&h=256&fit=crop&crop=faces',
];

export const AvatarModal: React.FC<AvatarModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user, updateUserAvatar } = useAuth();
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(user?.avatarUrl || null);
  const [customUrl, setCustomUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'upload' | 'presets' | 'url'>('upload');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (PNG, JPG, WebP, or GIF).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size exceeds 5MB. Please select a smaller photo.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => setSelectedAvatar(event.target?.result as string);
    reader.onerror = () => setError('Failed to read selected image file.');
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = () => {
    if (!customUrl.trim()) return;
    try {
      new URL(customUrl.trim());
      setSelectedAvatar(customUrl.trim());
      setError(null);
    } catch {
      setError('Please enter a valid image URL starting with http:// or https://');
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await api.patch<{ employeeId: string; avatarUrl: string | null }>(
        '/employees/me/avatar',
        { avatarUrl: selectedAvatar || '' },
      );
      const updatedUrl = (res as any)?.data?.avatarUrl || (res as any)?.avatarUrl || null;
      updateUserAvatar(updatedUrl);
      onSuccess?.(updatedUrl);
      setSuccessMessage('Profile picture updated successfully!');
      setTimeout(() => onClose(), 900);
    } catch (err: any) {
      setError(err?.message || 'Failed to update profile picture. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    setSelectedAvatar(null);
    setCustomUrl('');
  };

  const initials = `${user?.firstName?.[0] || 'U'}${user?.lastName?.[0] || ''}`;

  const TABS = [
    { key: 'upload' as const, label: 'Upload Photo', icon: <Upload style={{ width: 14, height: 14 }} /> },
    { key: 'presets' as const, label: 'Preset Avatars', icon: <Sparkles style={{ width: 14, height: 14 }} /> },
    { key: 'url' as const, label: 'Photo URL', icon: <LinkIcon style={{ width: 14, height: 14 }} /> },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background: 'rgba(26, 24, 22, 0.55)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        className="employees-editorial-wrapper"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '92vh',
          overflowY: 'auto',
          borderRadius: 'var(--emp-radius-xl)',
          border: '1px solid var(--emp-border)',
          boxShadow: 'var(--emp-shadow-lg)',
          padding: 0,
          margin: 0,
          minHeight: 'unset',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* ── Modal Header ───────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px 18px',
            borderBottom: '1px solid var(--emp-border)',
            background: 'var(--emp-surface)',
            borderRadius: 'var(--emp-radius-xl) var(--emp-radius-xl) 0 0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--emp-radius-sm)',
                background: 'var(--emp-accent-light)',
                color: 'var(--emp-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Camera style={{ width: 18, height: 18 }} />
            </div>
            <div>
              <h2
                style={{
                  fontFamily: 'var(--emp-font-serif)',
                  fontSize: 22,
                  fontWeight: 400,
                  letterSpacing: '-0.02em',
                  color: 'var(--emp-text-primary)',
                  lineHeight: 1.2,
                }}
              >
                Set Profile Picture
              </h2>
              <p style={{ fontSize: 12.5, color: 'var(--emp-text-tertiary)', marginTop: 2 }}>
                Personalize your account for the employee directory and records.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '6px',
              borderRadius: 'var(--emp-radius-sm)',
              border: '1px solid var(--emp-border-subtle)',
              background: 'var(--emp-surface-muted)',
              color: 'var(--emp-text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'var(--emp-transition-fast)',
            }}
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* ── Body ───────────────────────────────────────────────── */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Feedback Banners */}
          {error && (
            <div
              style={{
                background: 'var(--emp-rose-bg)',
                border: '1px solid var(--emp-rose)',
                borderRadius: 'var(--emp-radius-md)',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                color: 'var(--emp-rose)',
                fontSize: 13,
              }}
            >
              <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}
          {successMessage && (
            <div
              style={{
                background: 'var(--emp-positive-bg)',
                border: '1px solid var(--emp-positive)',
                borderRadius: 'var(--emp-radius-md)',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                color: 'var(--emp-positive)',
                fontSize: 13,
              }}
            >
              <CheckCircle2 style={{ width: 16, height: 16, flexShrink: 0 }} />
              <span>{successMessage}</span>
            </div>
          )}

          {/* ── Card 1: Current Profile Preview ──────────────────── */}
          <div
            style={{
              background: 'var(--emp-surface)',
              border: '1px solid var(--emp-border)',
              borderRadius: 'var(--emp-radius-lg)',
              padding: '20px',
              boxShadow: 'var(--emp-shadow-sm)',
            }}
          >
            {/* Section heading */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 'var(--emp-radius-sm)',
                  background: 'var(--emp-info-bg)',
                  color: 'var(--emp-info)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Camera style={{ width: 16, height: 16 }} />
              </div>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--emp-text-primary)' }}>
                  Current Avatar
                </h3>
                <p style={{ fontSize: 12, color: 'var(--emp-text-tertiary)' }}>
                  Your live profile picture across the system.
                </p>
              </div>
            </div>

            {/* Preview row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 18,
                padding: '14px 16px',
                background: 'var(--emp-surface-muted)',
                borderRadius: 'var(--emp-radius-md)',
                border: '1px solid var(--emp-border-subtle)',
              }}
            >
              <div style={{ position: 'relative', flexShrink: 0 }}>
                {selectedAvatar ? (
                  <img
                    src={selectedAvatar}
                    alt="Avatar preview"
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2.5px solid var(--emp-accent)',
                      boxShadow: 'var(--emp-shadow-md)',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--emp-accent), var(--emp-info))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: 22,
                      fontWeight: 700,
                      border: '2px dashed var(--emp-accent)',
                      boxShadow: 'var(--emp-shadow-sm)',
                    }}
                  >
                    {initials}
                  </div>
                )}
                {selectedAvatar && (
                  <button
                    type="button"
                    onClick={handleRemove}
                    title="Remove picture"
                    style={{
                      position: 'absolute',
                      top: -4,
                      right: -4,
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: 'var(--emp-rose)',
                      color: '#fff',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Trash2 style={{ width: 10, height: 10 }} />
                  </button>
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--emp-text-primary)', marginBottom: 2 }}>
                  {user?.firstName} {user?.lastName}
                </p>
                <p style={{ fontSize: 12, color: 'var(--emp-text-secondary)', marginBottom: 6 }}>
                  {user?.email}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontFamily: 'var(--emp-font-mono)',
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: 'var(--emp-accent-muted)',
                      color: 'var(--emp-accent)',
                      fontWeight: 600,
                      letterSpacing: '0.04em',
                    }}
                  >
                    {user?.employeeNumber || 'EMPLOYEE'}
                  </span>
                  {selectedAvatar ? (
                    <span
                      style={{
                        fontSize: 11,
                        color: 'var(--emp-positive)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontWeight: 500,
                      }}
                    >
                      <Check style={{ width: 12, height: 12 }} /> Photo Selected
                    </span>
                  ) : (
                    <span style={{ fontSize: 11, color: 'var(--emp-text-tertiary)' }}>Default Initials</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Card 2: Photo Source ──────────────────────────────── */}
          <div
            style={{
              background: 'var(--emp-surface)',
              border: '1px solid var(--emp-border)',
              borderRadius: 'var(--emp-radius-lg)',
              padding: '20px',
              boxShadow: 'var(--emp-shadow-sm)',
            }}
          >
            {/* Section heading */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 'var(--emp-radius-sm)',
                  background: 'var(--emp-purple-bg)',
                  color: 'var(--emp-purple)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ImageIcon style={{ width: 16, height: 16 }} />
              </div>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--emp-text-primary)' }}>
                  Photo Source
                </h3>
                <p style={{ fontSize: 12, color: 'var(--emp-text-tertiary)' }}>
                  Choose how you'd like to set your profile picture.
                </p>
              </div>
            </div>

            {/* Tab bar */}
            <div
              style={{
                display: 'flex',
                borderBottom: '1px solid var(--emp-border-subtle)',
                marginBottom: 16,
              }}
            >
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    flex: 1,
                    padding: '8px 4px',
                    fontSize: 12,
                    fontWeight: 600,
                    color: activeTab === tab.key ? 'var(--emp-accent)' : 'var(--emp-text-secondary)',
                    background: 'none',
                    border: 'none',
                    borderBottom: `2px solid ${activeTab === tab.key ? 'var(--emp-accent)' : 'transparent'}`,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5,
                    transition: 'var(--emp-transition-fast)',
                  }}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab: Upload */}
            {activeTab === 'upload' && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/webp, image/gif"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '2px dashed var(--emp-border)',
                    borderRadius: 'var(--emp-radius-md)',
                    padding: '28px 20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: 'var(--emp-surface-muted)',
                    transition: 'var(--emp-transition-fast)',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--emp-accent)';
                    (e.currentTarget as HTMLDivElement).style.background = 'var(--emp-accent-light)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--emp-border)';
                    (e.currentTarget as HTMLDivElement).style.background = 'var(--emp-surface-muted)';
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 'var(--emp-radius-md)',
                      background: 'var(--emp-surface)',
                      border: '1px solid var(--emp-border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px',
                      color: 'var(--emp-text-tertiary)',
                      boxShadow: 'var(--emp-shadow-sm)',
                    }}
                  >
                    <Upload style={{ width: 20, height: 20 }} />
                  </div>
                  <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--emp-text-primary)', marginBottom: 4 }}>
                    Click to choose a photo or drag &amp; drop
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--emp-text-tertiary)' }}>
                    Supported formats: PNG, JPG, WebP, GIF &nbsp;·&nbsp; Max 5MB
                  </p>
                </div>
              </>
            )}

            {/* Tab: Preset Avatars */}
            {activeTab === 'presets' && (
              <div>
                <p style={{ fontSize: 12, color: 'var(--emp-text-tertiary)', marginBottom: 12 }}>
                  Select a professional preset avatar from the gallery below.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                  {PRESET_AVATARS.map((preset, idx) => {
                    const isSelected = selectedAvatar === preset;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedAvatar(preset)}
                        style={{
                          position: 'relative',
                          borderRadius: 'var(--emp-radius-md)',
                          overflow: 'hidden',
                          aspectRatio: '1 / 1',
                          border: isSelected
                            ? '2.5px solid var(--emp-accent)'
                            : '2px solid var(--emp-border)',
                          cursor: 'pointer',
                          transform: isSelected ? 'scale(1.04)' : 'scale(1)',
                          boxShadow: isSelected ? 'var(--emp-shadow-md)' : 'none',
                          transition: 'var(--emp-transition-fast)',
                          padding: 0,
                          background: 'none',
                        }}
                      >
                        <img
                          src={preset}
                          alt={`Preset ${idx + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                        {isSelected && (
                          <div
                            style={{
                              position: 'absolute',
                              inset: 0,
                              background: 'rgba(44, 95, 74, 0.35)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#fff',
                            }}
                          >
                            <Check style={{ width: 20, height: 20, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))' }} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab: Photo URL */}
            {activeTab === 'url' && (
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--emp-text-secondary)',
                    marginBottom: 6,
                  }}
                >
                  Direct Image URL
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="url"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://example.com/your-photo.jpg"
                    style={{
                      flex: 1,
                      padding: '9px 12px',
                      background: 'var(--emp-surface-muted)',
                      border: '1px solid var(--emp-border-subtle)',
                      borderRadius: 'var(--emp-radius-md)',
                      fontSize: 13,
                      color: 'var(--emp-text-primary)',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleApplyUrl}
                    style={{
                      padding: '9px 16px',
                      borderRadius: 'var(--emp-radius-md)',
                      border: '1px solid var(--emp-border)',
                      background: 'var(--emp-surface)',
                      color: 'var(--emp-text-secondary)',
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'var(--emp-transition-fast)',
                    }}
                  >
                    Apply
                  </button>
                </div>
                <p style={{ fontSize: 11.5, color: 'var(--emp-text-tertiary)', marginTop: 6 }}>
                  Paste a direct link from Gravatar, LinkedIn, Unsplash, or your company intranet.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer Actions ─────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 24px',
            borderTop: '1px solid var(--emp-border)',
            background: 'var(--emp-surface)',
            borderRadius: '0 0 var(--emp-radius-xl) var(--emp-radius-xl)',
          }}
        >
          <div>
            {selectedAvatar && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={loading}
                style={{
                  fontSize: 12.5,
                  fontWeight: 500,
                  color: 'var(--emp-rose)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <Trash2 style={{ width: 13, height: 13 }} />
                Clear Picture
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '9px 18px',
                borderRadius: 'var(--emp-radius-md)',
                border: '1px solid var(--emp-border)',
                background: 'var(--emp-surface)',
                color: 'var(--emp-text-secondary)',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                textDecoration: 'none',
                transition: 'var(--emp-transition-fast)',
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="emp-btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 22px',
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <>
                  <Loader2 style={{ width: 15, height: 15 }} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 style={{ width: 15, height: 15 }} />
                  <span>Save Picture</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
