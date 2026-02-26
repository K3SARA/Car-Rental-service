import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleToggle = () => setMenuOpen((open) => !open);
  const handleLinkClick = () => setMenuOpen(false);

  return (
    <>
      <nav className="nav">
        <button type="button" className="nav-toggle" onClick={handleToggle}>
          ☰ Menu
        </button>
        <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
          <NavLink to="/" onClick={handleLinkClick}>Dashboard</NavLink>
          <NavLink to="/vehicles" onClick={handleLinkClick}>Vehicles</NavLink>
          <NavLink to="/customers" onClick={handleLinkClick}>Customers</NavLink>
          <NavLink to="/bookings" onClick={handleLinkClick}>Bookings</NavLink>
          <NavLink to="/calendar" onClick={handleLinkClick}>Calendar</NavLink>
        </div>
        <span className="user">
          {user?.name || user?.email}
          <button type="button" className="btn btn-secondary" onClick={logout} style={{ marginLeft: '0.5rem' }}>
            Logout
          </button>
        </span>
      </nav>
      <main className="container">
        <Outlet />
      </main>
    </>
  );
}
