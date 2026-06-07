import React, { useState, useRef, useEffect } from 'react';

const overlay = {
  position: 'fixed', inset: 0, zIndex: 1000,
  background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const card = {
  background: '#1a1a2e', border: '2px solid #7c3aed', borderRadius: '16px',
  padding: '28px 32px', width: '360px', display: 'flex', flexDirection: 'column', gap: '18px',
  boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
};
const inputStyle = {
  width: '100%', padding: '10px 14px', borderRadius: '8px',
  background: '#0f0f1a', border: '1px solid #4c1d95', color: '#f0f0f0',
  fontSize: '15px', outline: 'none', boxSizing: 'border-box',
};
const rowStyle = { display: 'flex', gap: '10px' };
const btn = (color, disabled = false) => ({
  flex: 1, padding: '10px 0', borderRadius: '9px', border: 'none',
  background: disabled ? '#2d2d4e' : color, color: disabled ? '#555' : '#fff',
  fontSize: '14px', fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer',
  transition: 'all 0.15s',
});

export default function SaveLoadModal({ mode, theme, onSave, onLoad, onClose }) {
  const [filename, setFilename] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef();
  const fileRef = useRef();

  useEffect(() => {
    if (mode === 'save') inputRef.current?.focus();
  }, [mode]);

  // Close on Escape
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const handleSave = () => {
    if (!filename.trim()) { setError('Please enter a file name.'); return; }
    onSave(filename.trim());
    onClose();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      await onLoad(file);
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={card}>
        <div style={{ fontSize: '18px', fontWeight: 800, color: '#e9d5ff' }}>
          {mode === 'save' ? '💾 Save Build' : '📂 Load Build'}
        </div>

        {mode === 'save' ? (
          <>
            <div>
              <div style={{ fontSize: '12px', color: '#a78bfa', marginBottom: '8px', fontWeight: 600 }}>
                File name
              </div>
              <input
                ref={inputRef}
                style={inputStyle}
                placeholder="e.g. my-dragon-v2"
                value={filename}
                onChange={e => { setFilename(e.target.value); setError(''); }}
                onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
                spellCheck={false}
              />
              <div style={{ fontSize: '11px', color: '#555', marginTop: '5px' }}>
                Saves as <strong style={{ color: '#7c3aed' }}>{(filename.trim() || 'my-build')}.json</strong>
              </div>
            </div>
            <div style={{ fontSize: '12px', color: '#666', lineHeight: 1.5 }}>
              Saves your current theme (<em style={{ color: '#a78bfa' }}>{theme || '—'}</em>) and all {' '}
              {/* cubeCount passed via label */} cubes to a file you can reload later.
            </div>
          </>
        ) : (
          <div style={{ fontSize: '13px', color: '#a78bfa', lineHeight: 1.7 }}>
            Pick a <strong>.json</strong> file you previously saved from Cube Critic.
            Your current build will be <strong style={{ color: '#ef4444' }}>replaced</strong> with the loaded one.
            <br /><br />
            <button
              style={{ ...btn('#7c3aed'), width: '100%', padding: '12px 0' }}
              onClick={() => fileRef.current?.click()}
            >
              📁 Choose File…
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>
        )}

        {error && (
          <div style={{ background: '#450a0a', border: '1px solid #b91c1c', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#fca5a5' }}>
            {error}
          </div>
        )}

        <div style={rowStyle}>
          {mode === 'save' && (
            <button style={btn('#16a34a', !filename.trim())} onClick={handleSave} disabled={!filename.trim()}>
              ⬇ Download
            </button>
          )}
          <button style={btn('#374151')} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
