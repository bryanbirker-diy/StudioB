import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { COLORS, TEXTURES } from '../data/palette.js';

const GRID_SIZE = 20;
const HALF = GRID_SIZE / 2;
const DRAG_THRESHOLD_PX = 5;

function getColorHex(id) { return COLORS.find(c => c.id === id)?.hex ?? '#ffffff'; }
function getTextureProps(id) { return TEXTURES.find(t => t.id === id) ?? TEXTURES[0]; }
function posKey(p) { return `${p[0]},${p[1]},${p[2]}`; }

function clampGrid(p) {
  return [
    Math.max(0, Math.min(GRID_SIZE - 1, p[0])),
    Math.max(0, Math.min(GRID_SIZE - 1, p[1])),
    Math.max(0, Math.min(GRID_SIZE - 1, p[2])),
  ];
}

// Wireframe selection highlight rendered on top of a cube
function SelectionBox({ position }) {
  return (
    <mesh position={[position[0] + 0.5, position[1] + 0.5, position[2] + 0.5]}>
      <boxGeometry args={[1.04, 1.04, 1.04]} />
      <meshBasicMaterial color="#facc15" wireframe />
    </mesh>
  );
}

function GhostCube({ position, color, valid }) {
  return (
    <mesh position={[position[0] + 0.5, position[1] + 0.5, position[2] + 0.5]}>
      <boxGeometry args={[0.98, 0.98, 0.98]} />
      <meshStandardMaterial color={valid ? getColorHex(color) : '#ef4444'} transparent opacity={0.35} />
    </mesh>
  );
}

