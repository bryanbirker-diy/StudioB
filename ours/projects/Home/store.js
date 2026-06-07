// store.js — Our Home  ·  Firestore-backed
// Falls back to localStorage if householdId isn't set yet.

const HOME_KEY = 'hm_projects';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function projectsRef(householdId) {
  return db.collection(`households/${householdId}/homeProjects`);
}

// ─── Local cache ───────────────────────────────────────────────────────────

function loadProjectsLocal() {
  try { return JSON.parse(localStorage.getItem(HOME_KEY) || '[]'); }
  catch { return []; }
}
function saveProjectsLocal(projects) {
  localStorage.setItem(HOME_KEY, JSON.stringify(projects));
}

// ─── Firestore CRUD ────────────────────────────────────────────────────────

function subscribeProjects(householdId, onUpdate) {
  if (!householdId) return () => {};
  return projectsRef(householdId)
    .orderBy('createdAt', 'asc')
    .onSnapshot(
      snap => {
        const projects = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        saveProjectsLocal(projects);
        onUpdate(projects);
      },
      err => console.error('homeProjects snapshot error:', err)
    );
}

async function addProject(householdId, data) {
  const id = generateId();
  const project = {
    ...data,
    id,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  };
  if (householdId) {
    await projectsRef(householdId).doc(id).set(project);
  }
  return project;
}

async function updateProject(householdId, projectId, changes) {
  const update = {
    ...changes,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  };
  if (householdId) {
    await projectsRef(householdId).doc(projectId).update(update);
  }
  return update;
}

async function deleteProject(householdId, projectId) {
  if (householdId) {
    await projectsRef(householdId).doc(projectId).delete();
  }
}
