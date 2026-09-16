export const LONDON_TIMEZONE = 'Europe/London';
export const DHAKA_TIMEZONE = LONDON_TIMEZONE; // Aliased for backwards compatibility

/**
 * Format a Date object or ISO string into London time string (hh:mm:ss AM/PM)
 */
export function formatLondonTime(date: Date | string = new Date()): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '--:--:--';
    return d.toLocaleTimeString('en-GB', {
      timeZone: LONDON_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  } catch {
    return '--:--:--';
  }
}

export const formatDhakaTime = formatLondonTime;

/**
 * Format a Date object or ISO string into London date string (e.g., Sun, 15 Sep 2026)
 */
export function formatLondonDate(date: Date | string = new Date()): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '----/--/--';
    return d.toLocaleDateString('en-GB', {
      timeZone: LONDON_TIMEZONE,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '----/--/--';
  }
}

export const formatDhakaDate = formatLondonDate;

/**
 * Format full London date and time string
 */
export function formatLondonDateTime(date: Date | string = new Date()): string {
  return `${formatLondonDate(date)} • ${formatLondonTime(date)}`;
}

export const formatDhakaDateTime = formatLondonDateTime;

