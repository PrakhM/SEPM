import { TrendingUp } from 'lucide-react';

/**
 * Shared stage for the two unauthenticated pages: a full-height, centered
 * column holding the wordmark and one card, over a tinted gradient wash.
 *
 * The wash is two absolute overlays rather than a flat background because
 * the login screen is the first thing a user ever sees - a soft teal bloom
 * in light mode, a slate-to-near-black fall in dark mode, gives the page a
 * designed feel without competing with the card. The card itself always sits
 * on the plain `surface` token (white in light, slate-800 in dark) so the
 * form stays maximally legible against its backdrop.
 *
 * `heading`/`subheading` are props rather than children so the two pages
 * cannot drift in where the title sits relative to the fields; `children` is
 * the page's <form> plus its footer link line.
 */
export default function AuthLayout({ heading, subheading, children }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-bg px-4 py-12">
      {/* Decorative atmosphere only, hence hidden from assistive tech and
          from the pointer. The first overlay tracks the light palette and
          the second the dark one; `bg-bg` on the parent means there is never
          a flat flash before either applies. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary-100/60 via-bg to-bg dark:hidden"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden bg-[linear-gradient(180deg,#0f172a_0%,#020617_100%)] dark:block"
      />

      <div className="relative w-full max-w-[400px]">
        {/* Wordmark, above the card per the auth layout spec. */}
        <div className="flex flex-col items-center gap-2.5 text-center">
          <span className="flex size-11 items-center justify-center rounded-control bg-primary text-primary-contrast shadow-card">
            <TrendingUp className="size-6" aria-hidden="true" />
          </span>
          <p className="text-xl font-bold tracking-tight text-text">
            Fin<span className="text-primary">Track</span>
          </p>
        </div>

        <div className="mt-6 rounded-card border border-border bg-surface p-8 shadow-card sm:p-10">
          <h1 className="text-2xl font-bold tracking-tight text-text">
            {heading}
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
            {subheading}
          </p>

          {children}
        </div>
      </div>
    </div>
  );
}
