import { useCallback, useMemo, useState } from 'react';

/**
 * Controlled-form plumbing shared by every form in the app: values, local
 * validation, and DRF's per-field errors merged into the same `errors` object
 * so inputs never care where a message came from.
 *
 * `validate` is injected, so each form supplies its own rules without this
 * hook growing a branch per form.
 */
export function useForm({ initialValues, validate = () => ({}), onSubmit }) {
  const [values, setValues] = useState(initialValues);
  const [touched, setTouched] = useState({});
  const [localErrors, setLocalErrors] = useState({});
  const [serverErrors, setServerErrors] = useState({});

  const setValue = useCallback((name, value) => {
    setValues((current) => ({ ...current, [name]: value }));
    // A field stops showing a server error the moment it is edited.
    setServerErrors((current) => {
      if (!(name in current)) return current;
      const { [name]: _removed, ...rest } = current;
      return rest;
    });
  }, []);

  const handleChange = useCallback(
    (event) => {
      const { name, type, value, checked } = event.target;
      setValue(name, type === 'checkbox' ? checked : value);
    },
    [setValue],
  );

  const handleBlur = useCallback((event) => {
    const { name } = event.target;
    setTouched((current) => ({ ...current, [name]: true }));
  }, []);

  const errors = useMemo(
    () => ({ ...localErrors, ...serverErrors }),
    [localErrors, serverErrors],
  );

  const visibleErrors = useMemo(() => {
    const result = {};
    for (const [field, message] of Object.entries(errors)) {
      if (touched[field] || field in serverErrors) result[field] = message;
    }
    return result;
  }, [errors, touched, serverErrors]);

  const handleSubmit = useCallback(
    async (event) => {
      event?.preventDefault?.();

      const validationErrors = validate(values);
      setLocalErrors(validationErrors);
      setTouched(Object.fromEntries(Object.keys(values).map((key) => [key, true])));

      if (Object.keys(validationErrors).length > 0) return { ok: false };

      const result = await onSubmit(values);
      if (result?.error?.fieldErrors) setServerErrors(result.error.fieldErrors);
      return result ?? { ok: true };
    },
    [validate, values, onSubmit],
  );

  const reset = useCallback(
    (nextValues = initialValues) => {
      setValues(nextValues);
      setTouched({});
      setLocalErrors({});
      setServerErrors({});
    },
    [initialValues],
  );

  return {
    values,
    errors: visibleErrors,
    setValue,
    setValues,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
  };
}

/** Composable rules — forms declare validation instead of writing `if`s. */
export const rules = {
  required: (label) => (value) =>
    value === undefined || value === null || String(value).trim() === ''
      ? `${label} is required.`
      : null,

  minLength: (label, min) => (value) =>
    value && String(value).length < min ? `${label} must be at least ${min} characters.` : null,

  email: () => (value) =>
    value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? 'Enter a valid email address.' : null,

  min: (label, minimum) => (value) =>
    value !== '' && Number(value) < minimum ? `${label} cannot be below ${minimum}.` : null,

  matches: (otherField, message) => (value, allValues) =>
    value !== allValues[otherField] ? message : null,
};

/** Runs a `{ field: [rule, ...] }` schema and returns the first error per field. */
export const createValidator = (schema) => (values) => {
  const errors = {};
  for (const [field, fieldRules] of Object.entries(schema)) {
    for (const rule of fieldRules) {
      const message = rule(values[field], values);
      if (message) {
        errors[field] = message;
        break;
      }
    }
  }
  return errors;
};
