import { Navigate, Route, Routes } from 'react-router-dom';

import RequireAuth from './components/auth/RequireAuth.jsx';
import AppShell from './components/layout/AppShell.jsx';
import BudgetsPage from './pages/BudgetsPage.jsx';
import ComponentDemoPage from './pages/ComponentDemoPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import DesignSystemPage from './pages/DesignSystemPage.jsx';
import GoalsPage from './pages/GoalsPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
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
 * RequireAuth is the single auth gate: everything except /login and
 * /register sits behind it, so an unauthenticated visit to any other path -
 * including the review harnesses and the wildcard's /dashboard landing -
 * lands on /login, remembering where the user was headed.
 *
 * /login and /register are also outside the shell: they are full-screen
 * pages with no app chrome, and each bounces an already-authenticated
 * visitor back into the shell.
 *
 * The design-system and component review harnesses are previews, not
 * application pages - delete them once real pages cover the tokens and the
 * primitives.
 */
export default function App() {
  return (
    <Routes>
      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
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
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/design-system"
        element={
          <RequireAuth>
            <DesignSystemPage />
          </RequireAuth>
        }
      />
      <Route
        path="/components"
        element={
          <RequireAuth>
            <ComponentDemoPage />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
