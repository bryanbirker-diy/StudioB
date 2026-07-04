// store.js — Our Chores  ·  Firestore-backed
// Falls back to localStorage if householdId isn't set yet.
// Family members live on the household doc (see firebase-auth.jsx helpers);
// this store handles the chores subcollection only.

const CHORES_KEY = 'ch_chores';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function choresRef(householdId) {
  return db.collection(`households/${householdId}/chores`);
}

// ─── Local cache ───────────────────────────────────────────────────────────

function loadChoresLocal() {
  try { return JSON.parse(localStorage.getItem(CHORES_KEY) || '[]'); }
  catch { return []; }
}
function saveChoresLocal(chores) {
  localStorage.setItem(CHORES_KEY, JSON.stringify(chores));
}

// ─── Firestore CRUD ────────────────────────────────────────────────────────

function subscribeChores(householdId, onUpdate) {
  if (!householdId) return () => {};
  return choresRef(householdId)
    .orderBy('createdAt', 'asc')
    .onSnapshot(
      snap => {
        const chores = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        saveChoresLocal(chores);
        onUpdate(chores);
      },
      err => console.error('chores snapshot error:', err)
    );
}

async function addChore(householdId, data) {
  const id = generateId();
  const chore = {
    ...data,
    id,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  };
  if (householdId) await choresRef(householdId).doc(id).set(chore);
  return chore;
}

async function updateChore(householdId, choreId, changes) {
  const update = { ...changes, updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
  if (householdId) await choresRef(householdId).doc(choreId).update(update);
  return update;
}

async function deleteChore(householdId, choreId) {
  if (householdId) await choresRef(householdId).doc(choreId).delete();
}
