import { Button } from '../ui';
import { VERIFY_DECISIONS, isReturnable, isVerifiable } from '../../domain/borrowStatus';
import { useAuth } from '../../hooks/useAuth';
import { Permission } from '../../domain/permissions';

/**
 * Which buttons a row shows is answered by the domain (`isVerifiable`,
 * `isReturnable`) plus the permission table — never by a status string compared
 * inside a page.
 */
export function BorrowRowActions({ borrow, actions, ownerId }) {
  const { can, user } = useAuth();

  const canVerify = can(Permission.VERIFY_BORROWS) && isVerifiable(borrow);
  const canReturn =
    isReturnable(borrow) &&
    (can(Permission.RETURN_ANY_BORROW) || borrow.user_id === (ownerId ?? user?.id));

  if (!canVerify && !canReturn) return <span className="text-xs text-slate-400">—</span>;

  return (
    <div className="flex justify-end gap-2">
      {canVerify &&
        VERIFY_DECISIONS.map((decision) => (
          <Button
            key={decision.value}
            size="sm"
            variant={decision.intent}
            isLoading={actions.verify.isPending}
            onClick={() => actions.verify.mutate({ id: borrow.id, decision: decision.value })}
          >
            {decision.label}
          </Button>
        ))}

      {canReturn && (
        <Button
          size="sm"
          variant="secondary"
          isLoading={actions.returnBook.isPending}
          onClick={() => actions.returnBook.mutate(borrow.id)}
        >
          Return
        </Button>
      )}
    </div>
  );
}
