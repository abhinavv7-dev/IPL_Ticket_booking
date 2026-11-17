import { useState } from 'react';

/**
 * Navbar Component
 * Demonstrates:
 * - Functional component structure with JSX syntax
 * - Flexbox alignment of logo and links
 * - Local state management using useState for mobile hamburger toggle
 */
export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(prev => !prev);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className="navbar-header">
      <nav className="navbar-nav">
        {/* Brand Logo */}
        <h2 className="navbar-logo">
          <span>🏏</span> IPL 2026
        </h2>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          className={`hamburger ${isMenuOpen ? 'active' : ''}`}
          onClick={toggleMenu}
          aria-label="Toggle navigation menu"
          aria-expanded={isMenuOpen}
        >
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </button>

        {/* Nav Links */}
        <ul className={`nav-links ${isMenuOpen ? 'nav-active' : ''}`}>
          <li>
            <a href="#matches" onClick={closeMenu}>Matches</a>
          </li>
          <li>
            <a href="#book-ticket" onClick={closeMenu}>Book Ticket</a>
          </li>
          <li>
            <a href="#my-bookings" onClick={closeMenu}>My Bookings</a>
          </li>
          <li>
            <a href="#guidelines" onClick={closeMenu}>Guidelines</a>
          </li>
        </ul>
      </nav>
    </header>
  );
}

