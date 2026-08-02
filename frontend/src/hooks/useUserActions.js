import { useMutation } from './useMutation';
import { useToast } from './useToast';
import { userApi } from '../api/userApi';

/**
 * Every account state change, each wired to the same
 * mutate -> toast -> refresh sequence — the counterpart of `useBorrowActions`.
 * Pages decide which of these to expose; none of them repeats the plumbing.
 */
export function useUserActions(onChanged) {
  const toast = useToast();

  const notifyFailure = (error) => toast.error(error.message);
  const succeed = (message) => (data) => {
    toast.success(typeof message === 'function' ? message(data) : message);
    onChanged?.(data);
  };

  const create = useMutation(userApi.create, {
    onSuccess: succeed((user) => `Account "${user.username}" created.`),
    onError: notifyFailure,
  });

  const update = useMutation(({ id, changes }) => userApi.update(id, changes), {
    onSuccess: succeed('Account updated.'),
    onError: notifyFailure,
  });

  const approve = useMutation(userApi.approve, {
    onSuccess: succeed((user) => `${user.username} approved.`),
    onError: notifyFailure,
  });

  const deactivate = useMutation(userApi.deactivate, {
    onSuccess: succeed('Account deactivated.'),
    onError: notifyFailure,
  });

  /** `changes` is `{ penalty_points }` or `{ delta }` — never both. */
  const adjustPenalties = useMutation(({ id, changes }) => userApi.adjustPenalties(id, changes), {
    onSuccess: succeed((result) => `Penalty points set to ${result.penalty_points}.`),
    onError: notifyFailure,
  });

  return { create, update, approve, deactivate, adjustPenalties };
}
