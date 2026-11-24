import { useEffect, useRef, useState, type TouchEvent } from 'react';
import { NavLink, Link, Outlet, useLocation, useNavigate } from 'react-router';
import { useApp } from '../state/AppProvider';
import { CharacterPortrait } from '../features/profile/CharacterPortrait';
const pages = [
  ['home', 'Home', '▦'],
  ['classes', 'Classes', '♣'],
  ['quests', 'Quests', '⚑'],
];
export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const menuButton = useRef<HTMLButtonElement>(null);
  const [menuLocation, setMenuLocation] = useState<string | null>(null);
  const menuOpen = menuLocation === location.key;
  const swipeStart = useRef<{ x: number; y: number; pageIndex: number } | null>(
    null,
  );
  const { state, notice, storageError, demo } = useApp();
  const name =
    [state.profile.firstName, state.profile.lastName]
      .filter(Boolean)
      .join(' ') || 'Adventurer';
  const pageIndex = pages.findIndex(([key]) => location.pathname === '/' + key);
  const page =
    location.pathname === '/about'
      ? 'About'
      : (pages[pageIndex]?.[1] ?? 'Home');
  const isHome = page === 'Home';
  useEffect(() => {
    document.title = 'Quest | ' + page;
    window.scrollTo(0, 0);
    document
      .querySelector<HTMLElement>('main h1')
      ?.focus({ preventScroll: true });
  }, [location.pathname, page]);

  function startSwipe(event: TouchEvent<HTMLElement>) {
    swipeStart.current = null;
    if (
      pageIndex < 0 ||
      event.touches.length !== 1 ||
      (event.target instanceof Element &&
        event.target.closest(
          '.about-tray, dialog, input, textarea, select, [contenteditable]',
        ))
    )
      return;

    const touch = event.touches[0];
    swipeStart.current = {
      x: touch.clientX,
      y: touch.clientY,
      pageIndex,
    };
  }

  function finishSwipe(event: TouchEvent<HTMLElement>) {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (!start || start.pageIndex !== pageIndex || event.touches.length) return;

    const touch = event.changedTouches[0];
    if (!touch) return;
    const x = touch.clientX - start.x;
    const y = touch.clientY - start.y;
    if (Math.abs(x) < 55 || Math.abs(x) < Math.abs(y) * 1.5) return;

    const next = pages[pageIndex + (x < 0 ? 1 : -1)];
    if (next) void navigate('/' + next[0]);
  }

  return (
    <div
      className={[
        'app',
        isHome && 'character-screen',
        pageIndex >= 0 && 'swipe-area',
      ]
        .filter(Boolean)
        .join(' ')}
      onTouchStartCapture={startSwipe}
      onTouchEndCapture={finishSwipe}
      onTouchCancel={() => {
        swipeStart.current = null;
      }}
    >
      <aside className="sidebar">
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
