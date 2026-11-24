import { useEffect } from 'react';
import { NavLink, Link, Outlet, useLocation } from 'react-router';
import { useApp } from '../state/AppProvider';
import { CharacterPortrait } from '../features/profile/CharacterPortrait';
const pages = [
  ['home', 'Home', '▦'],
  ['about', 'About', '○'],
  ['classes', 'Classes', '♣'],
  ['quests', 'Quests', '⚑'],
];
export function AppLayout() {
  const location = useLocation();
  const { state, notice, storageError, demo } = useApp();
  const name =
    [state.profile.firstName, state.profile.lastName]
      .filter(Boolean)
      .join(' ') || 'Adventurer';
  const page =
    pages.find(([key]) => location.pathname === '/' + key)?.[1] || 'Home';
  const isHome = page === 'Home';
  useEffect(() => {
    document.title = 'Quest | ' + page;
    window.scrollTo(0, 0);
    document
      .querySelector<HTMLElement>('main h1')
      ?.focus({ preventScroll: true });
  }, [location.pathname, page]);
  return (
    <div className={isHome ? 'app character-screen' : 'app'}>
      <aside className="sidebar">
        <Link className="brand" to="/home">
          <span aria-hidden="true">✧</span> QUEST
        </Link>
        <p className="tagline">A LITTLE BETTER, EVERY DAY</p>
        <nav className="nav" aria-label="Main navigation">
          {pages.map(([key, label, icon]) => (
            <NavLink key={key} to={'/' + key}>
              <span aria-hidden="true">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <small>THE EVERYDAY ADVENTURE</small>
          <p>
            Small actions.
            <br />
            Meaningful progress.
          </p>
          <div className="user">
            {!isHome && <CharacterPortrait />}
            <div>
              <strong>{name}</strong>
              <small>Your character</small>
            </div>
          </div>
        </div>
      </aside>
      <main id="top">
        {!isHome && (
          <header className="topline">
            <span>
              Your character / <b>{page}</b>
            </span>
            <span className="preview">
              {demo ? 'Demo session' : 'Your everyday adventure'}
            </span>
          </header>
        )}
        {storageError && (
          <p className="storage-warning" role="alert">
            {storageError} <Link to="/about">Manage backups</Link>
          </p>
        )}
        <Outlet />
        {!isHome && (
          <footer className="footer">
            <span>Your journey, at your pace.</span>
            <span>CHAPTER 01 · THE EVERYDAY</span>
          </footer>
        )}
      </main>
      <div id="toast" role="status" aria-live="polite">
        {notice}
      </div>
    </div>
  );
}
