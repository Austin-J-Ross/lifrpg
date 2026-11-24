import { useEffect, useRef, useState } from 'react';
import { NavLink, Link, Outlet, useLocation } from 'react-router';
import { useApp } from '../state/AppProvider';
import { QuestBadge } from '../features/quests/QuestBadge';
const pages = [
  ['home', 'Home', '▦'],
  ['classes', 'Classes', '♣'],
  ['quests', 'Quests', '⚑'],
];
export function AppLayout() {
  const location = useLocation();
  const menuButton = useRef<HTMLButtonElement>(null);
  const [menuLocation, setMenuLocation] = useState<string | null>(null);
  const menuOpen = menuLocation === location.key;
  const { notice, storageError } = useApp();
  const page =
    location.pathname === '/about'
      ? 'About'
      : (pages.find(([key]) => location.pathname === '/' + key)?.[1] ?? 'Home');
  const isHome = page === 'Home';
  useEffect(() => {
    document.title = 'Quest | ' + page;
    window.scrollTo(0, 0);
    document
      .querySelector<HTMLElement>('main h1')
      ?.focus({ preventScroll: true });
  }, [location.pathname, page]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="sidebar-heading">
          <div
            className="about-tray"
            onKeyDown={(event) => {
              if (event.key !== 'Escape' || !menuOpen) return;
              setMenuLocation(null);
              menuButton.current?.focus();
            }}
          >
            <button
              ref={menuButton}
              type="button"
              className="about-menu"
              aria-expanded={menuOpen}
              aria-controls="about-tray-links"
              onClick={() => setMenuLocation(menuOpen ? null : location.key)}
            >
              <span className="sr-only">Menu</span>
              <span className="hamburger-lines" aria-hidden="true" />
            </button>
            <div
              className="tray-links"
              id="about-tray-links"
              hidden={!menuOpen}
            >
              <NavLink to="/about" onClick={() => setMenuLocation(null)}>
                About
              </NavLink>
            </div>
          </div>
          <Link className="brand" to="/home">
            <span aria-hidden="true">✧</span> QUEST
          </Link>
        </div>
        {!isHome && <QuestBadge />}
      </header>
      <main id="top">
        {storageError && (
          <p className="storage-warning" role="alert">
            {storageError} <Link to="/about">Manage backups</Link>
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
