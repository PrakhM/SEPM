import PagePlaceholder from '../components/PagePlaceholder.jsx';

export default function BudgetsPage() {
  return (
    <PagePlaceholder
      title="Budgets"
      increment={3}
      description="Monthly per-category budgets with utilization percentages and 80% / 100% threshold alerts. Concurrency-safe spent increments arrive with Increment 3."
    />
  );
}
