import {
  ArrowLeftRight,
  FileBarChart,
  LayoutDashboard,
  ListChecks,
  Repeat,
  Target,
  Wallet,
} from 'lucide-react';

/**
 * Single source of truth for the primary navigation.
 *
 * `title` is what the top bar renders as the current page heading; it is
 * looked up from the matched route so a page never has to set it by hand.
 * Add a nav item here and the sidebar, the active-state matching and the
 * top bar heading all pick it up together.
 */
export const NAV_ITEMS = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    title: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    to: '/transactions',
    label: 'Transactions',
    title: 'Transactions',
    icon: ArrowLeftRight,
  },
  { to: '/budgets', label: 'Budgets', title: 'Budgets', icon: Wallet },
  { to: '/goals', label: 'Goals', title: 'Savings Goals', icon: Target },
  {
    to: '/subscriptions',
    label: 'Subscriptions',
    title: 'Subscriptions',
    icon: Repeat,
  },
  {
    to: '/rules',
    label: 'Rules',
    title: 'Categorisation Rules',
    icon: ListChecks,
  },
  { to: '/reports', label: 'Reports', title: 'Reports', icon: FileBarChart },
];

/** Longest-prefix match so `/transactions/123` still resolves to Transactions. */
export function findNavItem(pathname) {
  return NAV_ITEMS.filter((item) => pathname.startsWith(item.to)).sort(
    (a, b) => b.to.length - a.to.length,
  )[0];
}
