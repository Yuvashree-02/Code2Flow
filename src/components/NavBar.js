import React from 'react';
import { Link } from 'react-router-dom';

const NavBar = () => {
  return (
    <header style={styles.header}>
      <Link to="/" style={styles.brand}>Code2Flow 🚀</Link>
      <nav style={styles.nav}>
        <Link to="/editor?lang=python" style={styles.navLink}>Python</Link>
        <Link to="/editor?lang=javascript" style={styles.navLink}>JS</Link>
        <Link to="/editor?lang=java" style={styles.navLink}>Java</Link>
        <Link to="/editor?lang=c" style={styles.navLink}>C</Link>
        <Link to="/editor?lang=cpp" style={styles.navLink}>C++</Link>
        <Link to="/editor?lang=sql" style={styles.navLink}>SQL</Link>
        <Link to="/editor?lang=html" style={styles.navLink}>HTML/CSS</Link>
      </nav>
    </header>
  );
};

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '18px 36px',
    borderBottom: '1px solid #eee',
    background: '#fff'
  },
  brand: {
    fontWeight: '700',
    color: '#4b0082',
    fontSize: 20,
    textDecoration: 'none'
  },
  nav: {
    display: 'flex',
    gap: 12
  },
  navLink: {
    textDecoration: 'none',
    color: '#6b7280',
    fontSize: 14,
    padding: '8px 12px',
    borderRadius: 6,
    transition: 'all 0.2s'
  }
};

export default NavBar;