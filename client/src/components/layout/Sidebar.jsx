import {
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  TrendingUp,
  X,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

import { getInitials, useAuthStore } from '../../store/authStore.js';
import ThemeToggle from '../ThemeToggle.jsx';
import { NAV_ITEMS } from './navigation.js';

function Brand({ collapsed, onClose }) {
  return (
    <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-border px-4">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-control bg-primary text-primary-contrast">
        <TrendingUp className="size-5" aria-hidden="true" />
      </span>
      {!collapsed && (
        <span className="truncate text-lg font-semibold tracking-tight text-text">
          Fin<span className="text-primary">Track</span>
        </span>
      )}
      {/* Only the drawer passes onClose. On a phone there is no keyboard to
          press Escape, so the drawer needs a visible dismiss control in
          thumb reach rather than relying on the backdrop or a nav tap. */}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close navigation menu"
          className="-mr-2 ml-auto inline-flex size-10 shrink-0 items-center justify-center rounded-control text-text-secondary transition-colors hover:bg-bg-subtle hover:text-text"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

function NavLinks({ collapsed, onNavigate }) {
  return (
    <nav aria-label="Main" className="flex-1 space-y-1 overflow-y-auto p-3">
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          title={collapsed ? label : undefined}
          className={({ isActive }) =>
            [
              'group flex items-center rounded-control text-sm transition-colors duration-150',
              collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5',
              // Weight is part of the active signal, not decoration: at a glance
              // the current page should read differently even in greyscale.
              isActive ? 'font-semibold' : 'font-medium',
              isActive
                ? 'bg-primary-subtle text-primary-on-subtle'
                : 'text-text-secondary hover:bg-bg-subtle hover:text-text',
            ].join(' ')
          }
        >
          {({ isActive }) => (
            <>
              <Icon
                className={`size-5 shrink-0 transition-colors ${
                  isActive
                    ? 'text-primary-on-subtle'
                    : 'text-text-tertiary group-hover:text-text-secondary'
                }`}
                aria-hidden="true"
              />
              {!collapsed && <span className="truncate">{label}</span>}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

function UserSection({ collapsed, onLogout }) {
  const user = useAuthStore((state) => state.user);
  const name = user?.name ?? 'Guest';
  const initials = getInitials(name);

  return (
    <div className="shrink-0 border-t border-border p-3">
      <div
        className={`flex items-center rounded-control ${collapsed ? 'flex-col gap-3' : 'gap-3'}`}
      >
        <span
          className={`flex shrink-0 items-center justify-center rounded-pill bg-primary-subtle font-semibold text-primary-on-subtle ${
            collapsed ? 'size-10 text-xs' : 'size-10 text-sm'
          }`}
          title={name}
        >
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt=""
              className="size-full rounded-pill object-cover"
            />
          ) : (
            initials
          )}
        </span>

        {!collapsed && (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-text">
              {name}
            </span>
            {user?.email && (
              <span className="block truncate text-xs text-text-tertiary">
                {user.email}
              </span>
            )}
          </span>
        )}

        <span
          className={
            collapsed ? 'flex flex-col gap-2' : 'flex items-center gap-1'
          }
        >
          <ThemeToggle />
          <button
            type="button"
            onClick={onLogout}
            aria-label="Log out"
            title="Log out"
            className="inline-flex size-9 items-center justify-center rounded-control border border-border bg-surface text-text-secondary transition-colors duration-200 hover:bg-danger-subtle hover:text-danger"
          >
            <LogOut className="size-5" aria-hidden="true" />
          </button>
        </span>
      </div>
    </div>
  );
}

/**
 * Fixed application sidebar: brand, primary nav, and a user section pinned to
 * the bottom. `collapsed` switches it to a 5rem icon-only rail; `width` lets a
 * caller (the mobile drawer) override the width instead, and `onClose` renders
 * the drawer's dismiss button in the brand row.
 */
export default function Sidebar({
  collapsed = false,
  width,
  onToggleCollapse,
  onNavigate,
  onClose,
  onLogout,
}) {
  return (
    <div
      className={`flex h-full flex-col border-r border-border bg-surface transition-[width] duration-200 ease-out ${
        width ?? (collapsed ? 'w-20' : 'w-64')
      }`}
    >
      <Brand collapsed={collapsed} onClose={onClose} />

      <NavLinks collapsed={collapsed} onNavigate={onNavigate} />

      {onToggleCollapse && (
        <div className="px-3 pb-2">
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="flex w-full items-center justify-center gap-2 rounded-control px-3 py-2 text-xs font-medium text-text-tertiary transition-colors hover:bg-bg-subtle hover:text-text"
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4" aria-hidden="true" />
            ) : (
              <>
                <PanelLeftClose
                  className="size-4 shrink-0"
                  aria-hidden="true"
                />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      )}

      <UserSection collapsed={collapsed} onLogout={onLogout} />
    </div>
  );
}
