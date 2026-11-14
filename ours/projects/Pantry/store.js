// store.js — localStorage helpers + Firestore layer + pure utility functions

const RECIPES_KEY = 'pm_recipes';
const PLAN_KEY    = 'pm_plan';
const PANTRY_KEY  = 'pm_pantry_v2';

function getRecipes() {
  try { return JSON.parse(localStorage.getItem(RECIPES_KEY)) || []; }
  catch { return []; }
}
function saveRecipes(recipes) {
  localStorage.setItem(RECIPES_KEY, JSON.stringify(recipes));
}

function getPlan() {
  try { return JSON.parse(localStorage.getItem(PLAN_KEY)) || null; }
  catch { return null; }
}
function savePlan(plan) {
  localStorage.setItem(PLAN_KEY, JSON.stringify(plan));
}
function clearPlan() {
  localStorage.removeItem(PLAN_KEY);
}

function getPantry() {
  try {
    return JSON.parse(localStorage.getItem(PANTRY_KEY)) ||
      { staples: [], onHand: [], extras: [] };
  }
  catch { return { staples: [], onHand: [], extras: [] }; }
}
function savePantry(pantry) {
  localStorage.setItem(PANTRY_KEY, JSON.stringify(pantry));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// Builds meal slots for a date range.
// meal_types: breakfast, lunch, dinner, dessert (4 per day).
function buildSlots(startDate, endDate) {
  const slots = [];
  const cur = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  while (cur <= end) {
    const date = cur.toISOString().slice(0, 10);
    for (const meal_type of ['breakfast', 'lunch', 'dinner', 'dessert']) {
      slots.push({ id: generateId(), date, meal_type, status: 'empty', recipe_id: null });
    }
    cur.setDate(cur.getDate() + 1);
  }
  return slots;
}

// Returns [{name, usedIn: string[], extra?: true}] sorted alphabetically.
// pantry: { staples: string[], onHand: string[], extras: string[] }
//   - staples: permanently excluded from recipe-ingredient auto-generation
//   - onHand:  handled at display level (checked-off items); NOT filtered here
//   - extras:  manually added to grocery list regardless of recipes
function generateGroceryList(plan, recipes, pantry = {}) {
  if (!plan) return [];
  const staples = new Set((pantry.staples || []).map(s => s.trim().toLowerCase()));
  const recipeMap = Object.fromEntries(recipes.map(r => [r.id, r]));
  const seen = new Map(); // normalised key -> { name, usedIn: Set }

  for (const slot of plan.slots) {
    if (slot.status !== 'recipe' || !slot.recipe_id) continue;
    const recipe = recipeMap[slot.recipe_id];
    if (!recipe) continue;
    for (const ing of (recipe.ingredients || [])) {
      const key = ing.trim().toLowerCase();
      if (!key || staples.has(key)) continue; // only exclude staples
      if (!seen.has(key)) seen.set(key, { name: ing.trim(), usedIn: new Set() });
      seen.get(key).usedIn.add(recipe.main_dish_name);
    }
  }

  const list = [...seen.values()]
    .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
    .map(v => ({ name: v.name, usedIn: [...v.usedIn] }));

  // Append extras (manual additions) not already from a recipe
  for (const item of (pantry.extras || [])) {
    const trimmed = item.trim();
    const key = trimmed.toLowerCase();
    if (!key || seen.has(key)) continue;
    list.push({ name: trimmed, usedIn: [], extra: true });
  }

  return list;
}

function formatDate(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });
}

function daysBetween(startDate, endDate) {
  const s = new Date(startDate + 'T00:00:00');
  const e = new Date(endDate   + 'T00:00:00');
  return Math.round((e - s) / 86400000) + 1;
}

// ─── Firestore layer ───────────────────────────────────────────────────────

// Tracks consecutive Firestore read/write failures across recipes/plan/pantry
// so the UI can show a "not backed up" indicator after 3 in a row, and clear
// it again the moment anything succeeds (PANTRY-SYNC-002).
let syncFailureCount = 0;
const syncFailureListeners = new Set();

function onSyncFailureChange(cb) {
  syncFailureListeners.add(cb);
  return () => syncFailureListeners.delete(cb);
}

