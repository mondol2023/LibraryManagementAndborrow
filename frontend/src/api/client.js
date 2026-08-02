import { createHttpClient } from '../lib/httpClient';
import { createEmitter } from '../lib/emitter';
import { tokenStorage } from '../lib/tokenStorage';
import { endpoints } from './endpoints';

/**
 * Composition root for the network layer: this is where the abstractions in
 * `lib/` get their concrete collaborators. Feature modules import `http`, never
 * `createHttpClient`.
 */
export const sessionExpired = createEmitter();

export const http = createHttpClient({
  baseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  tokenStorage,
  refreshPath: endpoints.auth.refresh,
  onSessionExpired: () => sessionExpired.emit(),
});
