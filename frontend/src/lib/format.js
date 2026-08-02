/** Presentation-only helpers. No component formats a date or name inline. */

const DATE_FORMAT = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

export const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : DATE_FORMAT.format(date);
};

const MONTH_FORMAT = new Intl.DateTimeFormat(undefined, { month: 'short' });

/** `"2026-08"` -> `"Aug"`. The dashboard trend series is keyed this way. */
export const formatMonth = (value) => {
  if (!value) return '—';
  const date = new Date(`${value}-01T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : MONTH_FORMAT.format(date);
};

export const DAY_MS = 24 * 60 * 60 * 1000;

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

/** Whole days from today until `value`. Negative once the date has passed. */
export function daysUntil(value) {
  if (!value) return null;
  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return null;
  return Math.round((startOfDay(target) - startOfDay(new Date())) / DAY_MS);
}

export function formatDueDate(dueDate, returnDate) {
  if (!dueDate) return '—';
  if (returnDate) return formatDate(dueDate);

  const days = daysUntil(dueDate);
  if (days === null) return formatDate(dueDate);
  if (days < 0) return `${formatDate(dueDate)} · ${Math.abs(days)}d overdue`;
  if (days === 0) return `${formatDate(dueDate)} · due today`;
  return `${formatDate(dueDate)} · in ${days}d`;
}

export const fullName = (user) => {
  if (!user) return '';
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
  return name || user.username || '';
};

export const initials = (value) =>
  (value || '?')
    .split(/[\s_.-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

export const pluralize = (count, singular, plural = `${singular}s`) =>
  `${count} ${count === 1 ? singular : plural}`;
