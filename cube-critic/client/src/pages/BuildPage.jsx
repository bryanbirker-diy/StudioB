import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import VoxelScene from '../scenes/VoxelScene.jsx';
import Toolbar from '../components/Toolbar.jsx';
import ThemeBanner from '../components/ThemeBanner.jsx';
import BuildControls from '../components/BuildControls.jsx';
import SaveLoadModal from '../components/SaveLoadModal.jsx';
import useBuildState from '../hooks/useBuildState.js';
import { saveBuildToFile, parseBuildFile } from '../utils/saveLoad.js';

function posKey(p) { return `${p[0]},${p[1]},${p[2]}`; }

export default function BuildPage() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState('');
  const [activeColor, setActiveColor] = useState('blue');
  const [activeTexture, setActiveTexture] = useState('solid');
  const [submitting, setSubmitting] = useState(false);
  const [tool, setTool] = useState('place');
  const [selected, setSelected] = useState(new Set());
  const [modal, setModal] = useState(null); // null | 'save' | 'load'

  const { cubes, addCube, removeCube, deleteCubes, moveCubes, loadCubes, undo, redo, clearBuild, canUndo, canRedo } = useBuildState();

  useEffect(() => {
    fetch('/api/themes/random')
      .then(r => r.json())
      .then(d => setTheme(d.theme))
      .catch(() => setTheme('Mystery Object'));
  }, []);

  const handleSetTool = useCallback((t) => {
    setTool(t);
    if (t === 'place') setSelected(new Set());
  }, []);

  const handleSelect = useCallback((key, shift) => {
    if (key === null) { setSelected(new Set()); return; }
    setSelected(prev => {
      const next = new Set(prev);
      if (shift) {
        next.has(key) ? next.delete(key) : next.add(key);
      } else {
        const alreadyOnly = next.size === 1 && next.has(key);
        next.clear();
        if (!alreadyOnly) next.add(key);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelected(new Set(cubes.map(c => posKey(c.position))));
  }, [cubes]);

  const handleDeleteSelected = useCallback(() => {
    const positions = cubes.filter(c => selected.has(posKey(c.position))).map(c => c.position);
    deleteCubes(positions);
    setSelected(new Set());
  }, [cubes, selected, deleteCubes]);

  const handleMoveCubes = useCallback((moves) => {
    moveCubes(moves);
    setSelected(new Set(moves.map(m => posKey(m.to))));
  }, [moveCubes]);

  // Save: download named JSON
  const handleSave = useCallback((filename) => {
    saveBuildToFile(filename, theme, cubes);
  }, [theme, cubes]);

  // Load: parse file, replace build
  const handleLoad = useCallback(async (file) => {
    const data = await parseBuildFile(file); // throws on bad file
    loadCubes(data.cubes);
    if (data.theme) setTheme(data.theme);
    setSelected(new Set());
    setTool('place');
  }, [loadCubes]);

  useEffect(() => {
    const onKey = (e) => {
      // Don't steal shortcuts when modal is open or typing in an input
      if (modal) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) { e.preventDefault(); redo(); }
      if (e.key === 's' && !e.ctrlKey && !e.metaKey) { handleSetTool(tool === 'select' ? 'place' : 'select'); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        if (tool !== 'select') handleSetTool('select');
        handleSelectAll();
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && tool === 'select' && selected.size > 0) {
        e.preventDefault();
        handleDeleteSelected();
      }
      if (e.key === 'Escape') {
        if (tool === 'select') setSelected(new Set());
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo, tool, selected, modal, handleDeleteSelected, handleSetTool, handleSelectAll]);

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/builds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme, cubes }),
      });
      const build = await res.json();
      navigate(`/review/${build.id}`);
    } catch {
      alert('Failed to submit. Is the server running?');
      setSubmitting(false);
    }
  }, [theme, cubes, navigate]);

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <VoxelScene
        cubes={cubes}
        onPlace={addCube}
        onRemove={removeCube}
        onMoveCubes={handleMoveCubes}
        activeColor={activeColor}
        activeTexture={activeTexture}
        tool={tool}
        selected={selected}
        onSelect={handleSelect}
      />
      <ThemeBanner theme={theme} />
      <BuildControls
        cubeCount={cubes.length}
        onUndo={undo}
        onRedo={redo}
        onClear={clearBuild}
        onSubmit={handleSubmit}
        canUndo={canUndo}
        canRedo={canRedo}
        submitting={submitting}
        tool={tool}
        onSetTool={handleSetTool}
        selectedCount={selected.size}
        onDeleteSelected={handleDeleteSelected}
        onSelectAll={handleSelectAll}
        onOpenSave={() => setModal('save')}
        onOpenLoad={() => setModal('load')}
      />
      {tool === 'place' && (
        <Toolbar
          activeColor={activeColor}
          setActiveColor={setActiveColor}
          activeTexture={activeTexture}
          setActiveTexture={setActiveTexture}
        />
      )}
      {modal && (
        <SaveLoadModal
          mode={modal}
          theme={theme}
          onSave={handleSave}
          onLoad={handleLoad}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
