// app.jsx — Pantry Meal Planner (all components)

// ─── Auth import ──────────────────────────────────────────────
const { AuthProvider: PantryAuthProvider, useAuth: usePantryAuth } = window._oursAuth;

// ── TopBar ────────────────────────────────────────────────────
function TopBar({ onOpenRecipes }) {
  return (
    <header className="app-topbar">
      <a href="../../" style={{
        fontFamily: '"Cormorant Garamond", Garamond, serif',
        fontWeight: 300, fontSize: 15,
        color: 'var(--clay)', textDecoration: 'none',
        letterSpacing: '-0.01em', flexShrink: 0, opacity: 0.75,
      }} title="Back to ours">← ours</a>
      <div className="brand" style={{ flex: 1 }}>
        <span className="brand-mark" />
        Our Pantry
      </div>
      <button className="btn btn-clay btn-sm" onClick={onOpenRecipes} style={{ flexShrink: 0 }}>
        Manage Recipes
      </button>
    </header>
  );
}

// ── BottomNav (pill style) ────────────────────────────────────
const TABS = [
  { id: 'plan',    label: 'Plan',    icon: '📅' },
  { id: 'grocery', label: 'Grocery', icon: '🛒' },
  { id: 'pantry',  label: 'Pantry',  icon: '🌿' },
  { id: 'prepare', label: 'Prepare', icon: '✅' },
];

// ── WorkflowBreadcrumb ─────────────────────────────────────────
const WORKFLOW_STEPS  = ['plan', 'grocery', 'pantry', 'prepare'];
const WORKFLOW_LABELS = { plan: 'Plan', grocery: 'Grocery', pantry: 'Pantry', prepare: 'Prepare' };

function WorkflowBreadcrumb({ current }) {
  const idx = WORKFLOW_STEPS.indexOf(current);
  if (idx === -1) return null;
  return (
    <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.08em',
      color: 'var(--ink-fade)', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 16 }}>
      {WORKFLOW_STEPS.map((step, i) => (
        <React.Fragment key={step}>
          {i > 0 && <span style={{ opacity: 0.4 }}>›</span>}
          <span style={{
            color: i === idx ? 'var(--clay)' : i < idx ? 'var(--ink-soft)' : 'var(--ink-fade)',
            fontWeight: i === idx ? 700 : 400,
            textTransform: 'uppercase',
          }}>{WORKFLOW_LABELS[step]}</span>
        </React.Fragment>
      ))}
    </div>
  );
}

function BottomNav({ view, setView }) {
  return (
    <nav className="bottom-nav">
      {TABS.map(t => (
        <button key={t.id}
          className={`bottom-tab${view === t.id ? ' active' : ''}`}
          onClick={() => setView(t.id)}>
          <span className="tab-icon">{t.icon}</span>
          {t.label}
        </button>
      ))}
    </nav>
  );
}

// ── DateField ─────────────────────────────────────────────────
const DOW_SHORT  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MON_SHORT  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAY_LETTER = ['M','T','W','T','F','S','S'];

function fmtDateDisplay(iso) {
  if (!iso) return '';
  const [,m,d] = iso.split('-').map(Number);
  const dow = new Date(iso + 'T00:00:00').getDay();
  return `${DOW_SHORT[dow]} · ${MON_SHORT[m-1]} ${d}`;
}

function DateField({ label, value, onChange, min }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: 'var(--ink-fade)', marginBottom: 5 }}>
        {label}
      </div>
      <div style={{ position: 'relative' }}>
        <div style={{
          border: '1.5px solid var(--rule)',
          borderRadius: '6px 8px 5px 7px',
          padding: '11px 14px',
          background: 'rgba(255,255,255,0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontFamily: 'var(--pen)', fontSize: 15,
          color: value ? 'var(--ink)' : 'var(--ink-fade)',
          pointerEvents: 'none', userSelect: 'none',
        }}>
          <span>{value ? fmtDateDisplay(value) : 'Pick a date…'}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.4, flexShrink: 0 }}>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <input type="date" value={value} min={min} onChange={onChange}
          style={{
            position: 'absolute', inset: 0, opacity: 0,
            cursor: 'pointer', width: '100%', height: '100%',
            fontSize: 16,
          }}
        />
      </div>
    </div>
  );
}

// ── CalendarMiniPreview ────────────────────────────────────────
function CalendarMiniPreview({ start, end }) {
  const s = new Date(start + 'T00:00:00');
  const year  = s.getFullYear();
  const month = s.getMonth();

  const firstDOW      = new Date(year, month, 1).getDay();
  const adjustedFirst = (firstDOW + 6) % 7;
  const daysInMonth   = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < adjustedFirst; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const inRange = iso >= start && iso <= end;
    cells.push({ d, iso, inRange, isStart: iso === start, isEnd: iso === end });
  }

  const numDays = daysBetween(start, end);

  return (
    <div style={{
      border: '1.5px solid var(--rule-soft)',
      borderRadius: '8px 10px 7px 9px',
      padding: '14px 14px 12px',
      background: 'rgba(255,255,255,0.45)',
      marginTop: 14,
    }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em',
        textTransform: 'uppercase', color: 'var(--ink-fade)', marginBottom: 10 }}>
        Preview
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 1, marginBottom: 3 }}>
        {DAY_LETTER.map((n, i) => (
          <div key={i} style={{ fontFamily: 'var(--mono)', fontSize: 9, textAlign: 'center',
            color: 'var(--ink-fade)', textTransform: 'uppercase', padding: '1px 0' }}>{n}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 1 }}>
        {cells.map((cell, i) => {
          if (!cell) return <div key={`e${i}`} style={{ height: 26 }} />;
          const isEndpoint = cell.isStart || cell.isEnd;
          const bg    = isEndpoint ? 'var(--clay)' : cell.inRange ? 'rgba(195,145,105,0.22)' : 'transparent';
          const color = isEndpoint ? '#fdf6ec' : cell.inRange ? 'var(--brown)' : 'var(--ink-fade)';
          const br    = cell.isStart && cell.isEnd ? '50%'
            : cell.isStart ? '50% 0 0 50%' : cell.isEnd ? '0 50% 50% 0'
            : cell.inRange ? '0' : '4px';
          return (
            <div key={cell.iso} style={{
              height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--mono)', fontSize: 11,
              background: bg, color, fontWeight: isEndpoint ? 700 : 400, borderRadius: br,
            }}>{cell.d}</div>
          );
        })}
      </div>
      <div style={{
        fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-soft)',
        marginTop: 10, textAlign: 'center',
        borderTop: '1px solid var(--rule-soft)', paddingTop: 8,
      }}>
        {numDays} day{numDays !== 1 ? 's' : ''} · {numDays * 3} meals · {numDays} dessert slot{numDays !== 1 ? 's' : ''}
      </div>
    </div>
  );
}

