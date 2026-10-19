import EmptyState from '../common/EmptyState.jsx';
import Skeleton from '../common/Skeleton.jsx';
import TransactionItem from './TransactionItem.jsx';
import { Receipt } from 'lucide-react';

/**
 * The ledger body.
 *
 * Loading shows skeleton rows shaped like real rows, not a spinner over an
 * empty page: the page keeps its height and its layout while data arrives,
 * so nothing jumps when it lands.
 */

const SKELETON_COUNT = 5;

function RowSkeleton() {
  return (
    <li className="flex items-center gap-4 border-b border-border px-4 py-3 last:border-b-0">
      <Skeleton className="h-6 w-24 rounded-pill" />
      <Skeleton className="h-4 flex-1" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-4 w-24" />
    </li>
  );
}

export default function TransactionList({
  transactions,
  loading,
  hasFilters,
  onEdit,
  onDelete,
  onAdd,
}) {
  if (loading) {
    return (
      <div aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading transactions</span>
        <ul>
          {Array.from({ length: SKELETON_COUNT }, (_, index) => (
            <RowSkeleton key={index} />
          ))}
        </ul>
      </div>
    );
  }

  if (transactions.length === 0) {
    // Two different messages, because "you have nothing" and "your filters
    // matched nothing" call for different next actions.
    return (
      <EmptyState
        icon={Receipt}
        compact
        title={
          hasFilters
            ? 'No transactions match your filters'
            : 'No transactions yet'
        }
        description={
          hasFilters
            ? 'Try widening the date range or clearing a filter.'
            : 'Add your first transaction to start tracking where your money goes.'
        }
        actionLabel={hasFilters ? undefined : 'Add transaction'}
        onAction={hasFilters ? undefined : onAdd}
      />
    );
  }

  return (
    <ul>
      {transactions.map((transaction) => (
        <TransactionItem
          key={transaction.id}
          transaction={transaction}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}
