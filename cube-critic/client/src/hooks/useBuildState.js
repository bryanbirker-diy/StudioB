import { useState, useCallback, useRef } from 'react';

const key = pos => `${pos[0]},${pos[1]},${pos[2]}`;

export default function useBuildState() {
  const [cubes, setCubes] = useState([]);
  // history is kept in a ref so callbacks don't go stale
  const historyRef = useRef([[]]); // array of cube snapshots
  const indexRef = useRef(0);

  const commit = useCallback((next) => {
    const h = historyRef.current.slice(0, indexRef.current + 1);
    h.push(next);
    historyRef.current = h;
    indexRef.current = h.length - 1;
    setCubes(next);
  }, []);

  const addCube = useCallback((position, color, texture) => {
    setCubes(prev => {
      if (prev.some(c => key(c.position) === key(position))) return prev;
      const next = [...prev, { position, color, texture }];
      const h = historyRef.current.slice(0, indexRef.current + 1);
      h.push(next);
      historyRef.current = h;
      indexRef.current = h.length - 1;
      return next;
    });
  }, []);

  const removeCube = useCallback((position) => {
    setCubes(prev => {
      const next = prev.filter(c => key(c.position) !== key(position));
      const h = historyRef.current.slice(0, indexRef.current + 1);
      h.push(next);
      historyRef.current = h;
      indexRef.current = h.length - 1;
      return next;
    });
  }, []);

  // Delete a set of positions (selected cubes)
  const deleteCubes = useCallback((positions) => {
    const posKeys = new Set(positions.map(p => key(p)));
    setCubes(prev => {
      const next = prev.filter(c => !posKeys.has(key(c.position)));
      const h = historyRef.current.slice(0, indexRef.current + 1);
      h.push(next);
      historyRef.current = h;
      indexRef.current = h.length - 1;
      return next;
    });
  }, []);

  // Move cubes: moves = [{ from: [x,y,z], to: [x,y,z] }, ...]
  const moveCubes = useCallback((moves) => {
    setCubes(prev => {
      const fromKeys = new Set(moves.map(m => key(m.from)));
      const toKeys = new Set(moves.map(m => key(m.to)));
      // Remove occupied targets that aren't also being moved away from
      const blocked = prev.filter(c => toKeys.has(key(c.position)) && !fromKeys.has(key(c.position)));
      if (blocked.length > 0) return prev; // collision — abort

      const moveMap = new Map(moves.map(m => [key(m.from), m.to]));
      const next = prev.map(c => {
        const newPos = moveMap.get(key(c.position));
        return newPos ? { ...c, position: newPos } : c;
      });
      const h = historyRef.current.slice(0, indexRef.current + 1);
      h.push(next);
      historyRef.current = h;
      indexRef.current = h.length - 1;
      return next;
    });
  }, []);

  // Replace entire build (e.g. from a loaded file) — committed to history
  const loadCubes = useCallback((newCubes) => {
    commit(newCubes);
  }, [commit]);

  const undo = useCallback(() => {
    const i = indexRef.current;
    if (i <= 0) return;
    indexRef.current = i - 1;
    setCubes(historyRef.current[i - 1]);
  }, []);

  const redo = useCallback(() => {
    const i = indexRef.current;
    if (i >= historyRef.current.length - 1) return;
    indexRef.current = i + 1;
    setCubes(historyRef.current[i + 1]);
  }, []);

  const clearBuild = useCallback(() => {
    commit([]);
  }, [commit]);

  const canUndo = () => indexRef.current > 0;
  const canRedo = () => indexRef.current < historyRef.current.length - 1;

  return { cubes, addCube, removeCube, deleteCubes, moveCubes, loadCubes, undo, redo, clearBuild, canUndo, canRedo };
}