function Scene({ cubes, onPlace, onRemove, onMoveCubes, activeColor, activeTexture, tool, selected, onSelect, orbitRef }) {
  const { camera, gl, raycaster, scene } = useThree();
  const [ghost, setGhost] = useState(null);           // place-mode preview position
  const [dragGhosts, setDragGhosts] = useState(null); // array of {position, color, valid}
  const groundRef = useRef();

  // Drag state (all mutable, no re-renders during drag)
  const drag = useRef({
    active: false,
    pointerDown: null,   // { x, y } screen coords at mousedown
    cubePositions: [],   // positions of cubes being dragged
    cubeColors: [],      // their colors (for ghost rendering)
    anchorWorld: null,   // THREE.Vector3 on the drag plane where pointer first landed
    dragPlaneY: 0,       // Y level of the horizontal drag plane
    plane: new THREE.Plane(),
    ray: new THREE.Ray(),
    hit: new THREE.Vector3(),
  });

  const cubeSet = new Set(cubes.map(c => posKey(c.position)));

  // ---------- place-mode helpers ----------
  const getPlacementFromEvent = useCallback((e) => {
    if (!e.face) return null;
    if (e.object === groundRef.current) {
      const x = Math.floor(e.point.x);
      const z = Math.floor(e.point.z);
      if (x < 0 || x >= GRID_SIZE || z < 0 || z >= GRID_SIZE) return null;
      return [x, 0, z];
    }
    const pos = e.object.userData.position;
    if (!pos) return null;
    const n = e.face.normal.clone().applyQuaternion(e.object.quaternion).round();
    const np = clampGrid([pos[0] + n.x, pos[1] + n.y, pos[2] + n.z]);
    if (cubeSet.has(posKey(np))) return null;
    return np;
  }, [cubes]);

  // ---------- drag-move helpers ----------
  function startDrag(positions, colors, e) {
    const d = drag.current;
    d.active = true;
    d.cubePositions = positions;
    d.cubeColors = colors;
    const dragY = positions[0][1]; // horizontal plane at first cube's Y
    d.dragPlaneY = dragY;
    d.plane.set(new THREE.Vector3(0, 1, 0), -(dragY + 0.5));

    // find anchor: where on the plane the pointer is right now
    raycaster.setFromCamera(
      { x: (e.clientX / gl.domElement.clientWidth) * 2 - 1, y: -(e.clientY / gl.domElement.clientHeight) * 2 + 1 },
      camera
    );
    raycaster.ray.intersectPlane(d.plane, d.hit);
    d.anchorWorld = d.hit.clone();
    if (orbitRef.current) orbitRef.current.enabled = false;
  }

  function updateDrag(clientX, clientY) {
    const d = drag.current;
    if (!d.active) return;
    raycaster.setFromCamera(
      { x: (clientX / gl.domElement.clientWidth) * 2 - 1, y: -(clientY / gl.domElement.clientHeight) * 2 + 1 },
      camera
    );
    if (!raycaster.ray.intersectPlane(d.plane, d.hit)) return;

    const dx = Math.round(d.hit.x - d.anchorWorld.x);
    const dz = Math.round(d.hit.z - d.anchorWorld.z);
    if (dx === 0 && dz === 0) { setDragGhosts(null); return; }

    const ghosts = d.cubePositions.map((pos, i) => {
      const np = clampGrid([pos[0] + dx, d.dragPlaneY, pos[2] + dz]);
      // valid if not occupied by a non-moving cube
      const moving = new Set(d.cubePositions.map(posKey));
      const valid = !cubeSet.has(posKey(np)) || moving.has(posKey(np));
      return { position: np, color: d.cubeColors[i], valid };
    });
    setDragGhosts(ghosts);
  }

  function commitDrag() {
    const d = drag.current;
    if (!d.active) return;
    d.active = false;
    if (orbitRef.current) orbitRef.current.enabled = true;

    if (dragGhosts && dragGhosts.every(g => g.valid)) {
      const allDifferent = dragGhosts.some((g, i) => posKey(g.position) !== posKey(d.cubePositions[i]));
      if (allDifferent) {
        onMoveCubes(d.cubePositions.map((from, i) => ({ from, to: dragGhosts[i].position })));
      }
    }
    setDragGhosts(null);
  }

  // Canvas-level pointer events for drag tracking
  useEffect(() => {
    const el = gl.domElement;
    const onMove = (e) => updateDrag(e.clientX, e.clientY);
    const onUp = () => commitDrag();
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    return () => { el.removeEventListener('pointermove', onMove); el.removeEventListener('pointerup', onUp); };
  }, [dragGhosts, cubes]); // re-bind when dragGhosts/cubes change so commitDrag/updateDrag have fresh closures

  // ---------- cube interaction ----------
  const handleCubeDown = useCallback((e, cube) => {
    e.stopPropagation();
    if (tool === 'place') {
      if (e.button === 2) { onRemove(cube.position); return; }
      const p = getPlacementFromEvent(e);
      if (p) onPlace(p, activeColor, activeTexture);
      return;
    }
    // select mode
    if (e.button === 2) { onRemove(cube.position); return; }
    const k = posKey(cube.position);
    drag.current.pointerDown = { x: e.clientX, y: e.clientY };

    if (selected.has(k)) {
      // start potential drag of entire selection
      const selectedCubes = cubes.filter(c => selected.has(posKey(c.position)));
      startDrag(selectedCubes.map(c => c.position), selectedCubes.map(c => c.color), e);
    }
    // selection toggle happens on pointerUp if no drag occurred
    drag.current.pendingToggle = k;
  }, [tool, selected, cubes, activeColor, activeTexture]);

  const handleCubeUp = useCallback((e, cube) => {
    if (tool !== 'select') return;
    const d = drag.current;
    const wasDrag = d.active || (d.pointerDown && (
      Math.abs(e.clientX - d.pointerDown.x) > DRAG_THRESHOLD_PX ||
      Math.abs(e.clientY - d.pointerDown.y) > DRAG_THRESHOLD_PX
    ));
    if (!wasDrag && d.pendingToggle) {
      const k = posKey(cube.position);
      onSelect(k, e.shiftKey);
    }
    d.pendingToggle = null;
    d.pointerDown = null;
  }, [tool, onSelect]);

  const handleGroundDown = useCallback((e) => {
    e.stopPropagation();
    if (tool === 'select') {
      // click on empty ground deselects all
      if (!e.shiftKey) onSelect(null, false);
      return;
    }
    const p = getPlacementFromEvent(e);
    if (p) onPlace(p, activeColor, activeTexture);
  }, [tool, activeColor, activeTexture]);

  const handleGroundMove = useCallback((e) => {
    e.stopPropagation();
    if (tool !== 'place') { setGhost(null); return; }
    setGhost(getPlacementFromEvent(e));
  }, [tool]);

  return (
    <>
      {/* invisible ground plane */}
      <mesh
        ref={groundRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[HALF, 0, HALF]}
        userData={{ isGround: true }}
        onPointerMove={handleGroundMove}
        onPointerLeave={() => setGhost(null)}
        onPointerDown={handleGroundDown}
      >
        <planeGeometry args={[GRID_SIZE, GRID_SIZE]} />
        <meshStandardMaterial visible={false} />
      </mesh>

      {cubes.map((c) => {
        const k = posKey(c.position);
        const isSelected = selected.has(k);
        const tex = getTextureProps(c.texture);
        return (
          <mesh
            key={k}
            position={[c.position[0] + 0.5, c.position[1] + 0.5, c.position[2] + 0.5]}
            userData={{ position: c.position }}
            onPointerMove={(e) => { e.stopPropagation(); if (tool === 'place') setGhost(getPlacementFromEvent(e)); }}
            onPointerLeave={() => { if (tool === 'place') setGhost(null); }}
            onPointerDown={(e) => handleCubeDown(e, c)}
            onPointerUp={(e) => handleCubeUp(e, c)}
          >
            <boxGeometry args={[0.98, 0.98, 0.98]} />
            <meshStandardMaterial
              color={getColorHex(c.color)}
              roughness={tex.roughness}
              metalness={tex.metalness}
              emissive={isSelected ? '#facc15' : '#000000'}
              emissiveIntensity={isSelected ? 0.25 : 0}
            />
          </mesh>
        );
      })}

      {/* selection wireframe outlines */}
      {cubes.filter(c => selected.has(posKey(c.position))).map(c => (
        <SelectionBox key={'sel-' + posKey(c.position)} position={c.position} />
      ))}

      {/* place-mode ghost */}
      {tool === 'place' && ghost && <GhostCube position={ghost} color={activeColor} valid />}

      {/* drag-move ghosts */}
      {dragGhosts && dragGhosts.map((g, i) => (
        <GhostCube key={'dg-' + i} position={g.position} color={g.color} valid={g.valid} />
      ))}
    </>
  );
}

