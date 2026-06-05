import { parseISO } from 'date-fns';

/** Parsed date filter — start- and end-of-day timestamps, or {} if unparseable. */
export type DateFilterRange = { dateFrom?: Date; dateTo?: Date };

/**
 * Turn the date filter token used by interview / candidate search URLs into
 * a {dateFrom, dateTo} pair. Accepted tokens:
 *
 *   today | tomorrow | this-week | next-week     — relative ranges
 *   YYYY-MM-DD|YYYY-MM-DD                        — explicit range
 *   '' / undefined / unparseable                 — returns {}
 */
export function parseDateFilter(token: string | undefined | null): DateFilterRange {
  if (!token) return {};

  try {
    if (token === 'today') return dayRange(new Date());

    if (token === 'tomorrow') {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return dayRange(d);
    }

    if (token === 'this-week') return weekRangeStartingMonday(0);
    if (token === 'next-week') return weekRangeStartingMonday(7);

    if (token.includes('|')) {
      const [fromStr, toStr] = token.split('|');
      const dateFrom = parseISO(fromStr);
      dateFrom.setHours(0, 0, 0, 0);
      const dateTo = parseISO(toStr);
      dateTo.setHours(23, 59, 59, 999);
      return { dateFrom, dateTo };
    }
  } catch (error) {
    console.error('Failed to parse date filter:', error);
  }
  return {};
}

function dayRange(d: Date): DateFilterRange {
  const dateFrom = new Date(d);
  dateFrom.setHours(0, 0, 0, 0);
  const dateTo = new Date(d);
  dateTo.setHours(23, 59, 59, 999);
  return { dateFrom, dateTo };
}

function weekRangeStartingMonday(offsetDays: number): DateFilterRange {
  const now = new Date();
  const day = now.getDay();
  // Sunday (0) wraps to the previous week's Monday.
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const dateFrom = new Date(now);
  dateFrom.setDate(now.getDate() + mondayOffset + offsetDays);
  dateFrom.setHours(0, 0, 0, 0);
  const dateTo = new Date(dateFrom);
  dateTo.setDate(dateTo.getDate() + 6);
  dateTo.setHours(23, 59, 59, 999);
  return { dateFrom, dateTo };
}
