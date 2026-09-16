'use client';

import React, { useState, useRef } from 'react';
import { DashboardLayout } from '../../../components/layout/dashboard-layout';
import { useAiCompletion } from '../../../hooks/use-ai-completion';
import '../../../styles/ai-assistant.css';

interface SuggestionItem {
  id: string;
  title: string;
  desc: string;
  prompt: string;
  icon: React.ReactNode;
}

const SUGGESTIONS: SuggestionItem[] = [
  {
    id: 'leave-policy',
    title: 'Draft a leave policy',
    desc: 'Generate an attendance and leave policy',
    prompt:
      'Draft a comprehensive leave and attendance policy for the engineering department that covers sick leave, casual leave, earned leave, and work-from-home guidelines.',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
  },
  {
    id: 'perf-review',
    title: 'Performance review template',
    desc: 'Quarterly evaluation structure',
    prompt:
      'Create a structured performance review template for quarterly evaluations that includes sections for goal achievement, competency assessment, areas for improvement, and development plan.',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    id: 'payroll-deductions',
    title: 'Explain payroll deductions',
    desc: 'PF, ESI, TDS with examples',
    prompt:
      'Explain the standard payroll deductions applicable to employees in India including Provident Fund (PF), Employee State Insurance (ESI), Professional Tax, and Income Tax (TDS) with example calculations for a monthly CTC of 8 LPA.',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    id: 'offer-letter',
    title: 'Draft an offer letter',
    desc: 'For a senior engineering role',
    prompt:
      'Write a professional offer letter for a Senior Software Engineer position with a joining date, compensation breakdown, probation period, benefits summary, and standard terms and conditions.',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
  },
  {
    id: 'compliance',
    title: 'Compliance requirements',
    desc: 'EPF Act for 20+ employees',
    prompt:
      "Summarize the key compliance requirements for an Indian company with more than 20 employees under the Employees' Provident Funds and Miscellaneous Provisions Act, 1952.",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    id: 'onboarding-plan',
    title: 'Onboarding plan',
    desc: '30-60-90 day product team plan',
    prompt:
      'Create a 30-60-90 day onboarding plan for a new hire joining the product team, including milestones, check-in points, required training sessions, and expected deliverables for each phase.',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 11 12 14 22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
];

export default function AIAssistantPage() {
  const [selectedModel, setSelectedModel] = useState<string>('gemini-1.5-flash');
  const [prompt, setPrompt] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { generate, data, loading, error } = useAiCompletion();

  const handleGenerate = async (customPrompt?: string) => {
    const textToSend = (customPrompt !== undefined ? customPrompt : prompt).trim();
    if (!textToSend || loading) return;

    setShowSuggestions(false);
    await generate({
      prompt: textToSend,
      model: selectedModel,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (prompt.trim().length > 0) {
        handleGenerate();
      }
    }
  };

  const handleSuggestionClick = (suggestionPrompt: string) => {
    setPrompt(suggestionPrompt);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleCopy = () => {
    if (!data?.content) return;
    navigator.clipboard.writeText(data.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const isGroq = data?.provider === 'groq' || data?.model?.includes('llama') || selectedModel.includes('llama');
  const providerTagClass = isGroq ? 'ai-response-provider-tag groq' : 'ai-response-provider-tag gemini';
  const providerModelLabel = data?.model || (selectedModel === 'gemini-1.5-flash' ? 'gemini-1.5-flash' : 'llama-3.3-70b-versatile');

  return (
    <DashboardLayout title="AI Assistant">
      <div className="ai-assistant-wrapper">
        <div className="ai-page">

          {/* Page Header */}
          <div className="ai-page-header">
            <h1 className="ai-page-title">AI Assistant</h1>
            <p className="ai-page-subtitle">
              Draft documents, generate summaries, and get answers using your EMS data context.
            </p>
          </div>

          {/* Provider Cards */}
          <div className="ai-providers-row">
            <div
              className={`ai-provider-card ${selectedModel === 'gemini-1.5-flash' ? 'active' : ''}`}
              onClick={() => setSelectedModel('gemini-1.5-flash')}
            >
              <div className="ai-provider-info">
                <div className="ai-provider-icon gemini">G</div>
                <div className="ai-provider-details">
                  <span className="ai-provider-name">Google Gemini</span>
                  <span className="ai-provider-model">gemini-1.5-flash</span>
                </div>
              </div>
              <div className="ai-provider-meta">
                <span className="ai-provider-badge primary">Primary</span>
                <span className="ai-provider-context">1M tokens</span>
              </div>
            </div>

            <div
              className={`ai-provider-card ${selectedModel === 'llama-3.3-70b-versatile' ? 'active' : ''}`}
              onClick={() => setSelectedModel('llama-3.3-70b-versatile')}
            >
              <div className="ai-provider-info">
                <div className="ai-provider-icon groq">Q</div>
                <div className="ai-provider-details">
                  <span className="ai-provider-name">Groq</span>
                  <span className="ai-provider-model">llama-3.3-70b-versatile</span>
                </div>
              </div>
              <div className="ai-provider-meta">
                <span className="ai-provider-badge fallback">Fallback</span>
                <span className="ai-provider-context">128K tokens</span>
              </div>
            </div>
          </div>

          {/* Prompt Section */}
          <div className="ai-prompt-section">
            <div className="ai-prompt-container">
              <textarea
                ref={textareaRef}
                className="ai-prompt-textarea"
                id="promptInput"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe what you need — draft a policy, summarize documents, generate a report outline, or ask a question about employee data..."
                spellCheck={true}
                disabled={loading}
              />
              <div className="ai-prompt-footer">
                <div className="ai-prompt-footer-left">
                  <span className="ai-prompt-char-hint" id="charCount">
                    {prompt.length} character{prompt.length !== 1 ? 's' : ''}
                  </span>
                  <span className="ai-prompt-kbd">Shift + Enter</span>
                  <span className="ai-prompt-char-hint">for new line</span>
                </div>
                <button
                  className="ai-prompt-submit"
                  id="submitBtn"
                  onClick={() => handleGenerate()}
                  disabled={!prompt.trim() || loading}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                  <span>Generate</span>
                </button>
              </div>
            </div>
          </div>

          {/* Response Area */}
          {(loading || data || error) && (
            <div className="ai-response-section" id="responseSection">
              <div className="ai-response-container">
                <div className="ai-response-header">
                  <div className="ai-response-header-left">
                    <span className={providerTagClass} id="responseProvider">
                      {providerModelLabel}
                    </span>
                    {data?.latencyMs !== undefined && (
                      <span className="ai-response-latency" id="responseLatency">
                        {data.latencyMs}ms
                      </span>
                    )}
                  </div>
                </div>

                {loading && (
                  <div className="ai-loading-indicator" id="loadingIndicator">
                    <div className="ai-loading-dots">
                      <div className="ai-loading-dot" />
                      <div className="ai-loading-dot" />
                      <div className="ai-loading-dot" />
                    </div>
                    <span className="ai-loading-text">Generating response...</span>
                  </div>
                )}

                {error && !loading && (
                  <div className="ai-response-body" style={{ color: '#b91c1c' }}>
                    <p><strong>Error generating completion:</strong> {error.message}</p>
                    <p style={{ fontSize: '12px', color: '#6b6560', marginTop: '8px' }}>
                      Transparent fallback is active. You can retry with Groq or check network connectivity.
                    </p>
                  </div>
                )}

                {data && !loading && (
                  <>
                    <div className="ai-response-body" id="responseBody">
                      {data.content}
                    </div>
                    <div className="ai-response-actions">
                      <button className="ai-response-action-btn" id="copyBtn" onClick={handleCopy}>
                        {copied ? (
                          <>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                      <button className="ai-response-action-btn" id="regenerateBtn" onClick={() => handleGenerate()}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="23 4 23 10 17 10" />
                          <polyline points="1 20 1 14 7 14" />
                          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                        </svg>
                        <span>Regenerate</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {showSuggestions && (
            <div className="ai-suggestions-section" id="suggestionsSection">
              <div className="ai-suggestions-label">Suggested prompts</div>
              <div className="ai-suggestions-grid">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    className="ai-suggestion-chip"
                    onClick={() => handleSuggestionClick(suggestion.prompt)}
                  >
                    <div className="ai-suggestion-icon">{suggestion.icon}</div>
                    <div className="ai-suggestion-text">
                      <span className="ai-suggestion-title">{suggestion.title}</span>
                      <span className="ai-suggestion-desc">{suggestion.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </DashboardLayout>
  );
}
