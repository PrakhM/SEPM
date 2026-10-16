import { Navigate, Route, Routes } from 'react-router-dom';

import AppShell from './components/layout/AppShell.jsx';
import BudgetsPage from './pages/BudgetsPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import DesignSystemPage from './pages/DesignSystemPage.jsx';
import GoalsPage from './pages/GoalsPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import RulesPage from './pages/RulesPage.jsx';
import SubscriptionsPage from './pages/SubscriptionsPage.jsx';
import TransactionsPage from './pages/TransactionsPage.jsx';

/**
 * Route table.
 *
 * AppShell is a layout route: it renders the sidebar and top bar once and
 * nests every authenticated page underneath it, so a page only has to supply
 * its own content.
 *
 * The design-system harness sits outside the shell deliberately - it is a
 * token preview, not an application page, and should not inherit the app
 * chrome. Delete it once real pages cover the tokens.
 *
 * /login is also outside the shell, and must stay routed: AppShell redirects
 * unauthenticated visitors there, so an unrouted /login would fall through to
 * the wildcard below and redirect back into the shell forever.
 */
export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/budgets" element={<BudgetsPage />} />
        <Route path="/goals" element={<GoalsPage />} />
        <Route path="/subscriptions" element={<SubscriptionsPage />} />
        <Route path="/rules" element={<RulesPage />} />
        <Route path="/reports" element={<ReportsPage />} />
      </Route>

      <Route path="/login" element={<LoginPage />} />
      <Route path="/design-system" element={<DesignSystemPage />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
