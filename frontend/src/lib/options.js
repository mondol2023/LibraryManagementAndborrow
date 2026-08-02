/**
 * Turns any `{ id, name }`-ish list into the `{ value, label }` shape every
 * Select in the app consumes, so no caller maps by hand.
 */
export const toOptions = (items, labelKey = 'name', valueKey = 'id') =>
  (items ?? []).map((item) => ({
    value: String(item[valueKey]),
    label: item[labelKey] ?? `#${item[valueKey]}`,
  }));

/** `id -> item` index, for turning a foreign key into a display name. */
export const indexById = (items, key = 'id') =>
  new Map((items ?? []).map((item) => [String(item[key]), item]));
