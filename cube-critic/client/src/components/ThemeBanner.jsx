import React from 'react';

export default function ThemeBanner({ theme }) {
  if (!theme) return null;
  return (
    <div style={{
      position: 'absolute', top: '14px', left: '50%', transform: 'translateX(-50%)',
      background: 'rgba(124,58,237,0.92)', backdropFilter: 'blur(8px)',
      border: '1px solid #a78bfa', borderRadius: '12px',
      padding: '8px 24px', textAlign: 'center', pointerEvents: 'none',
      boxShadow: '0 4px 20px rgba(124,58,237,0.4)',
    }}>
      <div style={{ fontSize: '11px', color: '#ddd6fe', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        This Round's Theme
      </div>
      <div style={{ fontSize: '20px', fontWeight: 800, color: '#fff', marginTop: '2px' }}>
        {theme}
      </div>
    </div>
  );
}
