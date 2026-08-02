/**
 * Minimal JWT reader. Claims are read for *display and routing only* — the
 * server re-verifies every token, so a tampered payload buys nothing here.
 */
export function decodeToken(token) {
  if (typeof token !== 'string') return null;

  const payload = token.split('.')[1];
  if (!payload) return null;

  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(''),
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/** `true` when the token is missing, unreadable, or past its `exp`. */
export function isTokenExpired(token, skewSeconds = 10) {
  const claims = decodeToken(token);
  if (!claims?.exp) return true;
  return claims.exp * 1000 <= Date.now() + skewSeconds * 1000;
}
