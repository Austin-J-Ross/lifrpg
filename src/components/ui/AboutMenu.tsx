import { useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router';

export function AboutMenu() {
  const location = useLocation();
  const menuButton = useRef<HTMLButtonElement>(null);
  const [menuLocation, setMenuLocation] = useState<string | null>(null);
  const menuOpen = menuLocation === location.key;
  return (
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
      <div className="tray-links" id="about-tray-links" hidden={!menuOpen}>
        <NavLink to="/quests" onClick={() => setMenuLocation(null)}>
          Quest Log
        </NavLink>
        <NavLink to="/about" onClick={() => setMenuLocation(null)}>
          About
        </NavLink>
        <NavLink to="/backups" onClick={() => setMenuLocation(null)}>
          Backups
        </NavLink>
      </div>
    </div>
  );
}
