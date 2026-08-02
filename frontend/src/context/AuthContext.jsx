import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/authApi';
import { sessionExpired } from '../api/client';
import { tokenStorage } from '../lib/tokenStorage';
import { decodeToken, isTokenExpired } from '../lib/jwt';
import { can as canDo, isAdmin as roleIsAdmin } from '../domain/permissions';

export const AuthContext = createContext(null);

export const AuthStatus = Object.freeze({
  LOADING: 'loading',
  AUTHENTICATED: 'authenticated',
  ANONYMOUS: 'anonymous',
});

/**
 * The identity claims the backend puts in the access token. Reading them here
 * means the app knows who is signed in without an extra `/me` round trip.
 */
const userFromToken = (token) => {
  const claims = decodeToken(token);
  if (!claims?.user_id) return null;

  return {
    id: claims.user_id,
    username: claims.username ?? '',
    email: claims.email ?? '',
    role: claims.role ?? null,
    first_name: claims.first_name ?? '',
    last_name: claims.last_name ?? '',
  };
};

const readStoredUser = () => {
  const access = tokenStorage.getAccess();
  // An expired access token is still fine as long as the refresh token lives —
  // the HTTP client will silently swap it on the next call.
  if (access && !isTokenExpired(access)) return userFromToken(access);

  const refresh = tokenStorage.getRefresh();
  if (access && refresh && !isTokenExpired(refresh)) return userFromToken(access);

  tokenStorage.clear();
  return null;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(AuthStatus.LOADING);

  useEffect(() => {
    const restored = readStoredUser();
    setUser(restored);
    setStatus(restored ? AuthStatus.AUTHENTICATED : AuthStatus.ANONYMOUS);
  }, []);

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
    setStatus(AuthStatus.ANONYMOUS);
  }, []);

  // The HTTP client reports a dead session through an event rather than
  // importing this provider, so the dependency runs UI -> network, never back.
  useEffect(() => sessionExpired.subscribe(logout), [logout]);

  const login = useCallback(async (credentials) => {
    const tokens = await authApi.login(credentials);
    tokenStorage.set(tokens);

    const nextUser = userFromToken(tokens.access);
    setUser(nextUser);
    setStatus(AuthStatus.AUTHENTICATED);
    return nextUser;
  }, []);

  const register = useCallback((payload) => authApi.register(payload), []);

  const value = useMemo(
    () => ({
      user,
      status,
      isAuthenticated: status === AuthStatus.AUTHENTICATED,
      isLoading: status === AuthStatus.LOADING,
      isAdmin: roleIsAdmin(user),
      can: (permission) => canDo(user, permission),
      login,
      logout,
      register,
    }),
    [user, status, login, logout, register],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
