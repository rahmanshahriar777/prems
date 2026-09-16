'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  CheckSquare,
  Square,
  Bell,
  Users,
  MapPin,
  Video,
  Trash2,
  X,
  Sparkles,
  AlertCircle,
  TrendingUp,
  ShieldCheck,
  Building2,
  CheckCircle2,
  CalendarDays
} from 'lucide-react';
import { formatLondonTime } from '../../../lib/date-utils';
import '../../../styles/calendar.css';

export type EventCategory = 'meeting' | 'task' | 'reminder' | 'event' | 'pto' | 'review';
export type PriorityLevel = 'normal' | 'high' | 'urgent';

export interface CalendarEvent {
  id: string;
  title: string;
  category: EventCategory;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM (24h)
  endTime: string; // HH:MM (24h)
  location?: string;
  description?: string;
  priority?: PriorityLevel;
  completed?: boolean;
}

const CATEGORY_LABELS: Record<EventCategory, string> = {
  meeting: 'Meeting',
  task: 'Task',
  reminder: 'Reminder',
  event: 'Event',
  pto: 'PTO / Leave',
  review: '1-on-1 Review'
};

const CATEGORY_DOT_COLORS: Record<EventCategory, string> = {
  meeting: '#2c5b6b',
  task: '#2c5f4a',
  reminder: '#a86520',
  event: '#664d82',
  pto: '#9e3d3d',
  review: '#246859'
};

const INITIAL_EVENTS: CalendarEvent[] = [
  {
    id: 'evt-1',
    title: 'Daily Engineering Standup',
    category: 'meeting',
    date: '2026-09-15',
    startTime: '09:30',
    endTime: '10:00',
    location: 'Google Meet',
    description: 'Review blockers, pull request updates, and sprint progress.',
    priority: 'normal'
  },
  {
    id: 'evt-2',
    title: 'Complete SOC2 Audit Documentation',
    category: 'task',
    date: '2026-09-15',
    startTime: '11:00',
    endTime: '12:30',
    location: 'Security Portal',
    description: 'Verify SHA-256 log hashes and upload quarterly compliance signoff.',
    priority: 'high',
    completed: false
  },
  {
    id: 'evt-3',
    title: '1-on-1 with Engineering Lead (Shahriar)',
    category: 'review',
    date: '2026-09-15',
    startTime: '14:00',
    endTime: '14:45',
    location: 'Meeting Room B / Zoom',
    description: 'Quarterly review milestones, OKR progress, and career growth roadmap.',
    priority: 'normal'
  },
  {
    id: 'evt-4',
    title: 'Submit Monthly Timesheet & Overtime',
    category: 'reminder',
    date: '2026-09-15',
    startTime: '17:30',
    endTime: '18:00',
    location: 'EMS Portal',
    description: 'Finalize attendance log entries prior to payroll batch cutoff.',
    priority: 'urgent',
    completed: false
  },
  {
    id: 'evt-5',
    title: 'Sprint 24 Planning & Backlog Grooming',
    category: 'meeting',
    date: '2026-09-16',
    startTime: '10:00',
    endTime: '11:30',
    location: 'Conference Room 1',
    description: 'Story point estimation for AI Assistant Phase 2 capabilities.',
    priority: 'high'
  },
  {
    id: 'evt-6',
    title: 'All-Hands Town Hall Q3',
    category: 'event',
    date: '2026-09-18',
    startTime: '15:00',
    endTime: '16:30',
    location: 'Main Auditorium & Zoom Live',
    description: 'Executive roadmap presentation by Practical Roof Solutions Ltd leadership.',
    priority: 'normal'
  },
  {
    id: 'evt-7',
    title: 'Approved Medical Leave',
    category: 'pto',
    date: '2026-09-22',
    startTime: '09:00',
    endTime: '18:00',
    location: 'Out of Office',
    description: 'Approved PTO by HR Operations.',
    priority: 'normal'
  },
  {
    id: 'evt-8',
    title: 'Monthly Compensation & Payroll Review',
    category: 'task',
    date: '2026-09-25',
    startTime: '13:00',
    endTime: '14:30',
    location: 'Finance Suite',
    description: 'Verify bank disbursement batch records and tax deductions.',
    priority: 'high',
    completed: false
  }
];

