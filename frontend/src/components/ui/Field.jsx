import { useId } from 'react';
import { cn } from '../../lib/cn';

/**
 * Label + control + error/hint layout, written once. Controls below stay pure
 * inputs; anything that needs the surrounding chrome composes it with `Field`.
 */
export function Field({ label, error, hint, required, children, className }) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-700">
          {label}
          {required && <span className="ml-0.5 text-rose-500">*</span>}
        </label>
      )}

      {children({ id, invalid: Boolean(error), describedBy })}

      {error ? (
        <p id={`${id}-error`} className="text-xs text-rose-600">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-xs text-slate-500">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

const controlClasses = (invalid, className) =>
  cn(
    'block w-full rounded-lg bg-white px-3 py-2 text-sm text-slate-900 shadow-sm ring-1 ring-inset transition-shadow',
    'placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500',
    invalid ? 'ring-rose-400 focus:ring-rose-500' : 'ring-slate-300 focus:ring-brand-500',
    'focus:ring-2',
    className,
  );

export function Input({ invalid, className, ...props }) {
  return <input className={controlClasses(invalid, className)} {...props} />;
}

export function Textarea({ invalid, className, rows = 4, ...props }) {
  return <textarea rows={rows} className={controlClasses(invalid, className)} {...props} />;
}

/**
 * `options` is always `{ value, label }[]` so every caller — roles, statuses,
 * authors, categories — feeds the same shape from its own domain table.
 */
export function Select({ invalid, className, options = [], placeholder, ...props }) {
  return (
    <select className={cn(controlClasses(invalid, className), 'pr-8')} {...props}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value} disabled={option.disabled}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

/**
 * The common case: a labelled control bound to `useForm`. Pass `as={Select}` or
 * `as={Textarea}` to swap the control without repeating the wiring.
 */
export function FormField({ as: Control = Input, name, label, hint, required, form, ...props }) {
  return (
    <Field label={label} hint={hint} required={required} error={form.errors[name]}>
      {({ id, invalid, describedBy }) => (
        <Control
          id={id}
          name={name}
          value={form.values[name] ?? ''}
          onChange={form.handleChange}
          onBlur={form.handleBlur}
          invalid={invalid}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          {...props}
        />
      )}
    </Field>
  );
}
