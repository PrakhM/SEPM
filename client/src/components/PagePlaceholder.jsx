/**
 * Shared placeholder for pages that are routed but not built yet.
 *
 * Each feature page renders this with its own copy so the shell, active nav
 * state and top bar title are all exercised before the feature lands. Replace
 * the whole page with real content as its increment is implemented.
 */
export default function PagePlaceholder({ title, increment, description }) {
  return (
    <section className="rounded-card border border-border bg-surface p-8 shadow-card sm:p-10">
      <span className="inline-flex rounded-pill bg-primary-subtle px-3 py-1 text-xs font-semibold text-primary-on-subtle">
        Increment {increment}
      </span>
      <h2 className="mt-4 text-xl font-semibold tracking-tight text-text">
        {title}
      </h2>
      <p className="mt-2 max-w-prose text-sm leading-relaxed text-text-secondary">
        {description}
      </p>
    </section>
  );
}
