# Library Management & Borrowing System

A role-based library system: a Django REST API for the catalogue, borrowing, accounts,
Elasticsearch search and an analytics dashboard, plus a React single-page app that consumes it.

| | |
| --- | --- |
| API | Django 5.2 · Django REST Framework 3.16 · SimpleJWT |
| Database | PostgreSQL |
| Search | Elasticsearch 8 via `django-elasticsearch-dsl` |
| Background work | Celery (due-date reminder task) |
| Frontend | React 18 · Vite 6 · Tailwind CSS v4 · React Router 6 |

---

## Contents

- [What it does](#what-it-does)
- [Repository layout](#repository-layout)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [Roles and permissions](#roles-and-permissions)
- [API reference](#api-reference)
- [Dashboard](#dashboard)
- [Search](#search)
- [Domain rules](#domain-rules)
- [Design notes](#design-notes)
- [Tests](#tests)
- [Known gaps](#known-gaps)

---

## What it does

- **Catalogue** — books, authors and categories, with copy counts and soft deletes.
- **Borrowing** — request, approve, reject and return, with stock held under a row lock so two
  concurrent requests can never take the same copy.
- **Penalties** — one point per day late, applied automatically on return; an admin can waive or
  clear them.
- **Accounts** — registration, JWT login with silent refresh, and full admin user management
  including role changes, approval of pending staff signups and deactivation.
- **Search** — Elasticsearch-backed, with the searchable resources decided by the caller's role.
- **Dashboard** — thirteen panels of aggregated data, filtered to what each role may see.

---

## Repository layout

```
backend/src/
  LibraryManagementAndBorrowingSystem/  settings, root urls, wsgi/asgi
  Api/          the URL surface — every route is mounted here under /api/
  Book/         catalogue models, borrow views, celery task, signals
  users/        custom user model, roles, permissions, JWT identity claims
  search/       Elasticsearch documents, resources, access policy
  dashboard/    panel registry, panels, access policy
  core/         shared building blocks used by more than one app
frontend/
  src/api/      one module per resource; every URL declared in endpoints.js
  src/lib/      framework-free helpers — httpClient, tokenStorage, jwt, format
  src/domain/   business rules with no React in them
  src/hooks/    useQuery, useMutation, useForm, useCatalog, useBorrowList, …
  src/pages/    one screen per file
```

The backend dependency direction is one-way: `Api → app views → services/policies → models`, with
`core` importing nothing from the apps. The frontend mirrors it: `pages → components → hooks → api → lib`.

---

## Getting started

### 1. API

```bash
cd backend/src
python -m venv .venv && .venv\Scripts\activate     # PowerShell; use source .venv/bin/activate on POSIX
pip install -r requirements.txt

python manage.py migrate
python manage.py createsuperuser
python manage.py runserver                          # http://127.0.0.1:8000
```

PostgreSQL must be reachable with the credentials below. A superuser created this way has
`role = NULL`; give it `role = "admin"` in the Django admin (`/admin/`) so it passes the API's
role checks.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev                                         # http://localhost:5173
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload and the `/api` proxy |
| `npm run build` | Production bundle into `dist/` |
| `npm run preview` | Serve the built bundle locally |

The backend ships **no CORS middleware**, so in development Vite proxies `/api` straight to Django
(`vite.config.js`) and the browser only ever makes same-origin requests. For a deployed build, serve
both from one origin, or point `VITE_API_BASE_URL` at the API origin and add CORS headers there.

### 3. Elasticsearch (optional)

Search is the only feature that needs it; everything else runs without it.

```bash
docker run -d --name library-es -p 9200:9200 \
  -e discovery.type=single-node -e xpack.security.enabled=false \
  docker.elastic.co/elasticsearch/elasticsearch:8.13.0

cd backend/src
python manage.py search_index --rebuild             # build the indices from the database
```

Indices stay in sync through model signals afterwards.

---

## Configuration

Everything is read from the environment with a working development default.

| Variable | Default | Purpose |
| --- | --- | --- |
| `DJANGO_SECRET_KEY` | insecure dev key | **Must be set in production** |
| `DJANGO_DEBUG` | `True` | Set to `False` in production |
| `DJANGO_ALLOWED_HOSTS` | `localhost,127.0.0.1` in debug | Comma-separated |
| `DB_NAME` / `DB_USER` / `DB_PASSWORD` / `DB_HOST` / `DB_PORT` | `library_management_system` / `postgres` / — / `localhost` / `5432` | PostgreSQL |
| `ELASTICSEARCH_HOST` | `http://localhost:9200` | Search cluster |
| `ELASTICSEARCH_DSL_SIGNAL_PROCESSOR` | `RealTimeSignalProcessor` | Switch to the Celery processor once a broker exists |
| `EMAIL_BACKEND` | console backend | Due-date reminder delivery |
| `DEFAULT_FROM_EMAIL` | `no-reply@library.local` | Sender address |
| `VITE_API_BASE_URL` | `/api` | Where the browser sends API calls |
| `VITE_API_PROXY_TARGET` | `http://127.0.0.1:8000` | Dev-proxy target; dev only |

Access tokens last 1 day, refresh tokens 2 days (`SIMPLE_JWT` in `settings.py`).

---

## Roles and permissions

Five roles live on the custom user model: `admin`, `staff`, `student`, `teacher`, `other`.
The last three are *borrowers* and behave identically.

| Action | admin | staff | borrower |
| --- | :---: | :---: | :---: |
| Browse and search the catalogue | ✅ | ✅ | ✅ |
| Create / edit books, authors, categories | ✅ | ✅ | — |
| Delete (deactivate) a catalogue record | ✅ | — | — |
| Borrow for oneself | ✅ | ✅ | ✅ |
| Issue, approve, reject or return on someone's behalf | ✅ | ✅ | — |
| See every borrow record | ✅ | ✅ | own only |
| List and view accounts | ✅ | ✅ (admin rows hidden) | own only |
| Create accounts, change roles, approve, deactivate | ✅ | — | — |
| Adjust penalty points | ✅ | — | — |
| Search users | ✅ | ✅ | — |
| Dashboard | 13 panels | 12 (no `users`) | 3 |
| Django admin site (`/admin/`) | ✅ | — | — |

`role = "admin"` also sets Django's `is_staff` and `is_superuser` flags, which is what makes the
Django admin site reachable — it means the role carries unrestricted database access as well.
The two are kept in step by `sync_privilege_flags()` in `users/serializers.py`, in both directions.

Permission classes all derive from one `RoleBasePermission`; a subclass only names its set of roles
(`IsAdmin`, `IsStaff`, `IsLibrarian` = admin + staff, `IsUser` = borrowers, `IsAll`).

---

## API reference

All routes are mounted under `/api/`. Everything except register, login and refresh requires
`Authorization: Bearer <access token>`.

### Authentication

| Method | Path | Who | Notes |
| --- | --- | --- | --- |
| `POST` | `/api/register/` | public | `username, email, password, password2, role, …` |
| `POST` | `/api/login/` | public | Returns `access` + `refresh`; the token carries `username`, `email`, `role`, `first_name`, `last_name` |
| `POST` | `/api/refresh/` | public | Standard SimpleJWT refresh |

Registering as `admin` or `staff` creates the account **inactive**; an existing admin must approve it.
Every other role is active immediately.

### Accounts

| Method | Path | Who |
| --- | --- | --- |
| `GET` | `/api/users/` | admin, staff — supports `?q=&role=&is_active=&page=&page_size=` |
| `POST` | `/api/users/` | admin — creates an already-active account |
| `GET` `PATCH` | `/api/users/me/` | anyone signed in — self-edit is limited to name, email, phone |
| `GET` | `/api/users/<id>/` | admin, staff, or the account itself |
| `PATCH` | `/api/users/<id>/` | admin (any field), or the account itself (own harmless fields) |
| `DELETE` | `/api/users/<id>/` | admin — soft delete; you cannot deactivate yourself |
| `POST` | `/api/users/<id>/approve/` | admin — activates a pending admin/staff signup |
| `GET` | `/api/users/<id>/penalties/` | admin, staff, or the account itself |
| `POST` `PATCH` | `/api/users/<id>/penalties/` | admin — `{"penalty_points": 0}` to set, `{"delta": -2}` to waive |

List responses are wrapped: `{count, page, page_size, num_pages, results}`.

### Catalogue

| Method | Path | Who |
| --- | --- | --- |
| `GET` | `/api/books/` | anyone signed in — `?author=<id>&category=<id>` |
| `POST` | `/api/books/` | admin, staff |
| `GET` | `/api/books/<id>/` | anyone signed in |
| `PUT` `PATCH` | `/api/books/<id>/` | admin, staff |
| `DELETE` | `/api/books/<id>/` | admin |
| `GET` `POST` | `/api/authors/` | read: anyone · write: admin, staff |
| `GET` `PUT` `PATCH` `DELETE` | `/api/authors/<id>/` | read: anyone · write: admin, staff · delete: admin |
| `GET` `POST` | `/api/categories/` | read: anyone · write: admin, staff |
| `GET` `PUT` `PATCH` `DELETE` | `/api/categories/<id>/` | read: anyone · write: admin, staff · delete: admin |

Deletes are soft (`is_active = False`), so a removed record disappears from every screen without
breaking the borrow history that points at it.

### Borrowing

| Method | Path | Who | Body |
| --- | --- | --- | --- |
| `GET` | `/api/borrow/` | anyone signed in — borrowers see only their own | `?user=&status=&book=&from_date=&to_date=` |
| `POST` | `/api/borrow/` | anyone signed in | `{"book_id": 1}`, plus `"user_id"` when the desk issues on someone's behalf |
| `PUT` | `/api/borrow-verify/<id>/` | admin, staff | `{"status": "accepted" \| "rejected" \| "cancelled"}` |
| `POST` | `/api/return/` | anyone signed in — the desk may return for anyone | `{"borrow_id": 1}` |

`GET /api/borrow/` answers with a `{status, data}` envelope; the other list endpoints return
plain arrays.

### Search and dashboard

| Method | Path | Who |
| --- | --- | --- |
| `GET` | `/api/search/` | anyone signed in — lists the resources you may query |
| `GET` | `/api/search/<resource>/` | per role — `?q=&page=&page_size=` |
| `GET` | `/api/dashboard/` | anyone signed in — `?panels=a,b&limit=n` |
| `GET` | `/api/dashboard/panels/` | anyone signed in — panel index, no data |
| `GET` | `/api/dashboard/<panel>/` | per role — one panel on its own |

---

## Dashboard

`GET /api/dashboard/` returns `{role, panels: {<name>: {title, description, data}}}`, containing
only the panels the caller's role allows. A requested panel you may not see is dropped rather than
rejected, so one shared layout works for every role.

| Panel | What it shows | admin | staff | borrower |
| --- | --- | :---: | :---: | :---: |
| `overview` | Headline counts across the whole library | ✅ | ✅ | — |
| `books` | Stock levels and the titles that have run out | ✅ | ✅ | — |
| `borrow_status` | How many borrow records sit in each status | ✅ | ✅ | — |
| `borrow_trend` | Loans and returns per month, last twelve months | ✅ | ✅ | — |
| `overdue` | Books out past their due date | ✅ | ✅ | — |
| `top_books` | The titles that leave the shelf most often | ✅ | ✅ | ✅ |
| `top_borrowers` | Who borrows the most, and how much is still out | ✅ | ✅ | — |
| `categories` | How the catalogue and the borrowing split by category | ✅ | ✅ | ✅ |
| `authors` | Titles held and loans made per author | ✅ | ✅ | — |
| `users` | The membership by role and state, incl. awaiting approval | ✅ | — | — |
| `penalties` | Outstanding penalty points and who holds them | ✅ | ✅ | — |
| `recent_activity` | The latest borrow requests and returns | ✅ | ✅ | — |
| `my_summary` | The signed-in account: loans, history, penalties | ✅ | ✅ | ✅ |

Adding a figure means adding a panel class with a `@registry.register` decorator — no view, URL or
serializer changes. Who may see it is one entry in `dashboard/access.py`.

---

## Search

`GET /api/search/` advertises the resources the caller may query, so a client renders only the
buttons that will work.

| Resource | Index | Who may search it |
| --- | --- | --- |
| `books` | `library_books` | everyone signed in |
| `users` | `library_users` | admin, staff |

Books are matched on title, description and the author/category names; the index is re-written when
an author or category is renamed. A resource you may not search returns `403` without revealing
whether it exists.

---

## Domain rules

**Borrowing.** A request is created `pending` with a 14-day due date and holds a copy immediately —
so pending requests count towards the limit of **3 active loans** per borrower. When the desk issues
a book, the record is created `accepted` in one step. Rejecting or cancelling returns the copy to
the shelf. The book row is locked with `select_for_update()` for the whole transaction, so
concurrent requests cannot oversell the last copy. `total_copies` is the size of the inventory and
never changes on a borrow; only `available_copies` moves.

**Penalties.** On return, a book handed back after its due date adds one point per day late to the
borrower's `penalty_points`. Points stay on the account until an admin sets or waives them through
`/api/users/<id>/penalties/`. Nothing blocks borrowing on penalty points — that is a policy
decision left open deliberately.

**Reminders.** `Book.tasks.send_due_date_email` is a Celery task that emails a borrower on the due
date. It needs a broker and a beat schedule to fire; without them the code is inert.

---

## Design notes

The project follows SOLID and DRY deliberately, and the shared pieces live in `backend/src/core/`:

- **`core/registry.py`** — a name → component registry. Both `search` and `dashboard` use it, so
  adding a resource or a panel never means editing the view that serves it. *Open/closed.*
- **`core/access.py`** — `RoleAccessPolicy` answers one question: given this user, which of these
  named things may they touch? Each app subclasses it with a table. No view branches on a role.
- **`core/views.py`** — `MethodPermissionAPIView` maps HTTP methods to permission classes, which
  removed every inline `if not IsAdmin(): return 403` from the catalogue views.
- **`core/pagination.py`** — one `read_page_params` / `paginate` pair for every list endpoint.
- **`users/permissions.py`** — one role check, written once; each permission class is just its set
  of roles. **`is_admin()` / `is_librarian()`** are the only places the role strings are compared.
- **`SoftDeleteMixin`** — books, authors and categories deactivate through one implementation.

The frontend applies the same idea: one `endpoints.js`, one HTTP client, one error normaliser, one
permission table (`domain/permissions.js`), one `DataTable`, and every resource client generated by
`createResourceApi.js` so they are interchangeable. `createHttpClient` receives its token storage
and `fetch` rather than importing them, so the network layer never imports React. A `401` triggers
one shared refresh; concurrent requests wait on it, and a failed refresh clears the session.

---

## Tests

```bash
cd backend/src
python manage.py test                       # everything
python manage.py test users dashboard search
```

The current suites cover authorisation and wiring — role permissions, dashboard and search access
policies, the registries and query parsing — and are written to run without Elasticsearch.

---

## Known gaps

- `users/throttles.py` defines a `BorrowRateThrottle` (2/hour) that is **not applied** to any view;
  attaching it as written would also throttle desk staff issuing books.
- The Celery task has no broker or beat schedule configured.
- The frontend was built against the earlier API surface: it does not yet consume `/api/dashboard/`,
  `/api/users/` or `/api/users/me/`, and it reads identity from the JWT claims instead.
- No CORS middleware; the dev setup relies on the Vite proxy.
