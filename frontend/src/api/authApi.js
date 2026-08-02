import { http } from './client';
import { endpoints } from './endpoints';

export const authApi = {
  /** `TokenObtainPairView` -> `{ access, refresh }`. */
  login: (credentials) => http.post(endpoints.auth.login, credentials, { auth: false }),

  /** `RegisterView` -> `{ message, username, email, role }`. */
  register: (payload) => http.post(endpoints.auth.register, payload, { auth: false }),

  refresh: (refresh) => http.post(endpoints.auth.refresh, { refresh }, { auth: false }),
};
