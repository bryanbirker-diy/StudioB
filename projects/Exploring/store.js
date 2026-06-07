// store.js — Our Exploring  ·  Firestore-backed
// Falls back to localStorage if called before auth is ready (offline / dev mode).

const EXPLORING_KEY = 'ex_trips'; // localStorage fallback key

// ─── ID generator (used client-side so we know the ID before Firestore write) ─

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ─── Firestore path helper ─────────────────────────────────────────────────

function tripsRef(householdId) {
  return db.collection(`households/${householdId}/trips`);
}

// ─── Local cache (used for optimistic UI) ─────────────────────────────────

function loadTripsLocal() {
  try { return JSON.parse(localStorage.getItem(EXPLORING_KEY) || '[]'); }
  catch { return []; }
}
function saveTripsLocal(trips) {
  localStorage.setItem(EXPLORING_KEY, JSON.stringify(trips));
}

// ─── Firestore CRUD ────────────────────────────────────────────────────────

// Subscribe to real-time updates. Returns unsubscribe fn.
// onUpdate(trips) called whenever Firestore changes.
function subscribeTrips(householdId, onUpdate) {
  if (!householdId) return () => {};
  return tripsRef(householdId)
    .orderBy('createdAt', 'asc')
    .onSnapshot(
      snap => {
        const trips = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        saveTripsLocal(trips); // keep local cache fresh
        onUpdate(trips);
      },
      err => console.error('trips snapshot error:', err)
    );
}

// Add a new trip — returns the trip with the real Firestore id
async function addTrip(householdId, tripData) {
  const id = generateId();
  const trip = {
    ...tripData,
    id,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  };
  if (householdId) {
    await tripsRef(householdId).doc(id).set(trip);
  }
  return trip;
}

// Update an existing trip
async function updateTrip(householdId, tripId, changes) {
  const update = {
    ...changes,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  };
  if (householdId) {
    await tripsRef(householdId).doc(tripId).update(update);
  }
  return update;
}

// Delete a trip
async function deleteTrip(householdId, tripId) {
  if (householdId) {
    await tripsRef(householdId).doc(tripId).delete();
  }
}