// ── DateRangePicker ───────────────────────────────────────────
function DateRangePicker({ onStart, existingPlan }) {
  const today = new Date().toISOString().slice(0, 10);
  const [start, setStart]           = React.useState(existingPlan ? existingPlan.start_date : today);
  const [end,   setEnd]             = React.useState(existingPlan ? existingPlan.end_date   : '');
  const [error, setError]           = React.useState('');
  const [showConfirm, setShowConfirm] = React.useState(false);

  function setQuick(days) {
    const s = new Date(today + 'T00:00:00');
    const e = new Date(s);
    e.setDate(s.getDate() + days - 1);
    setStart(s.toISOString().slice(0, 10));
    setEnd(e.toISOString().slice(0, 10));
    setError('');
  }

  const numDays = React.useMemo(() => {
    if (!start || !end || end < start) return null;
    return daysBetween(start, end);
  }, [start, end]);

  function tryStart() {
    if (!start || !end)  { setError('Pick a start and end date.'); return; }
    if (end < start)     { setError('End date must be after start.'); return; }
    setError('');
    if (existingPlan) { setShowConfirm(true); } else { onStart(start, end); }
  }

  return (
    <div style={{ maxWidth: 420, margin: '0 auto', padding: '28px 20px 48px' }}>
      <div className="h1 underline-sketch" style={{ display: 'inline-block', fontSize: 32, marginBottom: 6 }}>
        Plan a stretch.
      </div>
      <div style={{ fontFamily: 'var(--pen)', fontSize: 15, color: 'var(--ink-soft)', marginBottom: 22, lineHeight: 1.4 }}>
        Pick a range. We'll build the calendar.
      </div>

      <DateField label="Start" value={start}
        onChange={e => { setStart(e.target.value); setError(''); }} />
      <DateField label="End" value={end} min={start}
        onChange={e => { setEnd(e.target.value); setError(''); }} />

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 2, marginBottom: 4 }}>
        {[[7,'1 week'],[3,'3 days'],[14,'2 weeks']].map(([d, label]) => (
          <button key={d}
            className={`chip${numDays === d ? ' chip-brown' : ''}`}
            style={{ cursor: 'pointer', padding: '4px 13px', fontSize: 12 }}
            onClick={() => setQuick(d)}>
            {label}
          </button>
        ))}
        <button className="chip"
          style={{ cursor: 'pointer', padding: '4px 13px', fontSize: 12, borderStyle: 'dashed' }}
          onClick={() => { setStart(today); setEnd(''); }}>
          custom
        </button>
      </div>

      {error && (
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--terracotta)', marginTop: 6 }}>
          {error}
        </div>
      )}

      {start && end && end >= start && (
        <CalendarMiniPreview start={start} end={end} />
      )}

      <button className="btn btn-clay btn-lg"
        style={{ width: '100%', justifyContent: 'center', marginTop: 20, fontSize: 15 }}
        onClick={tryStart}>
        Build our calendar →
      </button>

      {existingPlan && (
        <button className="btn btn-ghost" style={{ marginTop: 10, width: '100%' }}
          onClick={() => onStart(null, null, true)}>
          ← Back to current plan
        </button>
      )}

      {showConfirm && (
        <div className="modal-backdrop" onClick={() => setShowConfirm(false)}>
          <div className="modal-sheet" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div className="h3" style={{ marginBottom: 8 }}>Replace current plan?</div>
            <div style={{ color: 'var(--ink-soft)', marginBottom: 20, lineHeight: 1.4, fontSize: 14 }}>
              Your current plan will be cleared. Your saved recipes stay.
            </div>
            <div className="row" style={{ gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => setShowConfirm(false)}>Cancel</button>
              <button className="btn btn-terracotta" onClick={() => { setShowConfirm(false); onStart(start, end); }}>
                Yes, start fresh
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── SlotSheet ─────────────────────────────────────────────────
function SlotSheet({ slot, recipes, plan, onAssign, onClose }) {
  const isDessert = slot.meal_type === 'dessert';

  const [mode,       setMode]       = React.useState(isDessert ? 'pick-recipe' : 'menu');
  const [search,     setSearch]     = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState(isDessert ? 'dessert' : 'meal');
  const [outLabel,   setOutLabel]   = React.useState('');
  const searchRef   = React.useRef(null);
  const outLabelRef = React.useRef(null);

  React.useEffect(() => {
    if (mode === 'going-out' && outLabelRef.current) outLabelRef.current.focus();
  }, [mode]);

  // Smart sort: ingredient overlap with already-planned meals
  const planIngredients = React.useMemo(() => {
    const set = new Set();
    if (!plan) return set;
    for (const s of plan.slots) {
      if (s.id === slot.id || s.status !== 'recipe' || !s.recipe_id) continue;
      const r = recipes.find(r => r.id === s.recipe_id);
      if (!r) continue;
      for (const ing of (r.ingredients || [])) set.add(ing.trim().toLowerCase());
    }
    return set;
  }, [plan, slot, recipes]);

  const filtered = React.useMemo(() => {
    const list = recipes.filter(r =>
      (r.type || 'meal') === typeFilter &&
      r.main_dish_name.toLowerCase().includes(search.toLowerCase())
    );
    list.sort((a, b) => {
      const aS = (a.ingredients || []).filter(i => planIngredients.has(i.trim().toLowerCase())).length;
      const bS = (b.ingredients || []).filter(i => planIngredients.has(i.trim().toLowerCase())).length;
      if (bS !== aS) return bS - aS;
      return a.main_dish_name.localeCompare(b.main_dish_name);
    });
    return list;
  }, [recipes, search, typeFilter, planIngredients]);

  const hasOverlap = planIngredients.size > 0 &&
    filtered.some(r => (r.ingredients || []).some(i => planIngredients.has(i.trim().toLowerCase())));

  const MEAL_FULL = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', dessert: 'Dessert' };

  function assign(status, recipe_id = null, label = '') {
    onAssign(slot.id, status, recipe_id, label);
    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>

        {/* Shared header — ✕ always right; ← back below it in going-out mode */}
        <div className="spread" style={{ marginBottom: 4 }}>
          <span className="eyebrow">{formatDate(slot.date)} · {MEAL_FULL[slot.meal_type]}</span>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <button className="btn btn-sm btn-ghost" onClick={onClose}
              style={{ padding: '0 8px', fontSize: 16 }}>✕</button>
            {mode === 'going-out' && (
              <button className="btn btn-sm btn-ghost" onClick={() => setMode('menu')}
                style={{ fontSize: 11, padding: '1px 8px' }}>← back</button>
            )}
          </div>
        </div>

        {/* ── Main menu ── */}
        {mode === 'menu' && (
          <>
            <div className="h2 underline-sketch" style={{ display: 'inline-block', marginBottom: 16 }}>
              Fill this slot
            </div>
            <div className="col" style={{ gap: 8 }}>
              <button className="btn"
                style={{ width: '100%', justifyContent: 'flex-start', padding: '10px 14px', gap: 12 }}
                onClick={() => {
                  if (recipes.filter(r => (r.type || 'meal') !== 'dessert').length === 0)
                    alert('No recipes yet — add one from the Recipe tab first.');
                  else { setTypeFilter('meal'); setMode('pick-recipe'); }
                }}>
                <span style={{ fontSize: 22 }}>🍲</span>
                <div style={{ textAlign: 'left' }}>
                  <div className="h3" style={{ fontSize: 15 }}>Pick a recipe</div>
                  <div className="note">from your library · {recipes.filter(r => (r.type||'meal') !== 'dessert').length} saved</div>
                </div>
              </button>

              <button className="btn btn-terracotta"
                style={{ width: '100%', justifyContent: 'flex-start', padding: '10px 14px', gap: 12 }}
                onClick={() => { setOutLabel(''); setMode('going-out'); }}>
                <span style={{ fontSize: 22 }}>🎉</span>
                <div style={{ textAlign: 'left' }}>
                  <div className="h3" style={{ fontSize: 15, color: 'inherit' }}>Going out</div>
                  <div className="note" style={{ color: 'rgba(253,246,236,0.75)' }}>plans, events, eating out · no groceries</div>
                </div>
              </button>

              <button className="btn btn-olive"
                style={{ width: '100%', justifyContent: 'flex-start', padding: '10px 14px', gap: 12 }}
                onClick={() => assign('wing_it')}>
                <span style={{ fontSize: 22 }}>🤷</span>
                <div style={{ textAlign: 'left' }}>
                  <div className="h3" style={{ fontSize: 15, color: 'inherit' }}>Wing it</div>
                  <div className="note" style={{ color: 'rgba(247,245,230,0.8)' }}>no plan · no groceries</div>
                </div>
              </button>
            </div>
            {slot.status !== 'empty' && (
              <button className="btn btn-sm btn-ghost" style={{ marginTop: 14, width: '100%' }}
                onClick={() => assign('empty')}>
                Clear this slot
              </button>
            )}
          </>
        )}

        {/* ── Recipe picker ── */}
        {mode === 'pick-recipe' && (
          <>
            <div className="row" style={{ gap: 10, marginBottom: 12 }}>
              {isDessert ? (
                <>
                  <div className="h3">🍰 Add a dessert</div>
                  <div style={{ flex: 1 }} />
                  {slot.status !== 'empty' && (
                    <button className="btn btn-sm btn-ghost" onClick={() => assign('empty')}>Clear</button>
                  )}
                </>
              ) : (
                <>
                  <button className="btn btn-sm btn-ghost"
                    onClick={() => { setMode('menu'); setSearch(''); }}>← back</button>
                  <div className="h3">Choose a recipe</div>
                </>
              )}
            </div>

            {!isDessert && (
              <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                {[['meal','Meals'],['dessert','Desserts'],['party_trick','Party Tricks']].map(([t, l]) => (
                  <button key={t}
                    className={`chip${typeFilter === t ? ' chip-brown' : ''}`}
                    style={{ cursor: 'pointer', padding: '3px 11px', fontSize: 11 }}
                    onClick={() => { setTypeFilter(t); setSearch(''); }}>
                    {l}
                  </button>
                ))}
              </div>
            )}

            <input ref={searchRef} type="text" className="text-input" placeholder="Search…"
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ marginBottom: 8 }} />

            {hasOverlap && (
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--brown)',
                marginBottom: 8, opacity: 0.85 }}>
                ✦ Sorted by ingredient overlap with your plan
              </div>
            )}

            <div className="col" style={{ gap: 6, maxHeight: 'min(300px, 40dvh)', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
              {filtered.length === 0 && (
                <div className="note" style={{ textAlign: 'center', padding: '24px 0' }}>
                  {recipes.filter(r => (r.type || 'meal') === typeFilter).length === 0
                    ? `No ${typeFilter === 'party_trick' ? 'party tricks' : typeFilter + 's'} saved yet.`
                    : 'No recipes match.'}
                </div>
              )}
              {filtered.map(r => {
                const score = (r.ingredients || []).filter(i => planIngredients.has(i.trim().toLowerCase())).length;
                return (
                  <button key={r.id} className="btn"
                    style={{ justifyContent: 'flex-start', gap: 10, textAlign: 'left', padding: '10px 12px' }}
                    onClick={() => assign('recipe', r.id)}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{r.main_dish_name}</div>
                      {r.side_dishes && r.side_dishes.length > 0 && (
                        <div className="note" style={{ marginTop: 2 }}>{r.side_dishes.join(' · ')}</div>
                      )}
                    </div>
                    {score > 0 && (
                      <span style={{
                        fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--brown)',
                        background: 'rgba(138,111,78,0.12)', padding: '2px 7px',
                        borderRadius: 8, flexShrink: 0, whiteSpace: 'nowrap',
                      }}>{score} shared</span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* ── Going out ── */}
        {mode === 'going-out' && (
          <>
            <div className="h2 underline-sketch" style={{ display: 'inline-block', marginBottom: 16 }}>
              Care to share?
            </div>
            <input ref={outLabelRef} type="text" className="text-input"
              value={outLabel} onChange={e => setOutLabel(e.target.value)}
              placeholder="e.g. Ang's Birthday, Going to Jane's…"
              onKeyDown={e => e.key === 'Enter' && assign('going_out', null, outLabel)}
              style={{ marginBottom: 12 }} />
            <div style={{ marginBottom: 18, lineHeight: 1.5 }}>
              <span style={{ fontFamily: 'var(--pen)', fontSize: 15, fontWeight: 700, color: 'var(--clay)' }}>
                Optional
              </span>
              <span style={{ fontFamily: 'var(--pen)', fontSize: 14, color: 'var(--ink-soft)' }}>
                {' '}— leave blank to just mark as going out.
              </span>
            </div>
            <button className="btn btn-terracotta" style={{ width: '100%' }}
              onClick={() => assign('going_out', null, outLabel)}>
              Set it ✓
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── PlanCalendar ──────────────────────────────────────────────
function PlanCalendar({ plan, recipes, onUpdatePlan, onNewPlan, onNavigate }) {
  const [activeSlot,     setActiveSlot]     = React.useState(null);
  const [confirmNewPlan, setConfirmNewPlan] = React.useState(false);

  const recipeMap = Object.fromEntries(recipes.map(r => [r.id, r]));

  const days = React.useMemo(() => {
    const map = {};
    for (const slot of plan.slots) {
      if (!map[slot.date]) map[slot.date] = {};
      map[slot.date][slot.meal_type] = slot;
    }
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
  }, [plan.slots]);

  const mealSlots   = plan.slots.filter(s => s.meal_type !== 'dessert');
  const total       = mealSlots.length;
  const filledCount = mealSlots.filter(s => s.status !== 'empty').length;
  const recipeCount = plan.slots.filter(s => s.status === 'recipe').length;
  const numDays     = daysBetween(plan.start_date, plan.end_date);

  function handleAssign(slotId, status, recipe_id, label = '') {
    onUpdatePlan({
      ...plan,
      slots: plan.slots.map(s => s.id === slotId
        ? { ...s, status, recipe_id: recipe_id || null, label: label || '' }
        : s),
    });
  }

  function cellContent(slot) {
    if (!slot || slot.status === 'empty') return { kind: 'empty' };
    if (slot.status === 'eat_out'  || slot.status === 'going_out')
      return { kind: 'eatout', name: slot.label ? `🎉 ${slot.label}` : 'Going out 🎉' };
    if (slot.status === 'ad_hoc'   || slot.status === 'wing_it')
      return { kind: 'adhoc',  name: 'Wing it 🤷' };
    if (slot.status === 'recipe') {
      const r = recipeMap[slot.recipe_id];
      if (!r) return { kind: 'missing', name: '⚠ Recipe removed' };
      return { kind: 'recipe', name: r.main_dish_name, sides: r.side_dishes };
    }
    return { kind: 'empty' };
  }

  const BG = {
    empty:   'transparent',
    eatout:  'rgba(168,117,77,0.1)',
    adhoc:   'rgba(107,122,74,0.1)',
    recipe:  'rgba(255,255,255,0.7)',
    missing: 'rgba(168,117,77,0.07)',
  };

  return (
    <div className="page">
      <WorkflowBreadcrumb current="plan" />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10,
        justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div className="h2">{formatDate(plan.start_date)} – {formatDate(plan.end_date)}</div>
          <div className="note" style={{ marginTop: 3 }}>
            {numDays} day{numDays !== 1 ? 's' : ''} · {filledCount}/{total} meals filled · {recipeCount} recipe{recipeCount !== 1 ? 's' : ''}
          </div>
        </div>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-sm btn-olive" onClick={() => setConfirmNewPlan(true)}>Start new plan</button>
          <button className="btn btn-sm btn-brown" onClick={() => onNavigate('grocery')}>Proceed to Grocery →</button>
        </div>
      </div>

      {days.map(([date, slotsByType]) => {
        const dessertSlot    = slotsByType['dessert'];
        const dessertContent = dessertSlot ? cellContent(dessertSlot) : null;
        const filledHere     = ['breakfast','lunch','dinner']
          .filter(mt => slotsByType[mt] && slotsByType[mt].status !== 'empty').length;

        return (
          <div key={date} className="day-row">
            <div className="day-header">
              <span className="h3" style={{ fontSize: 15 }}>{formatDate(date)}</span>
              <span className="note">{filledHere}/3</span>
            </div>
            <div className="day-slots">
              {['breakfast','lunch','dinner'].map(mt => {
                const slot = slotsByType[mt];
                const c = cellContent(slot);
                return (
                  <div key={mt} className="day-slot-cell"
                    style={{ background: BG[c.kind] }}
                    onClick={() => slot && setActiveSlot(slot)}>
                    <div className="slot-label">{mt}</div>
                    {c.kind === 'empty'   && <div className="slot-add">+ add</div>}
                    {c.kind === 'missing' && <div className="slot-warning">{c.name}</div>}
                    {c.kind !== 'empty' && c.kind !== 'missing' && (
                      <>
                        <div className="slot-name">{c.name}</div>
                        {c.sides && c.sides.length > 0 && (
                          <div className="slot-sides">{c.sides.join(' · ')}</div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
            {dessertSlot && (
              <div
                className={`day-slot-dessert${dessertContent && dessertContent.kind !== 'empty' ? ' filled' : ''}`}
                onClick={() => setActiveSlot(dessertSlot)}>
                <span style={{ fontSize: 14, flexShrink: 0 }}>🍰</span>
                <span className="slot-label" style={{ marginRight: 4 }}>dessert</span>
                {(!dessertContent || dessertContent.kind === 'empty') ? (
                  <span className="slot-add" style={{ marginTop: 0 }}>+ optional</span>
                ) : (
                  <span style={{ fontSize: 13, color: 'var(--ink)' }}>{dessertContent.name}</span>
                )}
              </div>
            )}
          </div>
        );
      })}

      {activeSlot && (
        <SlotSheet slot={activeSlot} recipes={recipes} plan={plan}
          onAssign={handleAssign} onClose={() => setActiveSlot(null)} />
      )}

      {confirmNewPlan && (
        <div className="modal-backdrop" onClick={() => setConfirmNewPlan(false)}>
          <div className="modal-sheet" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div className="h3" style={{ marginBottom: 8 }}>Start a new plan?</div>
            <div style={{ color: 'var(--ink-soft)', fontSize: 14, lineHeight: 1.6, marginBottom: 22 }}>
              Your current plan will be cleared.<br />
              <strong style={{ color: 'var(--ink)' }}>Your saved recipes are safe</strong> — only the calendar is reset.
            </div>
            <div className="row" style={{ gap: 8 }}>
              <button className="btn fill" onClick={() => setConfirmNewPlan(false)}>Cancel</button>
              <button className="btn btn-olive fill" onClick={() => { setConfirmNewPlan(false); onNewPlan(); }}>
                Yes, start fresh
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── RecipeForm ────────────────────────────────────────────────
const RECIPE_TYPES = [
  { value: 'meal',        label: '🍽 Meal',        note: 'breakfast, lunch or dinner' },
  { value: 'dessert',     label: '🍰 Dessert',     note: 'sweet treats & baked goods' },
  { value: 'party_trick', label: '🎉 Party Trick', note: 'dips, trays, crowd pleasers' },
];

function RecipeForm({ recipe, onSave, onClose }) {
  const isEdit = !!recipe;
  const [step,      setStep]      = React.useState(1);
  const [mainDish,  setMainDish]  = React.useState(recipe?.main_dish_name ?? '');
  const [sides,     setSides]     = React.useState(recipe?.side_dishes ?? []);
  const [sideInput, setSideInput] = React.useState('');
  const [ingText,   setIngText]   = React.useState((recipe?.ingredients ?? []).join('\n'));
  const [type,      setType]      = React.useState(recipe?.type ?? 'meal');
  const [errors,    setErrors]    = React.useState({});
  const mainRef = React.useRef(null);

  React.useEffect(() => { mainRef.current?.focus(); }, []);

  function addSide() {
    const v = sideInput.trim();
    if (!v) return;
    if (!sides.includes(v)) setSides(s => [...s, v]);
    setSideInput('');
  }

  function goStep2() {
    if (!mainDish.trim()) { setErrors({ main: 'Main dish name is required.' }); return; }
    setErrors({});
    setStep(2);
  }

  function handleSave() {
    const ingredients = ingText.split('\n').map(l => l.trim()).filter(Boolean);
    if (ingredients.length === 0) {
      setErrors({ ing: 'Add at least one ingredient so the grocery list works.' });
      return;
    }
    onSave({
      id:             recipe?.id ?? generateId(),
      main_dish_name: mainDish.trim(),
      side_dishes:    sides,
      ingredients,
      type,
      created_at:     recipe?.created_at ?? new Date().toISOString(),
    });
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
        <div className="spread" style={{ marginBottom: 14 }}>
          <div className="eyebrow">{isEdit ? 'Edit recipe' : 'New recipe'}</div>
          <button className="btn btn-sm btn-ghost" onClick={onClose} style={{ padding: '0 8px', fontSize: 16 }}>✕</button>
        </div>

        <div className="row" style={{ gap: 6, marginBottom: 18 }}>
          <div className={`step-dot${step === 1 ? ' active' : ' done'}`}>1</div>
          <div className="step-line" />
          <div className={`step-dot${step === 2 ? ' active' : ''}`}>2</div>
        </div>

        {step === 1 && (
          <>
            <div className="h2 underline-sketch" style={{ display: 'inline-block', marginBottom: 16 }}>Name the meal</div>

            <div className="field" style={{ marginBottom: 16 }}>
              <span className="field-label">Type</span>
              <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                {RECIPE_TYPES.map(t => (
                  <button key={t.value}
                    className={`btn btn-sm${type === t.value ? ' btn-brown' : ''}`}
                    onClick={() => setType(t.value)} type="button">
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="note" style={{ marginTop: 4 }}>
                {RECIPE_TYPES.find(t => t.value === type)?.note}
              </div>
            </div>

            <div className="field" style={{ marginBottom: 14 }}>
              <span className="field-label">
                {type === 'party_trick' ? 'Dish name *' : type === 'dessert' ? 'Dessert name *' : 'Main dish *'}
              </span>
              <input ref={mainRef} type="text" className="text-input"
                value={mainDish}
                placeholder={type === 'dessert' ? 'e.g. Chocolate Chip Cookies' : type === 'party_trick' ? 'e.g. Buffalo Dip' : 'e.g. Grilled Chicken Bowl'}
                onChange={e => { setMainDish(e.target.value); setErrors({}); }}
                onKeyDown={e => e.key === 'Enter' && goStep2()} />
              {errors.main && <div className="field-error">{errors.main}</div>}
            </div>

            {type !== 'party_trick' && (
              <div className="field" style={{ marginBottom: 18 }}>
                <span className="field-label">Sides <span className="note">(optional)</span></span>
                <div className="row" style={{ flexWrap: 'wrap', gap: 5, marginBottom: 6, minHeight: 24 }}>
                  {sides.map(s => (
                    <span key={s} className="chip chip-olive">
                      {s}
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 0 4px', color: 'inherit', fontSize: 11, lineHeight: 1 }}
                        onClick={() => setSides(ss => ss.filter(x => x !== s))}>✕</button>
                    </span>
                  ))}
                </div>
                <div className="row" style={{ gap: 6 }}>
                  <input type="text" className="text-input" value={sideInput}
                    placeholder="e.g. Rice" style={{ flex: 1 }}
                    onChange={e => setSideInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSide(); } }} />
                  <button className="btn btn-sm" onClick={addSide} style={{ flexShrink: 0 }}>Add</button>
                </div>
              </div>
            )}

            <div className="row" style={{ gap: 8 }}>
              <button className="btn fill" onClick={onClose}>Cancel</button>
              <button className="btn btn-brown fill" onClick={goStep2}>Next →</button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{ marginBottom: 10 }}>
              <div className="eyebrow" style={{ marginBottom: 2 }}>{mainDish}</div>
              <div className="h2 underline-sketch" style={{ display: 'inline-block' }}>Ingredients</div>
              <div className="note" style={{ marginTop: 4 }}>one per line — just the name</div>
            </div>
            <textarea className="ingredient-textarea"
              value={ingText}
              onChange={e => { setIngText(e.target.value); setErrors({}); }}
              placeholder={type === 'dessert' ? 'butter\nsugar\nflour\nchocolate chips\neggs' : type === 'party_trick' ? 'cream cheese\nbuffalo sauce\nshredded chicken\nranch' : 'chicken breast\nrice\nbroccoli\ngarlic\nolive oil'} />
            {errors.ing && <div className="field-error" style={{ marginTop: 4 }}>{errors.ing}</div>}
            <div className="row" style={{ gap: 8, marginTop: 14 }}>
              <button className="btn" onClick={() => setStep(1)}>← Back</button>
              <button className="btn btn-brown fill" onClick={handleSave}>
                {isEdit ? 'Save changes' : 'Save recipe'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── RecipeList ────────────────────────────────────────────────
const TYPE_BADGE = {
  meal:        null,
  dessert:     { label: '🍰 Dessert',     cls: 'chip chip-terracotta' },
  party_trick: { label: '🎉 Party Trick', cls: 'chip chip-olive' },
};

function RecipeList({ recipes, onAdd, onEdit, onDelete, onImport, onBack }) {
  const [confirmId,     setConfirmId]     = React.useState(null);
  const [importPreview, setImportPreview] = React.useState(null);
  const [search,        setSearch]        = React.useState('');
  const [typeFilter,    setTypeFilter]    = React.useState('all');
  const fileInputRef = React.useRef();

  const filtered = React.useMemo(() => {
    return recipes.filter(r => {
      const rType = r.type || 'meal';
      return (typeFilter === 'all' || rType === typeFilter) &&
        r.main_dish_name.toLowerCase().includes(search.toLowerCase());
    });
  }, [recipes, search, typeFilter]);

  function exportToCSV() {
    const header = 'name,type,sides,ingredients';
    const rows = recipes.map(r => {
      const name  = (r.main_dish_name || '').replace(/,/g, ' ');
      const rtype = r.type || 'meal';
      const sides = (r.side_dishes || []).join('; ');
      const ings  = (r.ingredients  || []).join('; ');
      return `${name},${rtype},${sides},${ings}`;
    });
    const csv  = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'pantry-recipes.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = ev => {
      const lines = ev.target.result.split('\n').map(l => l.trim()).filter(Boolean);
      const dataLines = lines[0].toLowerCase().startsWith('name') ? lines.slice(1) : lines;
      const imported = dataLines.map(line => {
        const parts = line.split(',');
        const hasType = ['meal','dessert','party_trick'].includes((parts[1] || '').trim());
        const name  = (parts[0] || '').trim();
        const rtype = hasType ? (parts[1] || 'meal').trim() : 'meal';
        const sides = (hasType ? parts[2] : parts[1] || '').split(';').map(s => s.trim()).filter(Boolean);
        const ings  = (hasType ? parts[3] : parts[2] || '').split(';').map(i => i.trim()).filter(Boolean);
        return { id: generateId(), main_dish_name: name, type: rtype, side_dishes: sides, ingredients: ings };
      }).filter(r => r.main_dish_name);
      setImportPreview(imported);
    };
    reader.readAsText(file);
  }

  function confirmImport(mode) {
    const merged = mode === 'add' ? [...recipes, ...importPreview] : importPreview;
    onImport(merged);
    setImportPreview(null);
  }

  const typeCounts = React.useMemo(() => ({
    all:         recipes.length,
    meal:        recipes.filter(r => (r.type||'meal') === 'meal').length,
    dessert:     recipes.filter(r => r.type === 'dessert').length,
    party_trick: recipes.filter(r => r.type === 'party_trick').length,
  }), [recipes]);

  return (
    <div className="page">
      <div className="spread" style={{ marginBottom: 10 }}>
        <div>
          <button className="btn btn-sm btn-ghost" onClick={onBack} style={{ marginBottom: 6, padding: '2px 10px' }}>← Back</button>
          <div className="h2">Recipes</div>
          {recipes.length > 0 && <div className="note">{filtered.length} of {recipes.length}</div>}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {recipes.length > 0 && <button className="btn btn-sm" onClick={exportToCSV}>↓ Export</button>}
          <button className="btn btn-sm" onClick={() => fileInputRef.current.click()}>↑ Import</button>
          <button className="btn btn-brown" onClick={onAdd}>＋ Add recipe</button>
        </div>
      </div>

      {recipes.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <input type="text" className="text-input" placeholder="Search recipes…"
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ marginBottom: 8 }} />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[['all','All'],['meal','Meals'],['dessert','Desserts'],['party_trick','Party Tricks']].map(([t, l]) => (
              <button key={t}
                className={`chip${typeFilter === t ? ' chip-brown' : ''}`}
                style={{ cursor: 'pointer', padding: '3px 11px', fontSize: 11 }}
                onClick={() => setTypeFilter(t)}>
                {l}
                {typeCounts[t] > 0 && <span style={{ opacity: 0.6, marginLeft: 3 }}>{typeCounts[t]}</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleFileChange} />

      {importPreview && (
        <div className="modal-backdrop" onClick={() => setImportPreview(null)}>
          <div className="modal-sheet" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="h3" style={{ marginBottom: 6 }}>Import {importPreview.length} recipe{importPreview.length !== 1 ? 's' : ''}</div>
            <div style={{ color: 'var(--ink-soft)', fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>
              {importPreview.slice(0, 5).map(r => r.main_dish_name).join(', ')}{importPreview.length > 5 ? `… +${importPreview.length - 5} more` : ''}
            </div>
            <div style={{ color: 'var(--ink-soft)', fontSize: 13, marginBottom: 20 }}>
              Add to your {recipes.length} existing recipe{recipes.length !== 1 ? 's' : ''}, or replace them all?
            </div>
            <div className="row" style={{ gap: 8 }}>
              <button className="btn fill" onClick={() => setImportPreview(null)}>Cancel</button>
              {recipes.length > 0 && (
                <button className="btn fill" onClick={() => confirmImport('add')}>Add to existing</button>
              )}
              <button className="btn btn-brown fill" onClick={() => confirmImport('replace')}>
                {recipes.length > 0 ? 'Replace all' : 'Import'}
              </button>
            </div>
          </div>
        </div>
      )}

      {recipes.length === 0 && (
        <div className="empty-state">
          <div style={{ fontSize: 48, marginBottom: 14 }}>🍲</div>
          <div className="h3" style={{ marginBottom: 8 }}>No recipes yet</div>
          <div style={{ color: 'var(--ink-soft)', marginBottom: 24, lineHeight: 1.4 }}>
            Add your first recipe — main dish, optional sides,<br />and the ingredients you'll need.
          </div>
          <button className="btn btn-brown btn-lg" onClick={onAdd}>＋ Add your first recipe</button>
        </div>
      )}

      {filtered.length === 0 && recipes.length > 0 && (
        <div className="note" style={{ textAlign: 'center', padding: '32px 0', color: 'var(--ink-soft)' }}>
          No recipes match your filter.
        </div>
      )}

      {filtered.map(r => {
        const badge = TYPE_BADGE[r.type || 'meal'];
        return (
          <div key={r.id} className="recipe-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
                  <div className="h3" style={{ fontSize: 17 }}>{r.main_dish_name}</div>
                  {badge && <span className={badge.cls} style={{ fontSize: 10 }}>{badge.label}</span>}
                </div>
                {r.side_dishes.length > 0 && (
                  <div className="row" style={{ gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                    {r.side_dishes.map(s => <span key={s} className="chip" style={{ fontSize: 11 }}>{s}</span>)}
                  </div>
                )}
                <div className="note" style={{ marginTop: 6 }}>
                  {r.ingredients.length} ingredient{r.ingredients.length !== 1 ? 's' : ''}
                  {r.ingredients.length > 0 && (
                    <> · {r.ingredients.slice(0, 4).join(', ')}{r.ingredients.length > 4 ? '…' : ''}</>
                  )}
                </div>
              </div>
              <div className="row" style={{ gap: 6, flexShrink: 0 }}>
                <button className="btn btn-sm" onClick={() => onEdit(r)}>Edit</button>
                <button className="btn btn-sm"
                  style={{ color: 'var(--terracotta)', borderColor: 'var(--terracotta)' }}
                  onClick={() => setConfirmId(r.id)}>Delete</button>
              </div>
            </div>
          </div>
        );
      })}

      {confirmId && (
        <div className="modal-backdrop" onClick={() => setConfirmId(null)}>
          <div className="modal-sheet" style={{ maxWidth: 360 }} onClick={e => e.stopPropagation()}>
            <div className="h3" style={{ marginBottom: 8 }}>Delete this recipe?</div>
            <div style={{ color: 'var(--ink-soft)', marginBottom: 20, fontSize: 14, lineHeight: 1.4 }}>
              Any plan slots using it will show a warning until reassigned.
            </div>
            <div className="row" style={{ gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => setConfirmId(null)}>Cancel</button>
              <button className="btn btn-terracotta"
                onClick={() => { onDelete(confirmId); setConfirmId(null); }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── GroceryList ───────────────────────────────────────────────
function GroceryList({ plan, recipes, pantry, onToggleOnHand, onAddExtra, onRemoveExtra, onNavigate }) {
  const [extraInput, setExtraInput] = React.useState('');

  // onHand items are displayed at component level; generateGroceryList only filters staples
  const items = React.useMemo(
    () => generateGroceryList(plan, recipes, pantry),
    [plan, recipes, pantry]
  );

  const onHandSet = React.useMemo(
    () => new Set((pantry?.onHand || []).map(s => s.trim().toLowerCase())),
    [pantry]
  );

  const needToBuy   = items.filter(i => !onHandSet.has(i.name.toLowerCase()));
  const alreadyHave = items.filter(i =>  onHandSet.has(i.name.toLowerCase()));

  function handleAddExtra() {
    const v = extraInput.trim();
    if (!v) return;
    onAddExtra(v);
    setExtraInput('');
  }

  // Manual add block — shown always
  const ManualAddRow = (
    <div style={{ marginTop: 18 }}>
      <div className="eyebrow" style={{ marginBottom: 8 }}>Add to list</div>
      <div className="row" style={{ gap: 6 }}>
        <input type="text" className="text-input"
          value={extraInput}
          onChange={e => setExtraInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddExtra(); } }}
          placeholder="Paper towels, dog food…"
          style={{ flex: 1, fontSize: 14 }} />
        <button className="btn btn-sm btn-clay" onClick={handleAddExtra}>Add</button>
      </div>
    </div>
  );

  // No plan — still show manual add + any existing extras
  if (!plan) {
    const extras = pantry?.extras || [];
    return (
      <div className="page">
        <div className="h2" style={{ marginBottom: 6 }}>Grocery List</div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-soft)', marginBottom: 20 }}>
          No meal plan yet. Add items manually, or start a plan to auto-generate from recipes.
        </div>
        {extras.length > 0 && (
          <>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Added manually</div>
            {extras.map(item => (
              <div key={item} className="grocery-item">
                <span className="check" style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1 }}><div style={{ fontSize: 15 }}>{item}</div></div>
                <button onClick={() => onRemoveExtra(item)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--ink-fade)', fontSize: 15, padding: '2px 4px', flexShrink: 0 }}>✕</button>
              </div>
            ))}
            <div className="divider-wavy" style={{ margin: '12px 0' }} />
          </>
        )}
        {ManualAddRow}
      </div>
    );
  }

  const numDays      = daysBetween(plan.start_date, plan.end_date);
  const staplesCount = pantry?.staples?.length || 0;

  return (
    <div className="page">
      <WorkflowBreadcrumb current="grocery" />
      <div className="spread" style={{ marginBottom: 4 }}>
        <div>
          <div className="h2">Grocery List</div>
          <div className="note">
            {formatDate(plan.start_date)} – {formatDate(plan.end_date)} · {numDays} day{numDays !== 1 ? 's' : ''} · {needToBuy.length} to buy
          </div>
        </div>
        <button className="btn btn-sm btn-brown" onClick={() => onNavigate('pantry')}>
          Proceed to Pantry →
        </button>
      </div>

      {staplesCount > 0 && (
        <div style={{ marginTop: 6, marginBottom: 2 }}>
          <span className="chip" style={{ fontSize: 10 }}>
            ⭐ {staplesCount} staple{staplesCount !== 1 ? 's' : ''} hidden
          </span>
        </div>
      )}

      <div style={{ fontSize: 12, color: 'var(--brown)', fontFamily: 'var(--mono)', marginTop: 8, marginBottom: 6 }}>
        Tap any item to mark it as already on hand — it'll be crossed off your list. Add extras below.
      </div>

      <div className="divider-wavy" style={{ margin: '8px 0 14px' }} />

      {needToBuy.length === 0 && alreadyHave.length === 0 && (
        <div className="note" style={{ textAlign: 'center', padding: '20px 0' }}>
          No items yet — assign recipes to your plan or add items below.
        </div>
      )}

      {/* Need to buy */}
      {needToBuy.map(item => (
        <div key={item.name} className="grocery-item" onClick={() => onToggleOnHand(item.name)}>
          <span className="check" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15 }}>{item.name}</div>
            {item.usedIn.length > 0 && (
              <div className="note" style={{ marginTop: 1 }}>used in: {item.usedIn.join(', ')}</div>
            )}
            {item.extra && (
              <div className="note" style={{ marginTop: 1, color: 'var(--terracotta)' }}>added manually</div>
            )}
          </div>
          {item.extra && (
            <button onClick={e => { e.stopPropagation(); onRemoveExtra(item.name); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--ink-fade)', fontSize: 15, padding: '2px 4px', flexShrink: 0 }}>
              ✕
            </button>
          )}
        </div>
      ))}

      {/* Manual add */}
      {ManualAddRow}

      {/* Already have */}
      {alreadyHave.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Already have ✓</div>
          {alreadyHave.map(item => (
            <div key={item.name} className="grocery-item" style={{ opacity: 0.48 }}
              onClick={() => onToggleOnHand(item.name)}>
              <span className="check checked" style={{ flexShrink: 0, marginTop: 2 }} />
              <span className="scribble" style={{ fontSize: 15 }}>{item.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── PantryTab helpers (module-level — must NOT be defined inside PantryTab
//    or React will unmount/remount them on every keystroke, collapsing the keyboard) ──
function SectionInput({ value, onChange, onSubmit, placeholder }) {
  return (
    <div style={{ padding: '8px 14px 10px', borderTop: '1px dotted var(--rule-soft)' }}>
      <div className="row" style={{ gap: 6 }}>
        <input type="text" className="text-input"
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onSubmit(); } }}
          placeholder={placeholder}
          style={{ flex: 1, fontSize: 13 }} />
        <button className="btn btn-sm" onClick={onSubmit}>Add</button>
      </div>
    </div>
  );
}

// ── PantryTab ─────────────────────────────────────────────────
function PantryTab({ pantry, onUpdatePantry, onNavigate }) {
  const [staplesInput, setStaplesInput] = React.useState('');
  const [onHandInput,  setOnHandInput]  = React.useState('');
  const [extrasInput,  setExtrasInput]  = React.useState('');

  const staples = pantry.staples || [];
  const onHand  = pantry.onHand  || [];

  function addToList(key, value, clearFn) {
    const trimmed = value.trim();
    if (!trimmed) return;
    const current = pantry[key] || [];
    if (current.some(i => i.toLowerCase() === trimmed.toLowerCase())) { clearFn(''); return; }
    onUpdatePantry({ ...pantry, [key]: [...current, trimmed] });
    clearFn('');
  }

  function removeFromList(key, item) {
    onUpdatePantry({ ...pantry, [key]: (pantry[key] || []).filter(i => i !== item) });
  }

  function promoteToStaple(item) {
    const key = item.toLowerCase();
    const newOnHand  = onHand.filter(i => i.toLowerCase() !== key);
    const newStaples = staples.some(i => i.toLowerCase() === key) ? staples : [...staples, item];
    onUpdatePantry({ ...pantry, onHand: newOnHand, staples: newStaples });
  }

  // One-off: push a staple into extras so it appears on the grocery list this time
  function addStapleToGrocery(item) {
    const current = pantry.extras || [];
    if (current.some(i => i.toLowerCase() === item.toLowerCase())) return;
    onUpdatePantry({ ...pantry, extras: [...current, item.trim()] });
  }

  const extrasSet = React.useMemo(
    () => new Set((pantry.extras || []).map(i => i.toLowerCase())),
    [pantry.extras]
  );

  function addExtra() {
    const trimmed = extrasInput.trim();
    if (!trimmed) return;
    const current = pantry.extras || [];
    if (current.some(i => i.toLowerCase() === trimmed.toLowerCase())) { setExtrasInput(''); return; }
    onUpdatePantry({ ...pantry, extras: [...current, trimmed] });
    setExtrasInput('');
  }

  function removeExtra(item) {
    onUpdatePantry({ ...pantry, extras: (pantry.extras || []).filter(i => i !== item) });
  }

  const extras = pantry.extras || [];

  return (
    <div className="page">
      <WorkflowBreadcrumb current="pantry" />
      <div className="spread" style={{ marginBottom: 4, alignItems: 'flex-start' }}>
        <div>
          <div className="h2">Pantry</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-soft)', marginTop: 4, lineHeight: 1.6, maxWidth: 340 }}>
            Staples are always excluded from your grocery list. On Hand tracks what you currently have.
          </div>
        </div>
        <button className="btn btn-sm btn-brown" onClick={() => onNavigate('prepare')} style={{ flexShrink: 0 }}>
          Proceed to Prepare →
        </button>
      </div>
      <div style={{ marginBottom: 20 }} />

      {/* Staples */}
      <div className="pantry-section">
        <div className="pantry-section-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 17 }}>⭐</span>
              <span className="h3" style={{ fontSize: 17 }}>Staples</span>
              <span className="eyebrow" style={{ opacity: 0.65, marginLeft: 2 }}>{staples.length}</span>
            </div>
            <div className="note" style={{ marginTop: 2 }}>Always on hand — tap + List to add one to the grocery list this time</div>
          </div>
        </div>
        <div>
          {staples.length === 0 && (
            <div className="note" style={{ padding: '10px 14px', fontStyle: 'italic' }}>
              None yet. Add things like salt, olive oil, butter.
            </div>
          )}
          {staples.map(item => {
            const onList = extrasSet.has(item.toLowerCase());
            return (
              <div key={item} className="pantry-item">
                <span style={{ flex: 1, fontSize: 14 }}>{item}</span>
                <button
                  onClick={() => addStapleToGrocery(item)}
                  className="btn btn-sm"
                  disabled={onList}
                  style={{
                    fontSize: 10, padding: '2px 8px', marginRight: 6, flexShrink: 0,
                    color:       onList ? 'var(--olive)'     : 'var(--terracotta)',
                    borderColor: onList ? 'var(--olive)'     : 'var(--terracotta)',
                    opacity: onList ? 0.65 : 1,
                    background: onList ? 'rgba(107,122,74,0.08)' : 'transparent',
                  }}
                  title={onList ? 'Already on grocery list' : 'Add to grocery list this time'}>
                  {onList ? '✓ on list' : '+ list'}
                </button>
                <button onClick={() => removeFromList('staples', item)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--ink-fade)', fontSize: 15, padding: '2px 6px', lineHeight: 1 }}>✕</button>
              </div>
            );
          })}
        </div>
        <SectionInput
          value={staplesInput} onChange={setStaplesInput}
          onSubmit={() => addToList('staples', staplesInput, setStaplesInput)}
          placeholder="e.g. olive oil, salt, butter…" />
      </div>

      {/* On Hand */}
      <div className="pantry-section">
        <div className="pantry-section-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 17 }}>✅</span>
              <span className="h3" style={{ fontSize: 17 }}>On Hand</span>
              <span className="eyebrow" style={{ opacity: 0.65, marginLeft: 2 }}>{onHand.length}</span>
            </div>
            <div className="note" style={{ marginTop: 2 }}>Currently have it · cleared when you start a new plan</div>
          </div>
        </div>
        <div>
          {onHand.length === 0 && (
            <div className="note" style={{ padding: '10px 14px', fontStyle: 'italic' }}>
              Check items off your grocery list to mark them as on hand.
            </div>
          )}
          {onHand.map(item => (
            <div key={item} className="pantry-item">
              <span style={{ flex: 1, fontSize: 14 }}>{item}</span>
              <button onClick={() => promoteToStaple(item)}
                className="btn btn-sm"
                style={{ fontSize: 10, padding: '2px 8px', marginRight: 4, color: 'var(--brown)', flexShrink: 0 }}
                title="Save as a staple — always on hand">
                → Staple
              </button>
              <button onClick={() => removeFromList('onHand', item)}
                style={{ background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--ink-fade)', fontSize: 15, padding: '2px 6px', lineHeight: 1, flexShrink: 0 }}>✕</button>
            </div>
          ))}
        </div>
        <SectionInput
          value={onHandInput} onChange={setOnHandInput}
          onSubmit={() => addToList('onHand', onHandInput, setOnHandInput)}
          placeholder="Add something you have on hand…" />
      </div>

      {/* Extras — one-off items for the grocery list */}
      <div className="pantry-section">
        <div className="pantry-section-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 17 }}>🛒</span>
              <span className="h3" style={{ fontSize: 17 }}>Add to this list</span>
              {extras.length > 0 && <span className="eyebrow" style={{ opacity: 0.65, marginLeft: 2 }}>{extras.length}</span>}
            </div>
            <div className="note" style={{ marginTop: 2 }}>One-off items to add to your grocery list this time</div>
          </div>
        </div>
        <div>
          {extras.length === 0 && (
            <div className="note" style={{ padding: '10px 14px', fontStyle: 'italic' }}>
              Nothing added yet. Paper towels, a birthday card…
            </div>
          )}
          {extras.map(item => (
            <div key={item} className="pantry-item">
              <span style={{ flex: 1, fontSize: 14 }}>{item}</span>
              <button onClick={() => removeExtra(item)}
                style={{ background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--ink-fade)', fontSize: 15, padding: '2px 6px', lineHeight: 1 }}>✕</button>
            </div>
          ))}
        </div>
        <SectionInput
          value={extrasInput} onChange={setExtrasInput}
          onSubmit={addExtra}
          placeholder="Paper towels, dog food…" />
      </div>

    </div>
  );
}

// ── PrepareTab ────────────────────────────────────────────────
function PrepareTab({ plan, recipes, pantry }) {
  const [copyLabel, setCopyLabel] = React.useState('📋 Copy grocery list');

  const onHandSet = React.useMemo(
    () => new Set((pantry?.onHand || []).map(s => s.trim().toLowerCase())),
    [pantry]
  );
  const items = React.useMemo(
    () => plan ? generateGroceryList(plan, recipes, pantry) : [],
    [plan, recipes, pantry]
  );
  const needToBuy = items.filter(i => !onHandSet.has(i.name.toLowerCase()));

  async function copyToClipboard() {
    if (!needToBuy.length) return;
    const text = needToBuy.map(i => i.name).join('\n');
    setCopyLabel('✓ Copied!');
    setTimeout(() => setCopyLabel('📋 Copy grocery list'), 2500);
    try { await navigator.clipboard.writeText(text); }
    catch {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
        document.body.appendChild(ta); ta.focus(); ta.select();
        document.execCommand('copy'); document.body.removeChild(ta);
      } catch { /* silent */ }
    }
  }

  return (
    <div className="page">
      <WorkflowBreadcrumb current="prepare" />
      <div className="h2" style={{ marginBottom: 6 }}>Prepare</div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-soft)', marginBottom: 28, lineHeight: 1.6 }}>
        You're ready to shop. Copy your list and open your shopping app.
      </div>
      <div className="col" style={{ gap: 10 }}>
        <button className="btn btn-clay btn-lg"
          style={{ width: '100%', justifyContent: 'center', opacity: needToBuy.length ? 1 : 0.4 }}
          onClick={copyToClipboard}>
          {copyLabel}
        </button>
        <a href="https://shoppinglist.google.com" target="_blank" rel="noopener noreferrer"
          className="btn btn-lg"
          style={{ width: '100%', justifyContent: 'center', textDecoration: 'none' }}>
          🛒 Open Shopping List
        </a>
      </div>
      {needToBuy.length > 0 && (
        <div style={{ marginTop: 20, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-soft)' }}>
          {needToBuy.length} item{needToBuy.length !== 1 ? 's' : ''} ready to copy
        </div>
      )}
      {!plan && (
        <div className="note" style={{ marginTop: 20, textAlign: 'center' }}>
          No plan yet — start a plan to generate a grocery list.
        </div>
      )}
    </div>
  );
}

// ── App root ──────────────────────────────────────────────────
function App() {
  const { household } = usePantryAuth();
  const householdId = household?.id;

  const [view,           setView]           = React.useState('plan');
  const [recipes,        setRecipes]        = React.useState(() => getRecipes());
  const [plan,           setPlan]           = React.useState(() => getPlan());
  const [pantry,         setPantry]         = React.useState(() => getPantry());
  const [newPlanMode,    setNewPlanMode]    = React.useState(false);
  const [recipeFormOpen, setRecipeFormOpen] = React.useState(false);
  const [editingRecipe,  setEditingRecipe]  = React.useState(null);

  React.useEffect(() => {
    if (!householdId) return;
    const unsubR  = subscribeRecipes(householdId, setRecipes);
    const unsubP  = subscribePlan(householdId, setPlan);
    const unsubPa = subscribePantry(householdId, setPantry);
    return () => { unsubR(); unsubP(); unsubPa(); };
  }, [householdId]);

  // ── Recipes ─────────────────────────────────────────────────
  function updateRecipes(updated) { saveRecipes(updated); setRecipes(updated); }

  async function handleSaveRecipe(r) {
    const updated = editingRecipe ? recipes.map(x => x.id === r.id ? r : x) : [...recipes, r];
    updateRecipes(updated);
    setRecipeFormOpen(false);
    setEditingRecipe(null);
    saveRecipeFirestore(householdId, r).catch(console.error);
  }

  async function handleDeleteRecipe(id) {
    updateRecipes(recipes.filter(r => r.id !== id));
    deleteRecipeFirestore(householdId, id).catch(console.error);
  }

  // ── Plan ────────────────────────────────────────────────────
  function updatePlan(updated) {
    if (updated) savePlan(updated); else clearPlan();
    setPlan(updated);
    savePlanFirestore(householdId, updated).catch(console.error);
  }

  // ── Pantry ──────────────────────────────────────────────────
  function updatePantry(updated) {
    savePantry(updated);
    setPantry(updated);
    savePantryFirestore(householdId, updated).catch(console.error);
  }

  // Check/uncheck a grocery item → persists to pantry.onHand
  function handleToggleOnHand(name) {
    const key     = name.trim().toLowerCase();
    const current = pantry.onHand || [];
    const isOn    = current.some(i => i.toLowerCase() === key);
    updatePantry({
      ...pantry,
      onHand: isOn ? current.filter(i => i.toLowerCase() !== key) : [...current, name.trim()],
    });
  }

  // Manual grocery list additions (extras)
  function handleAddExtra(name) {
    const trimmed = name.trim();
    if (!trimmed) return;
    const current = pantry.extras || [];
    if (current.some(i => i.toLowerCase() === trimmed.toLowerCase())) return;
    updatePantry({ ...pantry, extras: [...current, trimmed] });
  }

  function handleRemoveExtra(name) {
    updatePantry({ ...pantry, extras: (pantry.extras || []).filter(i => i !== name) });
  }

  // ── Shared ──────────────────────────────────────────────────
  function openRecipeForm(r = null) { setEditingRecipe(r); setRecipeFormOpen(true); }

  function handleStartPlan(start, end, cancel = false) {
    if (cancel) { setNewPlanMode(false); return; }
    updatePlan({ start_date: start, end_date: end, slots: buildSlots(start, end) });
    updatePantry({ ...pantry, onHand: [], extras: [] }); // clear on-hand and extras when plan resets
    setNewPlanMode(false);
    setView('plan');
  }

  const showDatePicker = view === 'plan' && (!plan || newPlanMode);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper-2)', fontFamily: 'var(--pen)', color: 'var(--ink)' }}>
      <TopBar onOpenRecipes={() => setView('recipes')} />

      {showDatePicker && (
        <DateRangePicker existingPlan={plan} onStart={handleStartPlan} />
      )}
      {view === 'plan' && plan && !newPlanMode && (
        <PlanCalendar plan={plan} recipes={recipes}
          onUpdatePlan={updatePlan}
          onNewPlan={() => setNewPlanMode(true)}
          onNavigate={setView} />
      )}
      {view === 'recipes' && (
        <RecipeList recipes={recipes}
          onBack={() => setView('plan')}
          onAdd={() => openRecipeForm(null)}
          onEdit={openRecipeForm}
          onDelete={handleDeleteRecipe}
          onImport={updated => {
            updateRecipes(updated);
            updated.forEach(r => saveRecipeFirestore(householdId, r).catch(console.error));
          }} />
      )}
      {view === 'grocery' && (
        <GroceryList plan={plan} recipes={recipes} pantry={pantry}
          onToggleOnHand={handleToggleOnHand}
          onAddExtra={handleAddExtra}
          onRemoveExtra={handleRemoveExtra}
          onNavigate={setView} />
      )}
      {view === 'pantry' && (
        <PantryTab pantry={pantry} onUpdatePantry={updatePantry} onNavigate={setView} />
      )}
      {view === 'prepare' && (
        <PrepareTab plan={plan} recipes={recipes} pantry={pantry} />
      )}

      <BottomNav view={view} setView={v => { setView(v); setNewPlanMode(false); }} />

      {recipeFormOpen && (
        <RecipeForm recipe={editingRecipe} onSave={handleSaveRecipe}
          onClose={() => { setRecipeFormOpen(false); setEditingRecipe(null); }} />
      )}
    </div>
  );
}

function PantryRoot() {
  return (
    <PantryAuthProvider>
      <App />
    </PantryAuthProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<PantryRoot />);
