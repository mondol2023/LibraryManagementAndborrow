/**
 * Every backend path the app knows, in one file. A route change on the Django
 * side is a single edit here — nothing else hard-codes a URL.
 */
export const endpoints = Object.freeze({
  auth: {
    register: '/register/',
    login: '/login/',
    refresh: '/refresh/',
  },
  books: {
    list: '/books/',
    detail: (id) => `/books/${id}/`,
  },
  authors: {
    list: '/authors/',
    detail: (id) => `/authors/${id}/`,
  },
  categories: {
    list: '/categories/',
    detail: (id) => `/categories/${id}/`,
  },
  borrow: {
    list: '/borrow/',
    create: '/borrow/',
    verify: (id) => `/borrow-verify/${id}/`,
    return: '/return/',
  },
  search: {
    index: '/search/',
    resource: (resource) => `/search/${resource}/`,
  },
  users: {
    list: '/users/',
    detail: (id) => `/users/${id}/`,
    me: '/users/me/',
    approve: (id) => `/users/${id}/approve/`,
    penalties: (id) => `/users/${id}/penalties/`,
  },
  dashboard: {
    all: '/dashboard/',
    panels: '/dashboard/panels/',
    panel: (name) => `/dashboard/${name}/`,
  },
});
