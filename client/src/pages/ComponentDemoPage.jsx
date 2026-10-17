import {
  ArrowLeftRight,
  ChevronRight,
  Inbox,
  Pencil,
  Plus,
  Receipt,
  Target,
  Trash2,
  Wallet,
} from 'lucide-react';
import { useState } from 'react';

import Badge from '../components/common/Badge.jsx';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import Input from '../components/common/Input.jsx';
import Modal from '../components/common/Modal.jsx';
import Select from '../components/common/Select.jsx';
import Skeleton from '../components/common/Skeleton.jsx';
import SkeletonText from '../components/common/SkeletonText.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import { toast } from '../store/toastStore.js';

/**
 * Visual review harness for the `common/` primitives: every variant of every
 * component, in one page, so they can be compared against each other and
 * checked in both themes with the ThemeToggle in the header.
 *
 * Routed outside AppShell for the same reason DesignSystemPage is - it is a
 * review surface, not an application page, and should not inherit the app
 * chrome. Delete it once the components have been reviewed in place on real
 * pages (the same deal as DesignSystemPage).
 *
 * Class names are written out in full throughout: Tailwind can only generate
 * CSS for literals it can see, so `bg-${tone}` would silently render nothing.
 */

/** A section heading + copy, so every block below explains itself. */
function Section({ id, title, note, children }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-xl font-semibold tracking-tight text-text">
        {title}
      </h2>
      <p className="mt-1 max-w-prose text-sm leading-relaxed text-text-secondary">
        {note}
      </p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Wraps each variant in a labelled cell. */
function Variant({ label, children }) {
  return (
    <div>
      <p className="mb-2 font-mono text-xs text-text-tertiary">{label}</p>
      {children}
    </div>
  );
}

const categories = [
  { value: 'food', label: 'Food & dining' },
  { value: 'transport', label: 'Transport' },
  { value: 'housing', label: 'Housing' },
  { value: 'health', label: 'Health' },
];

const badgeTones = [
  { tone: 'primary', label: 'Primary' },
  { tone: 'success', label: 'Success' },
  { tone: 'danger', label: 'Danger' },
  { tone: 'warning', label: 'Warning' },
  { tone: 'info', label: 'Info' },
  { tone: 'neutral', label: 'Neutral' },
];

export default function ComponentDemoPage() {
  const [openSize, setOpenSize] = useState(null);
  const [stickyOpen, setStickyOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg text-text">
      <header className="sticky top-0 z-20 border-b border-border bg-bg/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-6">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-tight">
              Common components
            </h1>
            <p className="text-xs text-text-tertiary">
              Review surface — not an app page
            </p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-12 px-6 py-10">
        {/* ---------------------------------------------------------------- */}
        <Section
          id="button"
          title="Button"
          note="Four variants, three sizes. Each loading button is paired with its idle twin: the label stays in the layout at zero opacity and the spinner is centred over it, so the box keeps the exact same width and the text stays available to screen readers. A loading button is disabled (that is what stops a double submit) but it is not dimmed and shows cursor-progress instead of cursor-not-allowed — 'this is happening' is a different message from 'you cannot do this'."
        >
          <Card>
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <Variant label="variant">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button>Primary</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="danger">Danger</Button>
                  </div>
                </Variant>

                <Variant label="size">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button size="sm">Small</Button>
                    <Button size="md">Medium</Button>
                    <Button size="lg">Large</Button>
                  </div>
                </Variant>

                <Variant label="loading — width holds (each pair is idle | loading)">
                  <div className="space-y-2">
                    {[
                      { label: 'Save changes', variant: 'primary' },
                      { label: 'Loading', variant: 'secondary' },
                      { label: 'Deleting', variant: 'danger' },
                    ].map(({ label, variant }) => (
                      <div key={label} className="flex items-center gap-2">
                        <Button variant={variant}>{label}</Button>
                        <Button variant={variant} loading>
                          {label}
                        </Button>
                      </div>
                    ))}
                  </div>
                </Variant>

                <Variant label="disabled — dimmed, no hover">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button disabled>Disabled</Button>
                    <Button variant="secondary" disabled>
                      Disabled
                    </Button>
                    <Button variant="ghost" disabled>
                      Disabled
                    </Button>
                    <Button variant="danger" disabled>
                      Disabled
                    </Button>
                  </div>
                </Variant>

                <Variant label="with icons">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button icon={Plus}>Add transaction</Button>
                    <Button variant="secondary" icon={Pencil}>
                      Edit
                    </Button>
                    <Button variant="ghost" icon={ArrowLeftRight}>
                      Transfer
                    </Button>
                    <Button
                      variant="danger"
                      icon={Trash2}
                      iconAfter={ChevronRight}
                    >
                      Delete rule
                    </Button>
                  </div>
                </Variant>

                <Variant label="fullWidth">
                  <div className="space-y-2">
                    <Button fullWidth icon={Plus}>
                      Add your first transaction
                    </Button>
                    <Button
                      fullWidth
                      variant="secondary"
                      loading={false}
                      disabled
                    >
                      Unavailable while offline
                    </Button>
                  </div>
                </Variant>
              </div>
            </div>
          </Card>
        </Section>

        {/* ---------------------------------------------------------------- */}
        <Section
          id="fields"
          title="Input & Select"
          note="Label above, helper or error below, never both. The focus ring is the app-wide one (2px primary, 2px offset) with the border stepping to primary underneath it. All three controls share one height scale — the row below is the test: a Button, an Input and a Select side by side must sit flush at sm, md and lg."
        >
          <Card>
            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                label="Description"
                placeholder="Swiggy order #4821"
                helperText="Shown in the transaction list."
              />

              <Input
                label="Amount"
                placeholder="0.00"
                error="Enter an amount greater than zero."
                inputMode="decimal"
              />

              <Input
                label="Notes"
                optional
                placeholder="Anything to remember"
              />

              <Input
                label="Archived"
                defaultValue="Locked field"
                disabled
                readOnly
              />

              <Select
                label="Category"
                helperText="Drives the budget this transaction counts against."
                defaultValue="food"
                options={categories}
              />

              <Select
                label="Category"
                error="Pick a category so this can be budgeted."
                defaultValue=""
                options={[
                  { value: '', label: 'Select a category…' },
                  ...categories,
                ]}
              />

              <Select
                label="Payment method"
                options={categories}
                disabled
                defaultValue="housing"
              />

              <Select label="Type" defaultValue="expense">
                <optgroup label="Money in">
                  <option value="income">Income</option>
                  <option value="refund">Refund</option>
                </optgroup>
                <optgroup label="Money out">
                  <option value="expense">Expense</option>
                  <option value="transfer">Transfer</option>
                </optgroup>
              </Select>
            </div>

            <div className="mt-8 space-y-5 border-t border-border pt-6">
              <p className="font-mono text-xs text-text-tertiary">
                height alignment — sm / md / lg
              </p>

              {['sm', 'md', 'lg'].map((size) => (
                <div key={size} className="flex items-end gap-3">
                  <Input
                    size={size}
                    label={`Input (${size})`}
                    defaultValue="Zoya Textiles"
                    containerClassName="max-w-56"
                  />
                  <Select
                    size={size}
                    label={`Select (${size})`}
                    defaultValue="food"
                    options={categories}
                    containerClassName="max-w-48"
                  />
                  <Button size={size} variant="secondary">
                    Apply
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </Section>

        {/* ---------------------------------------------------------------- */}
        <Section
          id="card"
          title="Card"
          note="One padding, one border, one soft shadow. The header slot is optional (title + right-aligned action), as is the footer — and `padded={false}` hands padding back to the content for flush tables and lists."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <Card
              title="October budget"
              description="All categories"
              action={<Button size="sm">Manage</Button>}
            >
              <div className="flex items-baseline justify-between">
                <span className="numbers font-mono text-2xl font-semibold">
                  ₹12,480
                </span>
                <Badge tone="warning">83% used</Badge>
              </div>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-pill bg-bg-subtle">
                <div className="h-full w-[83%] rounded-pill bg-warning" />
              </div>
            </Card>

            <Card
              title="Delete this rule?"
              description="It applies to 42 transactions."
              footer="This cannot be undone."
              raised
            >
              <div className="flex justify-end gap-2">
                <Button variant="secondary">Keep rule</Button>
                <Button variant="danger" icon={Trash2}>
                  Delete
                </Button>
              </div>
            </Card>

            <Card title="Bare card">
              <p className="text-sm text-text-secondary">
                No header slot at all — just the surface, its padding and its
                shadow.
              </p>
            </Card>

            <Card title="Flush table (padded={false})" padded={false}>
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-border">
                    <td className="px-5 py-3">Zoya Textiles</td>
                    <td className="numbers px-5 py-3 text-right">−₹1,249</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3">Salary — Acme Corp</td>
                    <td className="numbers px-5 py-3 text-right">+₹85,000</td>
                  </tr>
                </tbody>
              </table>
            </Card>
          </div>
        </Section>

        {/* ---------------------------------------------------------------- */}
        <Section
          id="modal"
          title="Modal"
          note="Centred, dimmed and blurred backdrop, slide-up entrance. Escape closes, backdrop click closes, Tab cycles inside and focus returns to the trigger on close. The last one is non-dismissible — it stays open until its own buttons close it."
        >
          <Card>
            <div className="flex flex-wrap gap-2">
              {['sm', 'md', 'lg', 'xl'].map((size) => (
                <Button
                  key={size}
                  variant="secondary"
                  onClick={() => setOpenSize(size)}
                >
                  {size}
                </Button>
              ))}
              <Button variant="danger" onClick={() => setStickyOpen(true)}>
                Non-dismissible
              </Button>
            </div>
          </Card>

          <Modal
            open={openSize === 'sm'}
            onClose={() => setOpenSize(null)}
            title="Confirm"
            description="A small dialog."
            size="sm"
            footer={
              <>
                <Button variant="secondary" onClick={() => setOpenSize(null)}>
                  Cancel
                </Button>
                <Button onClick={() => setOpenSize(null)}>Confirm</Button>
              </>
            }
          >
            <p className="text-sm text-text-secondary">
              This is the `sm` size — enough for a confirmation and its two
              buttons.
            </p>
          </Modal>

          <Modal
            open={openSize === 'md'}
            onClose={() => setOpenSize(null)}
            title="Edit transaction"
            description="The default size, and the one most forms will use."
            size="md"
            footer={
              <>
                <Button variant="secondary" onClick={() => setOpenSize(null)}>
                  Cancel
                </Button>
                <Button onClick={() => setOpenSize(null)}>Save changes</Button>
              </>
            }
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Description" defaultValue="Swiggy order #4821" />
              <Input label="Amount" defaultValue="640.50" inputMode="decimal" />
              <Select
                label="Category"
                defaultValue="food"
                options={categories}
                containerClassName="sm:col-span-2"
              />
              <Input
                label="Notes"
                optional
                placeholder="Split with Priya"
                containerClassName="sm:col-span-2"
              />
            </div>
          </Modal>

          <Modal
            open={openSize === 'lg'}
            onClose={() => setOpenSize(null)}
            title="Import transactions"
            description="Long content scrolls inside the panel instead of growing it past the viewport."
            size="lg"
            footer={
              <>
                <Button variant="secondary" onClick={() => setOpenSize(null)}>
                  Cancel
                </Button>
                <Button onClick={() => setOpenSize(null)}>
                  Import 248 rows
                </Button>
              </>
            }
          >
            <ul className="space-y-2 text-sm text-text-secondary">
              {Array.from({ length: 12 }, (_, index) => (
                <li
                  key={index}
                  className="flex justify-between gap-4 border-b border-border pb-2"
                >
                  <span>2026-10-{String(index + 1).padStart(2, '0')}</span>
                  <span className="numbers">₹{(index + 1) * 137}.00</span>
                </li>
              ))}
            </ul>
          </Modal>

          <Modal
            open={openSize === 'xl'}
            onClose={() => setOpenSize(null)}
            title="Monthly report"
            description="The widest size — for anything that reads as a page."
            size="xl"
            footer={<Button onClick={() => setOpenSize(null)}>Done</Button>}
          >
            <div className="grid gap-4 sm:grid-cols-3">
              {['Income', 'Expenses', 'Saved'].map((label) => (
                <Card key={label} title={label}>
                  <p className="numbers font-mono text-xl font-semibold">
                    ₹
                    {label === 'Income'
                      ? '85,000'
                      : label === 'Expenses'
                        ? '42,180'
                        : '42,820'}
                  </p>
                </Card>
              ))}
            </div>
          </Modal>

          <Modal
            open={stickyOpen}
            onClose={() => setStickyOpen(false)}
            title="Deleting 42 transactions"
            description="Escape and the backdrop are disabled here — only these buttons close it."
            size="md"
            dismissible={false}
            footer={
              <>
                <Button
                  variant="secondary"
                  onClick={() => setStickyOpen(false)}
                >
                  Keep them
                </Button>
                <Button
                  variant="danger"
                  icon={Trash2}
                  onClick={() => setStickyOpen(false)}
                >
                  Delete 42 transactions
                </Button>
              </>
            }
          >
            <p className="text-sm text-text-secondary">
              A destructive confirmation in flight should not be closable by a
              stray keypress or a click that missed the buttons.
            </p>
          </Modal>
        </Section>

        {/* ---------------------------------------------------------------- */}
        <Section
          id="badge"
          title="Badge"
          note="Six tones, two variants, two sizes, plus a status dot and an icon. No solid variant: white on success-600 is 3.77:1 and white on info-400 is 2.98:1, both under WCAG AA, so the filled option was dropped rather than shipped at a contrast the rest of the app does not meet."
        >
          <Card>
            <div className="space-y-6">
              <Variant label="subtle (default) · sm">
                <div className="flex flex-wrap gap-2">
                  {badgeTones.map(({ tone, label }) => (
                    <Badge key={tone} tone={tone} size="sm">
                      {label}
                    </Badge>
                  ))}
                </div>
              </Variant>

              <Variant label="subtle · md">
                <div className="flex flex-wrap gap-2">
                  {badgeTones.map(({ tone, label }) => (
                    <Badge key={tone} tone={tone}>
                      {label}
                    </Badge>
                  ))}
                </div>
              </Variant>

              <Variant label="outline">
                <div className="flex flex-wrap gap-2">
                  {badgeTones.map(({ tone, label }) => (
                    <Badge key={tone} tone={tone} variant="outline">
                      {label}
                    </Badge>
                  ))}
                </div>
              </Variant>

              <Variant label="dot — live status">
                <div className="flex flex-wrap gap-2">
                  <Badge tone="success" dot>
                    Active
                  </Badge>
                  <Badge tone="danger" dot>
                    Over budget
                  </Badge>
                  <Badge tone="warning" dot>
                    At 92%
                  </Badge>
                  <Badge tone="info" dot>
                    AI suggested
                  </Badge>
                  <Badge tone="neutral" dot>
                    Archived
                  </Badge>
                </div>
              </Variant>

              <Variant label="with icon — category tags">
                <div className="flex flex-wrap gap-2">
                  <Badge tone="primary" icon={Wallet}>
                    Groceries
                  </Badge>
                  <Badge tone="neutral" icon={Receipt}>
                    Dining out
                  </Badge>
                  <Badge tone="info" icon={Target}>
                    Savings goal
                  </Badge>
                  <Badge tone="neutral" size="sm" icon={ArrowLeftRight}>
                    Transfer
                  </Badge>
                </div>
              </Variant>

              <Variant label="in context — budget row">
                <div className="flex items-center justify-between gap-4 rounded-card border border-border bg-bg-subtle px-4 py-3">
                  <span className="text-sm font-medium">Dining out</span>
                  <Badge tone="danger">Over by ₹2,400</Badge>
                </div>
              </Variant>
            </div>
          </Card>
        </Section>

        {/* ---------------------------------------------------------------- */}
        <Section
          id="toast"
          title="Toast"
          note="Slides in from the bottom on a phone and from the top-right from `sm` up; auto-dismisses after 4s, or stays until dismissed with `duration: 0`. Hover or tab into one and the timer pauses, so a message can be read at the reader's pace. Fire several at once to see the stack, and note it caps at four."
        >
          <Card>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() =>
                  toast.success('Budget saved', {
                    description: 'Groceries is now ₹15,000 for October.',
                  })
                }
              >
                Success
              </Button>
              <Button
                variant="danger"
                onClick={() =>
                  toast.error('Could not save the transaction', {
                    description: 'The server rejected the request. Try again.',
                  })
                }
              >
                Error
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  toast.info('Categorised by a rule', {
                    description: 'Matched “Swiggy” → Food & dining.',
                  })
                }
              >
                Info
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  toast.info('Stays until dismissed', { duration: 0 })
                }
              >
                Sticky
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  toast.info('First notification');
                  toast.success('Second notification', {
                    description:
                      'Stacking is newest-at-the-bottom on mobile, top-right on desktop.',
                  });
                  toast.error('Third notification');
                }}
              >
                Fire three at once
              </Button>
            </div>
          </Card>
        </Section>

        {/* ---------------------------------------------------------------- */}
        <Section
          id="empty-state"
          title="EmptyState"
          note="For any list with zero items. The message is the instruction, not the diagnosis, and the call to action only appears when there is an obvious next step."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <Card padded={false}>
              <EmptyState
                icon={Receipt}
                title="No transactions yet"
                description="Add your first one and your budgets, forecasts and reports all build from it."
                actionLabel="Add transaction"
                onAction={() =>
                  toast.info('That button belongs to the transactions page')
                }
              />
            </Card>

            <Card padded={false}>
              <EmptyState
                icon={Target}
                title="No savings goals"
                description="A goal needs a target amount and a deadline — the monthly contribution is worked out for you."
              />
            </Card>

            <Card title="Compact — inside a panel" padded={false}>
              <EmptyState
                compact
                icon={Inbox}
                title="No rules matched"
                description="Nothing in this import matched an active rule."
              />
            </Card>

            <Card padded={false}>
              <EmptyState
                icon={Inbox}
                title="Nothing here"
                description="Custom CTA passed as a node instead of actionLabel/onAction."
                action={
                  <Button variant="secondary" size="sm" onClick={() => {}}>
                    Clear filters
                  </Button>
                }
              />
            </Card>
          </div>
        </Section>

        {/* ---------------------------------------------------------------- */}
        <Section
          id="skeleton"
          title="Skeleton"
          note="Loading placeholders that match the shape of what replaces them, so nothing shifts when the data lands. Each skeleton below is sized to the real thing it stands in for — the card mirrors the budget card above, the rows mirror a transaction list, the avatar mirrors the top bar's user."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Skeleton budget card (shape of the real one)">
              <div className="flex items-baseline justify-between">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-5 w-20 rounded-pill" />
              </div>
              <Skeleton className="mt-4 h-2 w-full" />
              <SkeletonText lines={2} className="mt-4" />
            </Card>

            <Card title="Skeleton transaction rows">
              <ul className="space-y-2">
                {Array.from({ length: 4 }, (_, index) => (
                  // `py-1` puts each row at the same height as the real table
                  // rows above, so the list does not jump when data lands.
                  <li key={index} className="flex items-center gap-3 py-1">
                    <Skeleton circle className="size-9 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <Skeleton className="h-3.5 w-2/3" />
                      <Skeleton className="mt-2 h-3 w-1/3" />
                    </div>
                    <Skeleton className="h-4 w-20" />
                  </li>
                ))}
              </ul>
            </Card>

            <Card title="Avatar + heading">
              <div className="flex items-center gap-3">
                <Skeleton circle className="size-10 shrink-0" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="mt-2 h-3 w-48" />
                </div>
              </div>
            </Card>

            <Card title="Button placeholders">
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-12 w-40" />
              </div>
            </Card>
          </div>

          <Card className="mt-4" title="Field placeholders">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Skeleton className="mb-1.5 h-4 w-24" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="mt-1.5 h-3 w-40" />
              </div>
              <div>
                <Skeleton className="mb-1.5 h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </Card>
        </Section>
      </main>
    </div>
  );
}