export default function CalendarPage() {
  // Current view date state (year and month navigation)
  const [currentDate, setCurrentDate] = useState(() => new Date(2026, 8, 15)); // Sep 15, 2026
  const [selectedDateStr, setSelectedDateStr] = useState('2026-09-15');
  const [activeView, setActiveView] = useState<'month' | 'week'>('month');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [events, setEvents] = useState<CalendarEvent[]>(INITIAL_EVENTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [quickTaskText, setQuickTaskText] = useState('');

  // New event modal form state
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<EventCategory>('meeting');
  const [formDate, setFormDate] = useState(selectedDateStr);
  const [formStartTime, setFormStartTime] = useState('09:00');
  const [formEndTime, setFormEndTime] = useState('10:00');
  const [formLocation, setFormLocation] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPriority, setFormPriority] = useState<PriorityLevel>('normal');

  // Local storage persistence
  useEffect(() => {
    try {
      const saved = localStorage.getItem('neoems_calendar_events');
      if (saved) {
        setEvents(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  const [londonTime, setLondonTime] = useState<string>('');

  useEffect(() => {
    const update = () => setLondonTime(formatLondonTime());
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  const saveEvents = (updated: CalendarEvent[]) => {
    setEvents(updated);
    try {
      localStorage.setItem('neoems_calendar_events', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Month navigation helpers
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrev = () => {
    if (activeView === 'month') {
      setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    } else {
      const prevWeek = new Date(currentDate);
      prevWeek.setDate(prevWeek.getDate() - 7);
      setCurrentDate(prevWeek);
    }
  };

  const handleNext = () => {
    if (activeView === 'month') {
      setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    } else {
      const nextWeek = new Date(currentDate);
      nextWeek.setDate(nextWeek.getDate() + 7);
      setCurrentDate(nextWeek);
    }
  };

  const handleToday = () => {
    const today = new Date(2026, 8, 15);
    setCurrentDate(today);
    setSelectedDateStr('2026-09-15');
  };

  // Filter events
  const filteredEvents = useMemo(() => {
    if (selectedCategory === 'all') return events;
    return events.filter(e => e.category === selectedCategory);
  }, [events, selectedCategory]);

  // Metric summaries
  const todayEvents = useMemo(() => {
    return events.filter(e => e.date === '2026-09-15');
  }, [events]);

  const pendingTasksCount = useMemo(() => {
    return events.filter(e => e.category === 'task' && !e.completed).length;
  }, [events]);

  const meetingsCount = useMemo(() => {
    return events.filter(e => e.category === 'meeting' || e.category === 'review').length;
  }, [events]);

  const upcomingPtoCount = useMemo(() => {
    return events.filter(e => e.category === 'pto').length;
  }, [events]);

  // Selected date events for daily agenda
  const selectedDateEvents = useMemo(() => {
    return filteredEvents
      .filter(e => e.date === selectedDateStr)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [filteredEvents, selectedDateStr]);

  // Toggle task completion
  const handleToggleComplete = (id: string) => {
    const updated = events.map(e => {
      if (e.id === id) {
        return { ...e, completed: !e.completed };
      }
      return e;
    });
    saveEvents(updated);
  };

  // Delete event
  const handleDeleteEvent = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = events.filter(ev => ev.id !== id);
    saveEvents(updated);
  };

  // Quick inline add task
  const handleQuickAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskText.trim()) return;

    const newEvt: CalendarEvent = {
      id: `evt-${Date.now()}`,
      title: quickTaskText.trim(),
      category: 'task',
      date: selectedDateStr,
      startTime: '09:00',
      endTime: '09:30',
      priority: 'normal',
      completed: false
    };

    saveEvents([...events, newEvt]);
    setQuickTaskText('');
  };

  // Open modal for specific date
  const handleOpenAddModal = (dateStr?: string) => {
    setFormDate(dateStr || selectedDateStr);
    setFormTitle('');
    setFormCategory('meeting');
    setFormStartTime('09:00');
    setFormEndTime('10:00');
    setFormLocation('');
    setFormDescription('');
    setFormPriority('normal');
    setIsModalOpen(true);
  };

  // Create event submission
  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const newEvt: CalendarEvent = {
      id: `evt-${Date.now()}`,
      title: formTitle.trim(),
      category: formCategory,
      date: formDate,
      startTime: formStartTime,
      endTime: formEndTime,
      location: formLocation.trim() || undefined,
      description: formDescription.trim() || undefined,
      priority: formPriority,
      completed: false
    };

    saveEvents([...events, newEvt]);
    setSelectedDateStr(formDate);
    setIsModalOpen(false);
  };

  // ─── MONTH GRID CALCULATION ───────────────────────────
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun
  // Convert to Mon-first: Mon=0, Sun=6
  const startOffset = (firstDayOfWeek + 6) % 7;

  // Previous month padding
  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
  const daysGrid: { day: number; monthOffset: number; dateStr: string }[] = [];

  for (let i = startOffset - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const m = currentMonth === 0 ? 12 : currentMonth;
    const y = currentMonth === 0 ? currentYear - 1 : currentYear;
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    daysGrid.push({ day: d, monthOffset: -1, dateStr });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    daysGrid.push({ day: d, monthOffset: 0, dateStr });
  }

  // Next month padding (total cells divisible by 7, 35 or 42)
  const remainingCells = 7 - (daysGrid.length % 7);
  if (remainingCells < 7) {
    for (let d = 1; d <= remainingCells; d++) {
      const m = currentMonth === 11 ? 1 : currentMonth + 2;
      const y = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      daysGrid.push({ day: d, monthOffset: 1, dateStr });
    }
  }

  // Format selected date nicely
  const formattedSelectedDate = useMemo(() => {
    try {
      const [y, m, d] = selectedDateStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return selectedDateStr;
    }
  }, [selectedDateStr]);

  // ─── WEEK VIEW CALCULATION ───────────────────────────
  const weekDays = useMemo(() => {
    const curr = new Date(currentDate);
    const dayOfWeek = (curr.getDay() + 6) % 7; // Mon = 0
    const monday = new Date(curr);
    monday.setDate(curr.getDate() - dayOfWeek);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dayNum = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${dayNum}`;
      days.push({
        dateObj: d,
        dayNum: d.getDate(),
        dayName: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
        dateStr,
        isToday: dateStr === '2026-09-15'
      });
    }
    return days;
  }, [currentDate]);

  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
  ];

  return (
    <div className="calendar-editorial-wrapper">
      <div className="cal-page">
        {/* ─── HEADER BAR ─────────────────── */}
        <header className="cal-header">
          <div>
            <h1 className="cal-title">Workforce Calendar & Daily Routines</h1>
            <p className="cal-subtitle">
              Intelligent enterprise scheduling — coordinate sprint standups, review milestones, PTO requests, and personal tasks.
            </p>
          </div>

          <div className="cal-header-actions">
            <div className="cal-clock-badge">
              <span className="cal-clock-dot" />
              <span>London UK • {londonTime || '09:41 AM'}</span>
            </div>

            <button
              className="cal-btn-primary"
              onClick={() => handleOpenAddModal()}
            >
              <Plus size={15} />
              <span>New Event</span>
            </button>
          </div>
        </header>

        {/* ─── 4-STAT METRIC CARDS ─────────────────── */}
        <div className="cal-stats-grid">
          <div className="cal-stat-card">
            <div className="cal-stat-top">
              <span className="cal-stat-label">Today's Schedule</span>
              <div className="cal-stat-icon green">
                <CalendarDays size={16} />
              </div>
            </div>
            <div className="cal-stat-value">{todayEvents.length} Items</div>
            <div className="cal-stat-desc">Active schedule for Sep 15, 2026</div>
          </div>

          <div className="cal-stat-card">
            <div className="cal-stat-top">
              <span className="cal-stat-label">Pending Tasks</span>
              <div className="cal-stat-icon green">
                <CheckSquare size={16} />
              </div>
            </div>
            <div className="cal-stat-value">{pendingTasksCount} Open</div>
            <div className="cal-stat-desc">Routines requiring completion</div>
          </div>

          <div className="cal-stat-card">
            <div className="cal-stat-top">
              <span className="cal-stat-label">Meetings & 1-on-1s</span>
              <div className="cal-stat-icon blue">
                <Users size={16} />
              </div>
            </div>
            <div className="cal-stat-value">{meetingsCount} Syncs</div>
            <div className="cal-stat-desc">Collaborative reviews scheduled</div>
          </div>

          <div className="cal-stat-card">
            <div className="cal-stat-top">
              <span className="cal-stat-label">Approved PTO / Out</span>
              <div className="cal-stat-icon rose">
                <Clock size={16} />
              </div>
            </div>
            <div className="cal-stat-value">{upcomingPtoCount} Day</div>
            <div className="cal-stat-desc">Upcoming out-of-office roster</div>
          </div>
        </div>

        {/* ─── TOOLBAR & FILTER CONTROLS ─────────────────── */}
        <div className="cal-toolbar">
          <div className="cal-nav-group">
            <button className="cal-nav-btn" onClick={handlePrev} title="Previous">
              <ChevronLeft size={16} />
            </button>
            <button className="cal-today-btn" onClick={handleToday}>
              Today
            </button>
            <button className="cal-nav-btn" onClick={handleNext} title="Next">
              <ChevronRight size={16} />
            </button>

            <span className="cal-current-period">
              {monthNames[currentMonth]} {currentYear}
            </span>
          </div>

          {/* Category Filter Pills */}
          <div className="cal-filter-pills">
            <button
              className={`cal-filter-pill ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              All
            </button>
            {(['meeting', 'task', 'reminder', 'event', 'pto', 'review'] as EventCategory[]).map(cat => (
              <button
                key={cat}
                className={`cal-filter-pill ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                <span
                  className="cal-pill-dot"
                  style={{ backgroundColor: CATEGORY_DOT_COLORS[cat] }}
                />
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>

          {/* View Switcher */}
          <div className="cal-view-switch">
            <button
              className={`cal-view-btn ${activeView === 'month' ? 'active' : ''}`}
              onClick={() => setActiveView('month')}
            >
              Month
            </button>
            <button
              className={`cal-view-btn ${activeView === 'week' ? 'active' : ''}`}
              onClick={() => setActiveView('week')}
            >
              Week
            </button>
          </div>
        </div>

        {/* ─── MAIN WORKSPACE GRID ─────────────────── */}
        <div className="cal-workspace">
          {/* Calendar Card (Month or Week) */}
          <div className="cal-main-card">
            {activeView === 'month' ? (
              <div className="cal-month-grid">
                {/* Weekdays row */}
                <div className="cal-weekdays-row">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(w => (
                    <div key={w} className="cal-weekday-cell">
                      {w}
                    </div>
                  ))}
                </div>

                {/* Days Matrix */}
                <div className="cal-days-matrix">
                  {daysGrid.map((cell, idx) => {
                    const isToday = cell.dateStr === '2026-09-15';
                    const isSelected = cell.dateStr === selectedDateStr;
                    const isOtherMonth = cell.monthOffset !== 0;

                    const dayEvts = filteredEvents.filter(e => e.date === cell.dateStr);

                    return (
                      <div
                        key={`${cell.dateStr}-${idx}`}
                        className={`cal-day-cell ${isOtherMonth ? 'other-month' : ''} ${
                          isToday ? 'today' : ''
                        } ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedDateStr(cell.dateStr)}
                      >
                        <div className="cal-day-header">
                          <span className="cal-day-num">{cell.day}</span>
                          <button
                            className="cal-day-add-btn"
                            title="Add event to date"
                            onClick={e => {
                              e.stopPropagation();
                              handleOpenAddModal(cell.dateStr);
                            }}
                          >
                            <Plus size={13} />
                          </button>
                        </div>

                        <div className="cal-day-events">
                          {dayEvts.slice(0, 3).map(ev => (
                            <div
                              key={ev.id}
                              className={`cal-event-chip ${ev.category}`}
                              title={`${ev.startTime} - ${ev.title}`}
                              onClick={e => {
                                e.stopPropagation();
                                setSelectedDateStr(ev.date);
                              }}
                            >
                              <span className="cal-chip-title">
                                {ev.startTime.slice(0, 5)} {ev.title}
                              </span>
                            </div>
                          ))}
                          {dayEvts.length > 3 && (
                            <div className="cal-more-badge">
                              +{dayEvts.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Weekly View */
              <div className="cal-week-view">
                <div className="cal-week-header-row">
                  <div className="cal-time-label" style={{ textAlign: 'center', padding: '12px 4px' }}>
                    Time
                  </div>
                  {weekDays.map(wd => (
                    <div
                      key={wd.dateStr}
                      className={`cal-week-col-header ${wd.isToday ? 'today' : ''}`}
                      onClick={() => setSelectedDateStr(wd.dateStr)}
                      style={{ cursor: 'pointer' }}
                    >
                      <span className="cal-week-day-name">{wd.dayName}</span>
                      <span className="cal-week-day-num">{wd.dayNum}</span>
                    </div>
                  ))}
                </div>

                <div className="cal-week-grid">
                  {timeSlots.map(time => (
                    <div key={time} className="cal-time-row">
                      <div className="cal-time-label">{time}</div>
                      {weekDays.map(wd => {
                        const slotEvts = filteredEvents.filter(
                          e => e.date === wd.dateStr && e.startTime.startsWith(time.slice(0, 2))
                        );

                        return (
                          <div
                            key={`${wd.dateStr}-${time}`}
                            className="cal-time-slot-cell"
                            onClick={() => {
                              setSelectedDateStr(wd.dateStr);
                              handleOpenAddModal(wd.dateStr);
                            }}
                          >
                            {slotEvts.map(ev => (
                              <div
                                key={ev.id}
                                className={`cal-event-chip ${ev.category}`}
                                title={`${ev.startTime} - ${ev.title}`}
                                onClick={e => {
                                  e.stopPropagation();
                                  setSelectedDateStr(ev.date);
                                }}
                              >
                                <span className="cal-chip-title">{ev.title}</span>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ─── RIGHT-HAND AGENDA PANEL ─────────────────── */}
          <aside className="cal-agenda-panel">
            <div className="cal-agenda-header">
              <div className="cal-agenda-tag">Daily Agenda</div>
              <h2 className="cal-agenda-date">{formattedSelectedDate}</h2>
              <div className="cal-agenda-meta-row">
                <span className="cal-agenda-meta-pill">
                  <CalendarIcon size={12} />
                  {selectedDateEvents.length} Scheduled
                </span>
                <span className="cal-agenda-meta-pill">
                  <CheckSquare size={12} />
                  {selectedDateEvents.filter(e => e.category === 'task').length} Tasks
                </span>
              </div>
            </div>

            <div className="cal-agenda-body">
              {selectedDateEvents.length === 0 ? (
                <div className="cal-empty-agenda">
                  <div className="cal-empty-icon">
                    <CalendarIcon size={20} />
                  </div>
                  <div style={{ fontWeight: 500, color: 'var(--cal-text-secondary)', fontSize: 13 }}>
                    No events scheduled for this day
                  </div>
                  <button
                    className="cal-btn-primary"
                    style={{ fontSize: 12, padding: '6px 12px', marginTop: 6 }}
                    onClick={() => handleOpenAddModal(selectedDateStr)}
                  >
                    <Plus size={13} />
                    <span>Add to this date</span>
                  </button>
                </div>
              ) : (
                selectedDateEvents.map(item => {
                  const isTask = item.category === 'task';

                  return (
                    <div
                      key={item.id}
                      className={`cal-agenda-item ${item.completed ? 'completed' : ''}`}
                    >
                      <div className="cal-agenda-item-top">
                        <span className={`cal-item-category-badge ${item.category}`}>
                          {CATEGORY_LABELS[item.category]}
                        </span>

                        <div className="cal-item-actions">
                          <button
                            className="cal-icon-action delete"
                            title="Remove event"
                            onClick={e => handleDeleteEvent(item.id, e)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      <div className="cal-agenda-title-row">
                        {isTask && (
                          <input
                            type="checkbox"
                            className="cal-task-check"
                            checked={!!item.completed}
                            onChange={() => handleToggleComplete(item.id)}
                            title="Mark completed"
                          />
                        )}
                        <span className="cal-agenda-item-title">{item.title}</span>
                      </div>

                      <div className="cal-agenda-item-time">
                        <Clock size={12} />
                        <span>
                          {item.startTime} — {item.endTime}
                        </span>
                      </div>

                      {item.location && (
                        <div className="cal-agenda-item-location">
                          {item.location.toLowerCase().includes('meet') ||
                          item.location.toLowerCase().includes('zoom') ? (
                            <Video size={12} style={{ color: 'var(--cal-accent)' }} />
                          ) : (
                            <MapPin size={12} />
                          )}
                          <span>{item.location}</span>
                        </div>
                      )}

                      {item.description && (
                        <div className="cal-agenda-item-desc">
                          {item.description}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick Task Add */}
            <form className="cal-quick-add-box" onSubmit={handleQuickAddTask}>
              <input
                type="text"
                className="cal-quick-input"
                placeholder="Quick-add task for this day..."
                value={quickTaskText}
                onChange={e => setQuickTaskText(e.target.value)}
              />
              <button type="submit" className="cal-quick-btn">
                Add Task
              </button>
            </form>
          </aside>
        </div>

        {/* ─── EVENT CREATION / EDIT MODAL ─────────────────── */}
        {isModalOpen && (
          <div className="cal-modal-overlay" onClick={() => setIsModalOpen(false)}>
            <div className="cal-modal-card" onClick={e => e.stopPropagation()}>
              <div className="cal-modal-header">
                <h3 className="cal-modal-title">Schedule New Event</h3>
                <button
                  className="cal-modal-close"
                  onClick={() => setIsModalOpen(false)}
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateEvent}>
                <div className="cal-modal-body">
                  <div className="cal-form-group">
                    <label className="cal-form-label">Event Title *</label>
                    <input
                      type="text"
                      className="cal-form-input"
                      placeholder="e.g., Sprint Planning or Weekly 1-on-1"
                      value={formTitle}
                      onChange={e => setFormTitle(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>

                  <div className="cal-form-group">
                    <label className="cal-form-label">Category</label>
                    <div className="cal-category-options">
                      {(['meeting', 'task', 'reminder', 'event', 'pto', 'review'] as EventCategory[]).map(cat => (
                        <label
                          key={cat}
                          className={`cal-cat-radio-label ${formCategory === cat ? 'selected' : ''}`}
                        >
                          <input
                            type="radio"
                            name="category"
                            value={cat}
                            checked={formCategory === cat}
                            onChange={() => setFormCategory(cat)}
                            style={{ display: 'none' }}
                          />
                          <span
                            className="cal-pill-dot"
                            style={{ backgroundColor: CATEGORY_DOT_COLORS[cat] }}
                          />
                          <span>{CATEGORY_LABELS[cat]}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="cal-form-row">
                    <div className="cal-form-group">
                      <label className="cal-form-label">Date</label>
                      <input
                        type="date"
                        className="cal-form-input"
                        value={formDate}
                        onChange={e => setFormDate(e.target.value)}
                        required
                      />
                    </div>

                    <div className="cal-form-group">
                      <label className="cal-form-label">Priority</label>
                      <select
                        className="cal-form-select"
                        value={formPriority}
                        onChange={e => setFormPriority(e.target.value as PriorityLevel)}
                      >
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>

                  <div className="cal-form-row">
                    <div className="cal-form-group">
                      <label className="cal-form-label">Start Time</label>
                      <input
                        type="time"
                        className="cal-form-input"
                        value={formStartTime}
                        onChange={e => setFormStartTime(e.target.value)}
                        required
                      />
                    </div>

                    <div className="cal-form-group">
                      <label className="cal-form-label">End Time</label>
                      <input
                        type="time"
                        className="cal-form-input"
                        value={formEndTime}
                        onChange={e => setFormEndTime(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="cal-form-group">
                    <label className="cal-form-label">Location or Meeting Link</label>
                    <input
                      type="text"
                      className="cal-form-input"
                      placeholder="e.g., Conference Room B or https://meet.google.com/xyz"
                      value={formLocation}
                      onChange={e => setFormLocation(e.target.value)}
                    />
                  </div>

                  <div className="cal-form-group">
                    <label className="cal-form-label">Description / Agenda Notes</label>
                    <textarea
                      className="cal-form-textarea"
                      placeholder="Add brief agenda context, relevant links, or checklist items..."
                      value={formDescription}
                      onChange={e => setFormDescription(e.target.value)}
                    />
                  </div>
                </div>

                <div className="cal-modal-footer">
                  <button
                    type="button"
                    className="cal-btn-secondary"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="cal-btn-primary">
                    Save Event
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
