import React from 'react';
import { COLORS, TEXTURES } from '../data/palette.js';

const s = {
  wrap: {
    position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
    background: 'rgba(15,15,30,0.92)', border: '1px solid #4c1d95',
    borderRadius: '14px', padding: '14px 18px', backdropFilter: 'blur(8px)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
  },
  row: { display: 'flex', gap: '6px', alignItems: 'center' },
  label: { fontSize: '11px', color: '#a78bfa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', width: '60px' },
  swatch: (color, active) => ({
    width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer',
    background: color,
    border: active ? '3px solid #fff' : '2px solid transparent',
    boxShadow: active ? `0 0 8px ${color}` : 'none',
    transition: 'all 0.1s',
  }),
  texBtn: (active) => ({
    padding: '4px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
    background: active ? '#7c3aed' : '#1e1e3f', color: active ? '#fff' : '#a78bfa',
    border: `1px solid ${active ? '#7c3aed' : '#4c1d95'}`, transition: 'all 0.15s',
  }),
};

export default function Toolbar({ activeColor, setActiveColor, activeTexture, setActiveTexture }) {
  return (
    <div style={s.wrap}>
      <div style={s.row}>
        <span style={s.label}>Color</span>
        {COLORS.map(c => (
          <div
            key={c.id}
            title={c.label}
            style={s.swatch(c.hex, activeColor === c.id)}
            onClick={() => setActiveColor(c.id)}
          />
        ))}
      </div>
      <div style={s.row}>
        <span style={s.label}>Material</span>
        {TEXTURES.map(t => (
          <button
            key={t.id}
            style={s.texBtn(activeTexture === t.id)}
            onClick={() => setActiveTexture(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
