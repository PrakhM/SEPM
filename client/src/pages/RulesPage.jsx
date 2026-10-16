import PagePlaceholder from '../components/PagePlaceholder.jsx';

export default function RulesPage() {
  return (
    <PagePlaceholder
      title="Categorisation Rules"
      increment={7}
      description="User-defined rules evaluated in priority order, first match wins, applied before the AI fallback."
    />
  );
}
