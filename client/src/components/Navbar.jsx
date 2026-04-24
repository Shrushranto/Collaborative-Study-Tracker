import { useEffect, useRef, useState } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from './Avatar.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isWelcome = !user && (location.pathname === '/welcome' || location.pathname === '/');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  function closeMenu() { setMenuOpen(false); }

  function handleLogout() {
    logout();
    setMenuOpen(false);
    navigate('/welcome');
  }

  return (
    <header className={`navbar${isWelcome ? ' navbar--welcome' : ''}`}>
      <div className="navbar-inner" ref={menuRef}>
        <Link to={user ? '/' : '/welcome'} className="brand" onClick={closeMenu}>
          📚 Study Buddy
        </Link>

        {user ? (
          <>
            {/* Desktop: links + profile — hidden on mobile via .navbar-desktop */}
            <div className="navbar-desktop">
              <nav className="navbar-links">
                <NavLink to="/goals" className="nav-link">Goals</NavLink>
                <NavLink to="/quiz" className="nav-link">Quiz</NavLink>
                <NavLink to="/files" className="nav-link">Files</NavLink>
                <NavLink to="/leaderboard" className="nav-link">Leaderboard</NavLink>
                <NavLink to="/people" className="nav-link">People</NavLink>
                <NavLink to="/group-sessions" className="nav-link">Groups</NavLink>
                <NavLink to="/messages" className="nav-link">Messages</NavLink>
              </nav>
              <div className="navbar-actions">
                <Link to="/settings" className="user-chip">
                  <Avatar user={user} size="sm" />
                  <span>{user.name}</span>
                </Link>
                <button className="secondary" onClick={handleLogout}>Logout</button>
              </div>
            </div>

            {/* Hamburger — visible only on mobile */}
            <button
              className={`hamburger${menuOpen ? ' open' : ''}`}
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
            >
              <span />
              <span />
              <span />
            </button>

            {/* Mobile dropdown */}
            {menuOpen && (
              <div className="mobile-menu">
                <NavLink to="/goals" className="mobile-nav-link" onClick={closeMenu}>Goals</NavLink>
                <NavLink to="/quiz" className="mobile-nav-link" onClick={closeMenu}>Quiz</NavLink>
                <NavLink to="/files" className="mobile-nav-link" onClick={closeMenu}>Files</NavLink>
                <NavLink to="/leaderboard" className="mobile-nav-link" onClick={closeMenu}>Leaderboard</NavLink>
                <NavLink to="/people" className="mobile-nav-link" onClick={closeMenu}>People</NavLink>
                <NavLink to="/group-sessions" className="mobile-nav-link" onClick={closeMenu}>Groups</NavLink>
                <NavLink to="/messages" className="mobile-nav-link" onClick={closeMenu}>Messages</NavLink>
                <div className="mobile-menu-footer">
                  <Link to="/settings" className="user-chip" onClick={closeMenu}>
                    <Avatar user={user} size="sm" />
                    <span>{user.name}</span>
                  </Link>
                  <button className="secondary" onClick={handleLogout}>Logout</button>
                </div>
              </div>
            )}
          </>
        ) : (
          <nav className="navbar-actions">
            {location.pathname === '/login' ? (
              <Link to="/signup"><button>Sign up</button></Link>
            ) : location.pathname === '/signup' ? (
              <Link to="/login"><button>Log in</button></Link>
            ) : (
              <>
                <Link to="/login" className="nav-link">Log in</Link>
                <Link to="/signup"><button>Sign up</button></Link>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
