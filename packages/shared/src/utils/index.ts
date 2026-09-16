import { ApiResponse, PaginatedResponse, ApiErrorResponse, PaginationMeta } from '../types/index.js';

/**
 * Monetary arithmetic utilities using integer representation (cents/minor units) to avoid floating-point issues.
 */
export const CurrencyUtil = {
  toMinorUnits(amount: number): number {
    return Math.round(amount * 100);
  },

  fromMinorUnits(cents: number): number {
    return Number((cents / 100).toFixed(2));
  },

  format(amount: number, currency: string = 'BDT'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  },

  calculateComponent(base: number, calculationType: string, value: number): number {
    if (calculationType === 'FIXED') {
      return value;
    }
    // Percentage
    return Number(((base * value) / 100).toFixed(2));
  },
};

/**
 * Date and time calculations
 */
export const DateUtil = {
  formatIso(date: Date | string): string {
    return new Date(date).toISOString();
  },

  formatDateOnly(date: Date | string): string {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  },

  calculateDaysBetween(startDate: string | Date, endDate: string | Date): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive
  },

  calculateHoursWorked(clockIn: Date | string, clockOut: Date | string): number {
    const start = new Date(clockIn).getTime();
    const end = new Date(clockOut).getTime();
    const hours = (end - start) / (1000 * 60 * 60);
    return Number(Math.max(0, hours).toFixed(2));
  },
};

/**
 * PII Redactor for privacy safety and audit logs
 */
export const PiiRedactor = {
  redactSsn(text: string): string {
    return text.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[REDACTED_SSN]');
  },

  redactCreditCards(text: string): string {
    return text.replace(/\b(?:\d{4}[-\s]?){3}\d{4}\b/g, '[REDACTED_CARD]');
  },

  redactEmails(text: string): string {
    return text.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/g, '[REDACTED_EMAIL]');
  },

  redactPhones(text: string): string {
    return text.replace(/\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, '[REDACTED_PHONE]');
  },

  sanitizePrompt(text: string): string {
    let sanitized = text;
    sanitized = this.redactSsn(sanitized);
    sanitized = this.redactCreditCards(sanitized);
    sanitized = this.redactPhones(sanitized);
    return sanitized;
  },
};

/**
 * Standard API response builders
 */
export function createSuccessResponse<T>(data: T, message?: string, meta?: Record<string, any>): ApiResponse<T> {
  return {
    success: true,
    message,
    data,
    meta,
    timestamp: new Date().toISOString(),
  };
}

export function createPaginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
): ApiResponse<PaginatedResponse<T>> {
  const totalPages = Math.ceil(total / limit) || 1;
  const meta: PaginationMeta = {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };

  return {
    success: true,
    data: {
      items,
      meta,
    },
    timestamp: new Date().toISOString(),
  };
}

export function createErrorResponse(
  code: string,
  message: string,
  statusCode: number = 400,
  details?: any,
  path?: string,
): ApiErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      statusCode,
      details,
      timestamp: new Date().toISOString(),
      path,
    },
  };
}
