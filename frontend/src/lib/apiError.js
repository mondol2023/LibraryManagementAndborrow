/**
 * One error type for every failed request, so callers never have to know
 * whether a failure came from the network, DRF field validation, or a plain
 * `{"detail": ...}` body.
 */
export class ApiError extends Error {
  constructor(message, { status = 0, fieldErrors = {}, payload = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.payload = payload;
  }

  get isUnauthorized() {
    return this.status === 401;
  }

  get isForbidden() {
    return this.status === 403;
  }

  get isNotFound() {
    return this.status === 404;
  }

  get isNetworkError() {
    return this.status === 0;
  }
}

const NON_FIELD_KEYS = ['detail', 'error', 'message', 'non_field_errors'];

const flatten = (value) => (Array.isArray(value) ? value.join(' ') : String(value));

/**
 * DRF answers with a lot of different shapes:
 *   {"detail": "..."} | {"error": "..."} | {"field": ["..."]} | ["..."] | "..."
 * Normalise all of them into a message plus a per-field map.
 */
export function parseErrorBody(body, status) {
  if (body == null) return { message: `Request failed (${status})`, fieldErrors: {} };

  if (typeof body === 'string') {
    return { message: body || `Request failed (${status})`, fieldErrors: {} };
  }

  if (Array.isArray(body)) {
    return { message: flatten(body), fieldErrors: {} };
  }

  const fieldErrors = {};
  let message = '';

  for (const [key, value] of Object.entries(body)) {
    const text = typeof value === 'object' && value !== null && !Array.isArray(value)
      ? flatten(Object.values(value).flat())
      : flatten(value);

    if (NON_FIELD_KEYS.includes(key)) {
      message = message || text;
    } else {
      fieldErrors[key] = text;
    }
  }

  if (!message) {
    const first = Object.entries(fieldErrors)[0];
    message = first ? `${first[0]}: ${first[1]}` : `Request failed (${status})`;
  }

  return { message, fieldErrors };
}
