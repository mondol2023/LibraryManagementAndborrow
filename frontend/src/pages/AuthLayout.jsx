import { Outlet } from 'react-router-dom';

/** Shared chrome for the signed-out screens. */
export function AuthLayout() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-brand-700 p-10 text-white lg:flex">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 text-xl">📖</span>
          <span className="text-lg font-semibold">Library</span>
        </div>

        <div className="max-w-md">
          <h1 className="text-3xl font-semibold leading-tight">
            Borrow, verify and return — in one place.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-brand-100">
            Browse the catalog, request a loan, and track due dates. Admins approve requests,
            manage the collection and process returns.
          </p>
        </div>

        <p className="text-xs text-brand-200">Library Management &amp; Borrowing System</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