function reportSyncResult(ok) {
  syncFailureCount = ok ? 0 : syncFailureCount + 1;
  const unbacked = syncFailureCount >= 3;
  syncFailureListeners.forEach(cb => cb(unbacked));
}

function recipesRef(householdId)  { return db.collection(`households/${householdId}/recipes`); }
function planDocRef(householdId)  { return db.doc(`households/${householdId}/meta/plan`); }
function pantryDocRef(householdId){ return db.doc(`households/${householdId}/meta/pantry`); }

// Real-time subscriptions — return unsubscribe fn
function subscribeRecipes(householdId, onUpdate) {
  if (!householdId) return () => {};
  return recipesRef(householdId).onSnapshot(
    snap => {
      reportSyncResult(true);
      const recipes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      saveRecipes(recipes);
      onUpdate(recipes);
    },
    err => { reportSyncResult(false); console.error('recipes snapshot:', err); }
  );
}

function subscribePlan(householdId, onUpdate) {
  if (!householdId) return () => {};
  return planDocRef(householdId).onSnapshot(
    snap => {
      reportSyncResult(true);
      const plan = snap.exists ? snap.data() : null;
      if (plan) savePlan(plan); else clearPlan();
      onUpdate(plan);
    },
    err => { reportSyncResult(false); console.error('plan snapshot:', err); }
  );
}

function subscribePantry(householdId, onUpdate) {
  if (!householdId) return () => {};
  return pantryDocRef(householdId).onSnapshot(
    snap => {
      reportSyncResult(true);
      const pantry = snap.exists
        ? snap.data()
        : { staples: [], onHand: [], extras: [] };
      savePantry(pantry);
      onUpdate(pantry);
    },
    err => { reportSyncResult(false); console.error('pantry snapshot:', err); }
  );
}

// CRUD — recipes
async function saveRecipeFirestore(householdId, recipe) {
  if (!householdId) return;
  try {
    await recipesRef(householdId).doc(recipe.id).set(
      { ...recipe, updatedAt: firebase.firestore.FieldValue.serverTimestamp() },
      { merge: true }
    );
    reportSyncResult(true);
  } catch (err) {
    reportSyncResult(false);
    throw err;
  }
}

async function deleteRecipeFirestore(householdId, recipeId) {
  if (!householdId) return;
  try {
    await recipesRef(householdId).doc(recipeId).delete();
    reportSyncResult(true);
  } catch (err) {
    reportSyncResult(false);
    throw err;
  }
}

// True if the doc's current remote updatedAt no longer matches what this
// device last synced — i.e. someone else wrote since, and the write we're
// about to make will silently overwrite that edit.
async function remoteChangedSince(ref, knownUpdatedAt) {
  if (!knownUpdatedAt) return false; // no baseline yet — nothing to compare against
  try {
    const snap = await ref.get();
    const remoteUpdatedAt = snap.exists ? snap.data().updatedAt : null;
    if (!remoteUpdatedAt) return false;
    return !remoteUpdatedAt.isEqual(knownUpdatedAt);
  } catch { return false; }
}

// CRUD — plan
async function savePlanFirestore(householdId, plan, knownUpdatedAt) {
  if (!householdId) return { overwrote: false };
  if (!plan) {
    await planDocRef(householdId).delete().catch(() => {});
    return { overwrote: false };
  }
  const overwrote = await remoteChangedSince(planDocRef(householdId), knownUpdatedAt);
  try {
    await planDocRef(householdId).set(
      { ...plan, updatedAt: firebase.firestore.FieldValue.serverTimestamp() },
      { merge: false } // full overwrite to keep slots in sync
    );
    reportSyncResult(true);
  } catch (err) {
    reportSyncResult(false);
    throw err;
  }
  return { overwrote };
}

// CRUD — pantry
async function savePantryFirestore(householdId, pantry, knownUpdatedAt) {
  if (!householdId) return { overwrote: false };
  const overwrote = await remoteChangedSince(pantryDocRef(householdId), knownUpdatedAt);
  try {
    await pantryDocRef(householdId).set(
      { ...pantry, updatedAt: firebase.firestore.FieldValue.serverTimestamp() },
      { merge: false }
    );
    reportSyncResult(true);
  } catch (err) {
    reportSyncResult(false);
    throw err;
  }
  return { overwrote };
}
