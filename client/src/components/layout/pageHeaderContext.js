import { createContext, useContext } from 'react';

/**
 * Lets a page publish its own primary action into the top bar, so the button
 * lives with the page that knows what it does while the bar keeps owning its
 * placement.
 *
 * Shape: `{ label, icon?, onClick?, to?, disabled? }`.
 * A page registers it from an effect and returns a cleanup that clears it:
 *
 *   useEffect(() => {
 *     setAction({ label: 'Add Transaction', icon: Plus, onClick: openForm });
 *     return () => setAction(null);
 *   }, [openForm, setAction]);
 */
export const PageHeaderContext = createContext({
  setAction: () => {},
});

export function usePageHeader() {
  return useContext(PageHeaderContext);
}
