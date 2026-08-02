/**
 * One semantic palette shared by Badge, Alert and Toast. Domain modules label
 * things `tone: 'warning'` and never learn a single Tailwind class name; adding
 * a tone here lights it up in all three components at once.
 */
export const TONES = Object.freeze({
  neutral: {
    badge: 'bg-slate-100 text-slate-700 ring-slate-200',
    surface: 'bg-slate-50 text-slate-700 ring-slate-200',
    icon: 'text-slate-500',
    bar: 'bg-slate-400',
  },
  brand: {
    badge: 'bg-brand-50 text-brand-700 ring-brand-200',
    surface: 'bg-brand-50 text-brand-800 ring-brand-200',
    icon: 'text-brand-600',
    bar: 'bg-brand-500',
  },
  info: {
    badge: 'bg-sky-50 text-sky-700 ring-sky-200',
    surface: 'bg-sky-50 text-sky-800 ring-sky-200',
    icon: 'text-sky-600',
    bar: 'bg-sky-500',
  },
  success: {
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    surface: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
    icon: 'text-emerald-600',
    bar: 'bg-emerald-500',
  },
  warning: {
    badge: 'bg-amber-50 text-amber-800 ring-amber-200',
    surface: 'bg-amber-50 text-amber-900 ring-amber-200',
    icon: 'text-amber-600',
    bar: 'bg-amber-500',
  },
  danger: {
    badge: 'bg-rose-50 text-rose-700 ring-rose-200',
    surface: 'bg-rose-50 text-rose-800 ring-rose-200',
    icon: 'text-rose-600',
    bar: 'bg-rose-500',
  },
});

export const toneStyles = (tone) => TONES[tone] ?? TONES.neutral;
