import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuthStore } from '../../store/authStore.js';
import Sidebar from './Sidebar.jsx';
import TopBar from './TopBar.jsx';
import { PageHeaderContext } from './pageHeaderContext.js';
import { findNavItem } from './navigation.js';

/** Below `lg` the sidebar becomes an overlay drawer; this is its width. */
const DRAWER_WIDTH = 'w-72';

/**
 * Root layout for every authenticated page.
 *
 * Owns the sidebar (persistent on desktop, slide-over drawer on phones), the
 * page title in the top bar, and the content gutter. Child routes render into
 * the capped, centred content column through <Outlet />.
 */
export default function AppShell() {
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);

  const [collapsed, setCollapsed] = useState(false);
  // Stores the pathname the drawer was opened on, rather than a boolean, so
  // navigating closes it as a derived value instead of an effect. This also
  // makes it impossible for the drawer to outlive the page it was opened on.
  const [drawerOpenedAt, setDrawerOpenedAt] = useState(null);
  const [action, setAction] = useState(null);
  const drawerRef = useRef(null);

  const drawerOpen = drawerOpenedAt === location.pathname;
  const closeDrawer = useCallback(() => setDrawerOpenedAt(null), []);
  const openDrawer = useCallback(
    () => setDrawerOpenedAt(location.pathname),
    [location.pathname],
  );

  // Escape closes the drawer, and the page behind it must not scroll while the
  // overlay is up.
  useEffect(() => {
    if (!drawerOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') closeDrawer();
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Move focus into the drawer so Tab stays inside it and the close button is
    // the first stop, rather than leaving focus behind on the page.
    drawerRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [drawerOpen, closeDrawer]);

  const navItem = findNavItem(location.pathname);
  const title = navItem?.title ?? 'FinTrack';

  // `setAction` is a stable state setter, so the object identity has to be too
  // or every page using usePageHeader() re-renders on each shell render.
  const headerContext = useMemo(() => ({ setAction }), []);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <PageHeaderContext.Provider value={headerContext}>
      <div className="min-h-screen bg-bg text-text">
        {/* Desktop sidebar. `lg` and up keeps it docked; below that the rail is
            hidden and navigation happens through the drawer. */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden lg:block">
          <Sidebar
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed((value) => !value)}
            onLogout={logout}
          />
        </aside>

        {/* Mobile / tablet slide-over drawer. */}
        {drawerOpen && (
          <>
            <button
              type="button"
              aria-label="Close navigation menu"
              onClick={closeDrawer}
              // neutral-900 is a static palette step, not a semantic token, so
              // the scrim stays a dark wash in light *and* dark mode.
              className="fixed inset-0 z-40 bg-neutral-900/60 backdrop-blur-sm lg:hidden"
            />
            <div
              ref={drawerRef}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation"
              tabIndex={-1}
              className="fixed inset-y-0 left-0 z-50 shadow-card-raised outline-none lg:hidden"
            >
              <Sidebar
                width={DRAWER_WIDTH}
                onNavigate={closeDrawer}
                onClose={closeDrawer}
                onLogout={logout}
              />
            </div>
          </>
        )}

        <div
          className={`transition-[padding] duration-200 ease-out ${collapsed ? 'lg:pl-20' : 'lg:pl-64'}`}
        >
          <TopBar title={title} action={action} onOpenDrawer={openDrawer} />

          <main className="mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </PageHeaderContext.Provider>
  );
}
