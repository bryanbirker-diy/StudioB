import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const s = {
  nav: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 24px', height: '52px', background: '#1a1a2e',
    borderBottom: '2px solid #7c3aed', flexShrink: 0,
  },
  logo: {
    fontSize: '20px', fontWeight: 800, color: '#a78bfa',
    textDecoration: 'none', letterSpacing: '0.05em',
  },
  links: { display: 'flex', gap: '8px' },
  link: (active) => ({
    padding: '6px 16px', borderRadius: '6px', textDecoration: 'none',
    fontSize: '14px', fontWeight: 600, transition: 'all 0.15s',
    background: active ? '#7c3aed' : 'transparent',
    color: active ? '#fff' : '#a78bfa',
    border: `1px solid ${active ? '#7c3aed' : '#4c1d95'}`,
  }),
};

export default function Nav() {
  const { pathname } = useLocation();
  return (
    <nav style={s.nav}>
      <Link to="/" style={s.logo}>🧊 Cube Critic</Link>
      <div style={s.links}>
        <Link to="/" style={s.link(pathname === '/')}>Build</Link>
        <Link to="/gallery" style={s.link(pathname === '/gallery')}>Gallery</Link>
      </div>
    </nav>
  );
}
