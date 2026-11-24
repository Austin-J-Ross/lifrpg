import { useEffect } from 'react';
import { NavLink, Link, Outlet, useLocation } from 'react-router';
import { useApp } from '../state/AppProvider';
const pages = [
  ['home', 'Home', '▦'],
  ['physical', 'Phys. Stats', '♙'],
  ['mental', 'Mntl. Stats', '◇'],
  ['life', 'Life Stats', '⌂'],
];
const pageTitles: Record<string, string> = {
  '/classes': 'Classes',
  '/about': 'About',
  '/backups': 'Backups',
  '/quests': 'Quest Log',
  '/mental': 'Mental Stats',
};
export function AppLayout() {
  const location = useLocation();
  const { notice, storageError } = useApp();
  const page =
    pageTitles[location.pathname] ??
    pages.find(([key]) => location.pathname === '/' + key)?.[1] ??
    'Home';
  useEffect(() => {
    document.title = 'Quest | ' + page;
    window.scrollTo(0, 0);
    document
      .querySelector<HTMLElement>('main h1')
      ?.focus({ preventScroll: true });
  }, [location.pathname, page]);

  return (
    <div className="app">
      <main id="top">
        {storageError && (
          <p className="storage-warning" role="alert">
            {storageError} <Link to="/backups">Manage backups</Link>
          </p>
        )}
        <Outlet />
      </main>
      <nav className="nav bottom-nav" aria-label="Main navigation">
        {pages.map(([key, label, icon]) => (
          <NavLink key={key} to={'/' + key}>
            <span aria-hidden="true">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>
      <div id="toast" role="status" aria-live="polite">
        {notice}
      </div>
    </div>
  );
}
