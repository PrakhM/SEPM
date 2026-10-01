import ThemeToggle from './components/ThemeToggle.jsx';

/**
 * Temporary design-system harness: renders the token set so the palette,
 * dark mode and typography can be eyeballed. Not a feature page - replace
 * once real pages land.
 *
 * Note: every class here is written out in full. Tailwind only generates CSS
 * for class names it can see as literal strings, so `bg-${tone}` would
 * silently produce no styles.
 */

const swatches = [
  {
    name: 'Primary',
    steps: [
      ['bg-primary-50', '50'],
      ['bg-primary-100', '100'],
      ['bg-primary-300', '300'],
      ['bg-primary-500', '500'],
      ['bg-primary-600', '600'],
      ['bg-primary-700', '700'],
      ['bg-primary-800', '800'],
      ['bg-primary-900', '900'],
    ],
  },
  {
    name: 'Neutral',
    steps: [
      ['bg-neutral-50', '50'],
      ['bg-neutral-100', '100'],
      ['bg-neutral-200', '200'],
      ['bg-neutral-300', '300'],
      ['bg-neutral-400', '400'],
      ['bg-neutral-500', '500'],
      ['bg-neutral-600', '600'],
      ['bg-neutral-700', '700'],
      ['bg-neutral-800', '800'],
      ['bg-neutral-900', '900'],
    ],
  },
  {
    name: 'Success',
    steps: [
      ['bg-success-100', '100'],
      ['bg-success-300', '300'],
      ['bg-success-500', '500'],
      ['bg-success-600', '600'],
      ['bg-success-700', '700'],
      ['bg-success-900', '900'],
    ],
  },
  {
    name: 'Danger',
    steps: [
      ['bg-danger-100', '100'],
      ['bg-danger-300', '300'],
      ['bg-danger-500', '500'],
      ['bg-danger-600', '600'],
      ['bg-danger-700', '700'],
      ['bg-danger-900', '900'],
    ],
  },
  {
    name: 'Warning',
    steps: [
      ['bg-warning-100', '100'],
      ['bg-warning-300', '300'],
      ['bg-warning-400', '400'],
      ['bg-warning-500', '500'],
      ['bg-warning-700', '700'],
      ['bg-warning-900', '900'],
    ],
  },
  {
    name: 'Info',
    steps: [
      ['bg-info-100', '100'],
      ['bg-info-200', '200'],
      ['bg-info-300', '300'],
      ['bg-info-400', '400'],
      ['bg-info-500', '500'],
      ['bg-info-700', '700'],
      ['bg-info-900', '900'],
    ],
  },
];

const statuses = [
  ['bg-success-subtle text-success', 'Under budget'],
  ['bg-warning-subtle text-warning', 'At 92%'],
  ['bg-danger-subtle text-danger', 'Over by ₹2,400'],
  ['bg-info-subtle text-info', 'AI suggested'],
];

const surfaces = [
  ['bg-bg', 'bg'],
  ['bg-bg-subtle', 'bg-subtle'],
  ['bg-surface', 'surface'],
  ['bg-bg-inverse text-text-inverse', 'inverse'],
];

const rows = [
  ['Zoya Textiles', 'Groceries', '−₹1,249.00', 'text-danger'],
  ['Salary — Acme Corp', 'Income', '+₹85,000.00', 'text-success'],
  ['Swiggy', 'Dining out', '−₹640.50', 'text-text'],
];

const typeScale = [
  'text-xs',
  'text-sm',
  'text-base',
  'text-lg',
  'text-xl',
  'text-2xl',
  'text-3xl',
];

export default function App() {
  return (
    <main className="min-h-screen bg-bg px-6 py-10 text-text">
      <div className="mx-auto max-w-5xl space-y-10">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">FinTrack</h1>
            <p className="mt-1 text-sm text-text-secondary">
              Design system preview — scaffolding only
            </p>
          </div>
          <ThemeToggle />
        </header>

        <section>
          <h2 className="mb-4 text-lg font-semibold">Semantic surfaces</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {surfaces.map(([cls, label]) => (
              <div
                key={label}
                className={`flex h-20 items-end rounded-card border border-border p-3 ${cls}`}
              >
                <span className="font-mono text-xs">{label}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold">Palette</h2>
          <div className="space-y-4">
            {swatches.map(({ name, steps }) => (
              <div key={name}>
                <p className="mb-2 text-sm font-medium text-text-secondary">
                  {name}
                </p>
                <div className="flex overflow-hidden rounded-card border border-border">
                  {steps.map(([cls, step]) => (
                    <div key={step} className={`h-12 flex-1 ${cls}`}>
                      <span className="sr-only">{`${name} ${step}`}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold">Status + actions</h2>
          <div className="flex flex-wrap gap-3">
            {statuses.map(([cls, label]) => (
              <span
                key={label}
                className={`rounded-pill px-3 py-1 text-sm font-medium ${cls}`}
              >
                {label}
              </span>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="rounded-control bg-primary px-4 py-2 text-sm font-semibold text-primary-contrast transition-colors hover:bg-primary-light active:bg-primary-dark"
            >
              Primary action
            </button>
            <button
              type="button"
              className="rounded-control border border-border-strong bg-surface px-4 py-2 text-sm font-semibold text-text transition-colors hover:bg-bg-subtle"
            >
              Secondary
            </button>
            <input
              type="text"
              placeholder="Amount"
              className="w-40 rounded-control border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-tertiary"
            />
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold">Sample card</h2>
          <div
            data-probe="card"
            className="max-w-sm rounded-card border border-border bg-surface p-5 shadow-card"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-text">Monthly budget</p>
                <p className="text-xs text-text-tertiary">Groceries</p>
              </div>
              <span className="rounded-pill bg-primary-subtle px-2 py-1 text-xs font-semibold text-primary">
                Active
              </span>
            </div>
            <p className="numbers mt-4 font-mono text-3xl font-semibold text-text">
              ₹12,480.00
            </p>
            <p className="mt-1 text-xs text-text-secondary">
              of ₹15,000.00 spent
            </p>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-pill bg-bg-subtle">
              <div className="h-full w-[83%] rounded-pill bg-primary" />
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold">
            Currency alignment{' '}
            <span className="text-text-tertiary">(tabular-nums)</span>
          </h2>
          <div className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
            {rows.map(([desc, category, amount, tone]) => (
              <div
                key={desc}
                className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 last:border-b-0"
              >
                <div>
                  <p className="text-sm font-medium">{desc}</p>
                  <p className="text-xs text-text-tertiary">{category}</p>
                </div>
                <span
                  data-probe="amount"
                  className={`numbers font-mono text-sm font-semibold ${tone}`}
                >
                  {amount}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold">Type scale</h2>
          <div className="space-y-2">
            {typeScale.map((cls) => (
              <p key={cls} className={cls}>
                <span className="mr-3 font-mono text-xs text-text-tertiary">
                  {cls}
                </span>
                The quick brown fox jumps over the lazy dog
              </p>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
