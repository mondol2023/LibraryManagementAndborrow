import { http } from './client';

/**
 * Builds the CRUD surface shared by every collection endpoint.
 *
 * Books, authors and categories all speak the same REST dialect, so their API
 * modules declare *what* they are and inherit *how* to talk. A resource that
 * only supports part of the surface simply passes fewer `operations`; callers
 * of a resource can then rely on whatever methods it does expose behaving
 * identically across resources.
 */
export function createResourceApi({
  listPath,
  detailPath,
  operations = ['list', 'retrieve', 'create', 'update', 'remove'],
  transformList = (data) => data,
  transformItem = (data) => data,
}) {
  const available = new Set(operations);

  const api = {};

  if (available.has('list')) {
    api.list = (params, options) =>
      http.get(listPath, { ...options, params }).then(transformList);
  }

  if (available.has('retrieve')) {
    api.retrieve = (id, options) => http.get(detailPath(id), options).then(transformItem);
  }

  if (available.has('create')) {
    api.create = (payload, options) => http.post(listPath, payload, options).then(transformItem);
  }

  if (available.has('update')) {
    api.update = (id, payload, options) =>
      http.put(detailPath(id), payload, options).then(transformItem);
  }

  if (available.has('remove')) {
    api.remove = (id, options) => http.delete(detailPath(id), options);
  }

  return api;
}
