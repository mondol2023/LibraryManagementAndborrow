import { ApiError, parseErrorBody } from './apiError';
import { isTokenExpired } from './jwt';

/**
 * The single place that talks to the network.
 *
 * Everything cross-cutting lives here exactly once — base URL, query strings,
 * JSON encoding, bearer auth, silent token refresh, error normalisation — so
 * no feature module ever calls `fetch` directly.
 *
 * Collaborators (token store, refresh endpoint, session-expiry sink) are
 * injected, so this module has no idea localStorage or React exist.
 */
export function createHttpClient({
  baseUrl,
  tokenStorage,
  refreshPath = '/refresh/',
  onSessionExpired = () => {},
  fetchImpl = globalThis.fetch.bind(globalThis),
}) {
  // Concurrent 401s must not each fire their own refresh; they all await this.
  let refreshInFlight = null;

  const buildUrl = (path, params) => {
    const url = `${baseUrl}${path}`;
    if (!params) return url;

    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === '') continue;
      query.append(key, value);
    }
    const qs = query.toString();
    return qs ? `${url}?${qs}` : url;
  };

  const readBody = async (response) => {
    if (response.status === 204) return null;
    const text = await response.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  };

  const refreshAccessToken = async () => {
    const refresh = tokenStorage.getRefresh();
    if (!refresh || isTokenExpired(refresh)) return null;

    // A rejected refresh must not recurse back into this same handler.
    const response = await fetchImpl(buildUrl(refreshPath), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });

    if (!response.ok) return null;

    const body = await readBody(response);
    if (!body?.access) return null;

    tokenStorage.set({ access: body.access, refresh: body.refresh });
    return body.access;
  };

  const ensureFreshAccessToken = () => {
    // Share one refresh across every caller that arrives while it is running.
    if (!refreshInFlight) {
      refreshInFlight = refreshAccessToken().finally(() => {
        refreshInFlight = null;
      });
    }
    return refreshInFlight;
  };

  const send = async (path, { method, body, params, auth, signal, token }) => {
    const headers = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (auth && token) headers.Authorization = `Bearer ${token}`;

    let response;
    try {
      response = await fetchImpl(buildUrl(path, params), {
        method,
        headers,
        signal,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch (cause) {
      if (cause?.name === 'AbortError') throw cause;
      throw new ApiError('Cannot reach the server. Is the API running?', { status: 0 });
    }
    return response;
  };

  async function request(path, options = {}) {
    const { method = 'GET', body, params, auth = true, signal } = options;

    let token = auth ? tokenStorage.getAccess() : null;

    // Refresh proactively when the access token has already expired — saves a
    // guaranteed-401 round trip on every call after the app sits idle.
    if (auth && token && isTokenExpired(token)) {
      token = await ensureFreshAccessToken();
    }

    let response = await send(path, { method, body, params, auth, signal, token });

    if (response.status === 401 && auth) {
      const refreshed = await ensureFreshAccessToken();
      if (refreshed) {
        response = await send(path, { method, body, params, auth, signal, token: refreshed });
      } else {
        tokenStorage.clear();
        onSessionExpired();
      }
    }

    const payload = await readBody(response);

    if (!response.ok) {
      const { message, fieldErrors } = parseErrorBody(payload, response.status);
      throw new ApiError(message, { status: response.status, fieldErrors, payload });
    }

    return payload;
  }

  // Verb helpers keep call sites declarative: `http.post('/borrow/', {...})`.
  return {
    request,
    get: (path, options) => request(path, { ...options, method: 'GET' }),
    post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
    put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
    patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
    delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
  };
}
