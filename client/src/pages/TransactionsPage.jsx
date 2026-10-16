import { Plus } from 'lucide-react';
import { useEffect } from 'react';

import PagePlaceholder from '../components/PagePlaceholder.jsx';
import { usePageHeader } from '../components/layout/pageHeaderContext.js';

export default function TransactionsPage() {
  const { setAction } = usePageHeader();

  // Page title comes from the nav config; only the action is page-owned.
  useEffect(() => {
    setAction({
      label: 'Add Transaction',
      icon: Plus,
      onClick: () => {
        // Opens the transaction form once Increment 2 lands. Navigation-only
        // for now, so the button must not throw when clicked.
      },
    });
    return () => setAction(null);
  }, [setAction]);

  return (
    <PagePlaceholder
      title="Transactions"
      increment={2}
      description="Create, filter and categorise income, expense and transfer entries. Idempotent writes via the Idempotency-Key header arrive with Increment 2."
    />
  );
}
