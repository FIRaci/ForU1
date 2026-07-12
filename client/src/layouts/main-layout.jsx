/* Main layout — sticky header, content, footer */
import { Link, useLocation } from 'react-router-dom';
import HeartRainButton from '../components/heart-rain-button';
import './main-layout.css';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/browse/image', label: 'Images' },
  { to: '/browse/gif', label: 'GIFs' },
  { to: '/browse/video', label: 'Videos' },
];

export default function MainLayout({ children }) {
  const { pathname } = useLocation();

  return (
    <div className="layout">
      {/* ---- Header ---- */}
      <header className="layout__header">
        <div className="container layout__header-inner">
          {/* Brand */}
          <Link to="/" className="layout__brand">
            Foru
          </Link>

          {/* Navigation */}
          <nav className="layout__nav" aria-label="Main navigation">
            {NAV_LINKS.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`layout__nav-link ${
                  pathname === to || (to !== '/' && pathname.startsWith(to))
                    ? 'is-active'
                    : ''
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* ---- Main Content ---- */}
      <main className="layout__main">{children}</main>

      {/* ---- Footer ---- */}
      <footer className="layout__footer">
        <p>
          made with love{' '}
          <span className="layout__footer-heart" aria-label="love">
            ♥
          </span>
        </p>
      </footer>

      {/* Heart rain FAB */}
      <HeartRainButton />
    </div>
  );
}