export default function VoxelScene({ cubes, onPlace, onRemove, onMoveCubes, activeColor, activeTexture, tool, selected, onSelect }) {
  const orbitRef = useRef();

  return (
    <Canvas
      camera={{ position: [HALF + 15, 15, HALF + 20], fov: 50 }}
      onContextMenu={(e) => e.preventDefault()}
      style={{ background: 'linear-gradient(180deg, #0f0f2e 0%, #1a1a3e 100%)' }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 20, 10]} intensity={1.2} castShadow />
      <directionalLight position={[-10, 10, -10]} intensity={0.3} />

      <Scene
        cubes={cubes}
        onPlace={onPlace}
        onRemove={onRemove}
        onMoveCubes={onMoveCubes}
        activeColor={activeColor}
        activeTexture={activeTexture}
        tool={tool}
        selected={selected}
        onSelect={onSelect}
        orbitRef={orbitRef}
      />

      <Grid
        args={[GRID_SIZE, GRID_SIZE]}
        position={[HALF, 0, HALF]}
        cellColor="#4c1d95"
        sectionColor="#7c3aed"
        sectionSize={5}
        fadeDistance={80}
        infiniteGrid={false}
      />

      <OrbitControls
        ref={orbitRef}
        target={[HALF, 3, HALF]}
        maxPolarAngle={Math.PI}
        minDistance={5}
        maxDistance={60}
        mouseButtons={{ LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN }}
      />
    </Canvas>
  );
}
