// store.js — Our Money  ·  Firestore-backed

const MONEY_KEY = 'mn_expenses';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function expensesRef(householdId) {
  return db.collection(`households/${householdId}/expenses`);
}

function loadExpensesLocal() {
  try { return JSON.parse(localStorage.getItem(MONEY_KEY) || '[]'); }
  catch { return []; }
}
function saveExpensesLocal(expenses) {
  localStorage.setItem(MONEY_KEY, JSON.stringify(expenses));
}

function subscribeExpenses(householdId, onUpdate) {
  if (!householdId) return () => {};
  return expensesRef(householdId)
    .orderBy('createdAt', 'asc')
    .onSnapshot(
      snap => {
        const expenses = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        saveExpensesLocal(expenses);
        onUpdate(expenses);
      },
      err => console.error('expenses snapshot error:', err)
    );
}

async function addExpense(householdId, data) {
  const id = generateId();
  const expense = {
    ...data,
    id,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  };
  if (householdId) {
    await expensesRef(householdId).doc(id).set(expense);
  }
  return expense;
}

async function updateExpense(householdId, expenseId, changes) {
  const update = {
    ...changes,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  };
  if (householdId) {
    await expensesRef(householdId).doc(expenseId).update(update);
  }
  return update;
}

async function deleteExpense(householdId, expenseId) {
  if (householdId) {
    await expensesRef(householdId).doc(expenseId).delete();
  }
}

// ─── Budget (Where It Goes) ───────────────────────────────────────────────

const BUDGET_KEY = 'mn_budget';

function budgetDocRef(householdId) {
  return db.collection(`households/${householdId}/budget`).doc('default');
}

function loadBudgetLocal() {
  try { return JSON.parse(localStorage.getItem(BUDGET_KEY) || '[]'); }
  catch { return []; }
}
function saveBudgetLocal(cats) {
  localStorage.setItem(BUDGET_KEY, JSON.stringify(cats));
}

function subscribeBudget(householdId, onUpdate) {
  if (!householdId) return () => {};
  return budgetDocRef(householdId).onSnapshot(
    snap => {
      const cats = snap.exists ? (snap.data().categories || []) : [];
      saveBudgetLocal(cats);
      onUpdate(cats);
    },
    err => console.error('budget snapshot error:', err)
  );
}

async function saveBudget(householdId, categories) {
  saveBudgetLocal(categories);
  if (householdId) {
    await budgetDocRef(householdId).set({ categories });
  }
}
