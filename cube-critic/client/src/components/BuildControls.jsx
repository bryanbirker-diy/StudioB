import React from 'react';

const btn = (color = '#7c3aed', disabled = false) => ({
  padding: '8px 14px', borderRadius: '8px', cursor: disabled ? 'not-allowed' : 'pointer',
  fontSize: '13px', fontWeight: 700, border: 'none',
  background: disabled ? '#2d2d4e' : color,
  color: disabled ? '#555' : '#fff',
  transition: 'all 0.15s', opacity: disabled ? 0.5 : 1,
});

const modeBtn = (active) => ({
  flex: 1, padding: '8px 0', borderRadius: '8px', cursor: 'pointer',
  fontSize: '13px', fontWeight: 700,
  background: active ? '#7c3aed' : 'transparent',
  color: active ? '#fff' : '#a78bfa',
  border: `1px solid ${active ? '#7c3aed' : '#4c1d95'}`,
  transition: 'all 0.15s',
});

const divider = { height: '1px', background: '#2d2d4e', margin: '2px 0' };

export default function BuildControls({
  cubeCount, onUndo, onRedo, onClear, onSubmit, canUndo, canRedo, submitting,
  tool, onSetTool, selectedCount, onDeleteSelected, onSelectAll,
  onOpenSave, onOpenLoad,
}) {
  return (
    <div style={{
      position: 'absolute', top: '14px', right: '16px',
      display: 'flex', flexDirection: 'column', gap: '8px',
      background: 'rgba(15,15,30,0.92)', border: '1px solid #4c1d95',
      borderRadius: '12px', padding: '12px', backdropFilter: 'blur(8px)',
      minWidth: '168px',
    }}>
      <div style={{ fontSize: '12px', color: '#a78bfa', fontWeight: 700, textAlign: 'center' }}>
        {cubeCount} cube{cubeCount !== 1 ? 's' : ''}
      </div>

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: '6px' }}>
        <button style={modeBtn(tool === 'place')} onClick={() => onSetTool('place')} title="Place / Remove cubes">🧱 Place</button>
        <button style={modeBtn(tool === 'select')} onClick={() => onSetTool('select')} title="Select, move, delete (S)">⬛ Select</button>
      </div>

      {/* Select-mode actions */}
      {tool === 'select' && (
        <>
          <button
            style={btn('#1d4ed8', cubeCount === 0)}
            onClick={onSelectAll}
            disabled={cubeCount === 0}
            title="Select all cubes (Ctrl+A)"
          >
            ◻ Select All
          </button>
          <button
            style={btn('#b91c1c', selectedCount === 0)}
            onClick={onDeleteSelected}
            disabled={selectedCount === 0}
            title="Delete selected cubes (Delete / Backspace)"
          >
            🗑 Delete {selectedCount > 0 ? `(${selectedCount})` : ''}
          </button>
        </>
      )}

      <div style={divider} />

      {/* Undo / redo / clear */}
      <div style={{ display: 'flex', gap: '6px' }}>
        <button style={btn('#4c1d95', !canUndo)} onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)">↩</button>
        <button style={btn('#4c1d95', !canRedo)} onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Y)">↪</button>
        <button style={btn('#7f1d1d')} onClick={onClear} title="Clear all">✕</button>
      </div>

      <div style={divider} />

      {/* Save / Load */}
      <div style={{ display: 'flex', gap: '6px' }}>
        <button style={{ ...btn('#0f766e'), flex: 1 }} onClick={onOpenSave} title="Save build to file">💾 Save</button>
        <button style={{ ...btn('#0369a1'), flex: 1 }} onClick={onOpenLoad} title="Load build from file">📂 Load</button>
      </div>

      <button
        style={{ ...btn('#16a34a'), fontSize: '14px', padding: '10px 16px' }}
        onClick={onSubmit}
        disabled={submitting}
      >
        {submitting ? 'Submitting…' : '✓ Submit Build'}
      </button>

      <div style={{ fontSize: '10px', color: '#555', textAlign: 'center', lineHeight: 1.6 }}>
        {tool === 'place' ? (
          <>Left-click: place<br />Right-click: remove<br />Drag: orbit</>
        ) : (
          <>Click: select · Shift: multi<br />Ctrl+A: select all<br />Drag selected: move<br />Delete: remove</>
        )}
      </div>
    </div>
  );
}
