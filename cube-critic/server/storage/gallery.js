import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, '../../data/gallery.json');

async function ensureFile() {
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2));
  }
}

export async function loadGallery() {
  await ensureFile();
  const raw = await fs.readFile(DATA_FILE, 'utf-8');
  return JSON.parse(raw);
}

export async function saveGallery(builds) {
  await ensureFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(builds, null, 2));
}

export async function addBuild(build) {
  const builds = await loadGallery();
  builds.unshift(build);
  await saveGallery(builds);
  return build;
}

export async function getBuild(id) {
  const builds = await loadGallery();
  return builds.find(b => b.id === id) || null;
}

export async function updateBuild(id, updates) {
  const builds = await loadGallery();
  const idx = builds.findIndex(b => b.id === id);
  if (idx === -1) return null;
  builds[idx] = { ...builds[idx], ...updates };
  await saveGallery(builds);
  return builds[idx];
}
