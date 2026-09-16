export const DHAKA_TIMEZONE = 'Asia/Dhaka';

/**
 * Format a Date object or ISO string into Dhaka (UTC+6) time string (hh:mm:ss AM/PM)
 */
export function formatDhakaTime(date: Date | string = new Date()): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '--:--:--';
    return d.toLocaleTimeString('en-US', {
      timeZone: DHAKA_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  } catch {
    return '--:--:--';
  }
}

/**
 * Format a Date object or ISO string into Dhaka (UTC+6) date string (e.g., Sun, Sep 13, 2026)
 */
export function formatDhakaDate(date: Date | string = new Date()): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '----/--/--';
    return d.toLocaleDateString('en-US', {
      timeZone: DHAKA_TIMEZONE,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '----/--/--';
  }
}

/**
 * Format full Dhaka date and time string
 */
export function formatDhakaDateTime(date: Date | string = new Date()): string {
  return `${formatDhakaDate(date)} • ${formatDhakaTime(date)}`;
}
