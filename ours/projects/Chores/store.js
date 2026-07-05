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

// ─── Points ledger ───────────────────────────────────────────────────────────
// Append-only transactions; a member's balance is the sum of their deltas.
// entry: { id, memberId, delta, type:'earn'|'redeem'|'dock'|'adjust',
//          reason, choreId?, choreName?, rewardId?, rewardName?,
//          status?:'pending'|'given', by?, createdAt }

const LEDGER_KEY = 'ch_ledger';

function ledgerRef(householdId) {
  return db.collection(`households/${householdId}/pointsLedger`);
}

function loadLedgerLocal() {
  try { return JSON.parse(localStorage.getItem(LEDGER_KEY) || '[]'); }
  catch { return []; }
}
function saveLedgerLocal(entries) {
  localStorage.setItem(LEDGER_KEY, JSON.stringify(entries));
}

function subscribeLedger(householdId, onUpdate) {
  if (!householdId) return () => {};
  return ledgerRef(householdId)
    .orderBy('createdAt', 'asc')
    .onSnapshot(
      snap => {
        const entries = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        saveLedgerLocal(entries);
        onUpdate(entries);
      },
      err => console.error('ledger snapshot error:', err)
    );
}

async function addLedgerEntry(householdId, entry) {
  const id = generateId();
  const row = { ...entry, id, createdAt: firebase.firestore.FieldValue.serverTimestamp() };
  if (householdId) await ledgerRef(householdId).doc(id).set(row);
  return row;
}

async function updateLedgerEntry(householdId, entryId, changes) {
  if (householdId) await ledgerRef(householdId).doc(entryId).update(changes);
}

async function deleteLedgerEntry(householdId, entryId) {
  if (householdId) await ledgerRef(householdId).doc(entryId).delete();
}
