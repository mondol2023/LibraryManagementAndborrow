import { useMutation } from './useMutation';
import { useToast } from './useToast';
import { borrowApi } from '../api/borrowApi';
import { borrowStatusMeta } from '../domain/borrowStatus';

/**
 * The three borrow state changes, each wired to the same
 * mutate -> toast -> refresh sequence. Pages call these instead of repeating
 * the plumbing, so the feedback for a rejected request is identical everywhere.
 */
export function useBorrowActions(onChanged) {
  const toast = useToast();

  const notifyFailure = (error) => toast.error(error.message);
  const succeed = (message) => {
    toast.success(message);
    onChanged?.();
  };

  const request = useMutation(borrowApi.create, {
    onSuccess: () => succeed('Borrow request submitted.'),
    onError: notifyFailure,
  });

  const verify = useMutation(
    ({ id, decision }) => borrowApi.verify(id, decision),
    {
      onSuccess: (_data, { decision }) =>
        succeed(`Request ${borrowStatusMeta(decision).label.toLowerCase()}.`),
      onError: notifyFailure,
    },
  );

  const returnBook = useMutation(borrowApi.returnBook, {
    onSuccess: () => succeed('Book returned. Thanks!'),
    onError: notifyFailure,
  });

  return { request, verify, returnBook };
}
