// app.jsx — Our Money

const { AuthProvider: MoneyAuthProvider, useAuth: useMoneyAuth } = window._oursAuth;

// ─── Constants ────────────────────────────────────────────────────────────

const GOLD        = '#b5892e';
const GOLD_BG     = 'rgba(181,137,46,0.12)';
const GOLD_BORDER = 'rgba(181,137,46,0.35)';

const BUDGET_COLORS = [
  '#c39169', '#b5892e', '#a8754d', '#7a9a5a',
  '#8a6f4e', '#d4956a', '#6b7a4a', '#c4a265',
];

const DISMISSED_KEY   = 'mn_dismissed';
const BUDGET_STARTERS = ['Groceries', 'Eating Out', 'Gas', 'Fun'];

const CATS = [
  { id: 'required',        label: 'Required',        emoji: '🏠', color: 'var(--terracotta)', bg: 'rgba(168,117,77,0.14)',  border: 'var(--terracotta)', desc: "Non-negotiables: rent, mortgage, utilities, phone. Life doesn't run without these." },
  { id: 'protection',      label: 'Protection',      emoji: '🛡',  color: 'var(--olive)',      bg: 'rgba(107,122,74,0.14)',  border: 'var(--olive)',      desc: "Insurance, warranties, security. Money you hope you never need, but can't go without." },
  { id: 'quality-of-life', label: 'Quality of Life', emoji: '✨', color: 'var(--clay)',       bg: 'rgba(195,145,105,0.16)', border: 'var(--clay)',       desc: 'Streaming, gym, subscriptions that make everyday life better. Worth it if you use it.' },
  { id: 'growth',          label: 'Growth',          emoji: '🌱', color: '#4a7c5a',           bg: 'rgba(74,124,90,0.13)',   border: '#4a7c5a',           desc: 'Education, savings tools, investments. Spending today that pays dividends tomorrow.' },
  { id: 'convenience',     label: 'Convenience',     emoji: '⚡', color: 'var(--brown)',      bg: 'rgba(138,111,78,0.13)', border: 'var(--brown)',      desc: 'Delivery, parking, time-savers. High scrutiny category — nice to have, easy to trim.' },
];

const CYCLES = [
  { id: 'monthly',   label: 'Monthly',   factor: 1 },
  { id: 'annual',    label: 'Annual',    factor: 1 / 12 },
  { id: 'quarterly', label: 'Quarterly', factor: 1 / 3 },
];

const STATUSES = [
  { id: 'active',    label: 'Active',    color: 'var(--olive)',    bg: 'rgba(107,122,74,0.14)',  border: 'var(--olive)' },
  { id: 'paused',    label: 'Paused',    color: 'var(--clay)',     bg: 'rgba(195,145,105,0.18)', border: 'var(--clay)' },
  { id: 'cancelled', label: 'Cancelled', color: 'var(--ink-fade)', bg: 'transparent',            border: 'var(--rule)' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────

function catInfo(id)    { return CATS.find(c => c.id === id) || null; }
function cycleInfo(id)  { return CYCLES.find(c => c.id === id) || CYCLES[0]; }
function statusInfo(id) { return STATUSES.find(s => s.id === id) || STATUSES[0]; }

function toMonthly(amount, cycle) {
  const n = parseFloat(amount);
  if (!n || isNaN(n)) return 0;
  return n * cycleInfo(cycle).factor;
}
function toAnnual(amount, cycle) { return toMonthly(amount, cycle) * 12; }

function fmtMoney(n, decimals = 0) {
  if (!n && n !== 0) return '';
  return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtDate(str) {
  if (!str) return '';
  const [y, m, d] = str.split('-').map(Number);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[m - 1]} ${d}, ${y}`;
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  const now = new Date(); now.setHours(0, 0, 0, 0);
  return Math.round((target - now) / 86400000);
}

function isThisMonth(dateStr) {
  if (!dateStr) return false;
  const now = new Date();
  const [y, m] = dateStr.split('-').map(Number);
  return y === now.getFullYear() && m === (now.getMonth() + 1);
}

function loadDismissed() {
  try { return JSON.parse(localStorage.getItem(DISMISSED_KEY) || '{}'); }
  catch { return {}; }
}
function saveDismissed(obj) { localStorage.setItem(DISMISSED_KEY, JSON.stringify(obj)); }
function isDismissed(dismissed, key) {
  const until = dismissed[key];
  return until ? new Date() < new Date(until) : false;
}
function nextMonthStr() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString().split('T')[0];
}

// ─── Nav ──────────────────────────────────────────────────────────────────

function Nav({ onAdd }) {
  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'var(--paper)',
      borderBottom: '1.5px solid var(--rule-soft)',
      display: 'flex', alignItems: 'center',
      padding: '10px 16px', gap: 10,
    }}>
      <a href="../../" style={{
        fontFamily: '"Cormorant Garamond", Garamond, serif',
        fontWeight: 300, fontSize: 15,
        color: 'var(--clay)', textDecoration: 'none',
        letterSpacing: '-0.01em', flexShrink: 0, opacity: 0.75,
      }}>← ours</a>

      <div style={{
        width: 28, height: 28, borderRadius: '7px 9px 6px 8px',
        background: GOLD, border: '1.5px solid #7a5c1a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fdf9f0', fontFamily: 'var(--hand)', fontWeight: 700, fontSize: 14,
        flexShrink: 0,
      }}>$</div>

      <span style={{ fontFamily: 'var(--hand)', fontWeight: 700, fontSize: 17, color: 'var(--ink)', flex: 1 }}>
        Our Money
      </span>

      <button
        onClick={onAdd}
        style={{
          padding: '5px 14px',
          border: `1.5px solid ${GOLD}`,
          borderRadius: '12px 14px 10px 13px',
          background: GOLD, color: '#fdf9f0',
          fontFamily: 'var(--pen)', fontSize: 13,
          cursor: 'pointer',
        }}
      >＋ Add</button>
    </nav>
  );
}

// ─── Category info modal ──────────────────────────────────────────────────

function CategoryInfoModal({ onClose }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(24,20,16,.52)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: 'var(--paper)', borderRadius: '14px 16px 12px 14px',
        padding: '22px 20px 24px', width: '100%', maxWidth: 440,
        maxHeight: '85vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <span style={{ fontFamily: 'var(--hand)', fontWeight: 700, fontSize: 19, color: 'var(--ink)' }}>
            The 5 categories
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--ink-fade)', padding: 4 }}>✕</button>
        </div>
        <div style={{ fontFamily: 'var(--pen)', fontSize: 12, color: 'var(--ink-soft)', marginBottom: 16, lineHeight: 1.5 }}>
          Every expense fits one of five buckets. This framing helps you see where money goes
          and spot what's worth cutting.
        </div>
        {CATS.map(cat => (
          <div key={cat.id} style={{
            display: 'flex', gap: 12, alignItems: 'flex-start',
            padding: '10px 0',
            borderBottom: '1px solid var(--rule-soft)',
          }}>
            <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>{cat.emoji}</span>
            <div>
              <div style={{ fontFamily: 'var(--hand)', fontWeight: 700, fontSize: 15, color: cat.color, marginBottom: 3 }}>{cat.label}</div>
              <div style={{ fontFamily: 'var(--pen)', fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.5 }}>{cat.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const s = statusInfo(status);
  return (
    <span style={{
      fontFamily: 'var(--mono)', fontSize: 10,
      letterSpacing: '0.07em', textTransform: 'uppercase',
      padding: '2px 8px', borderRadius: 10,
      background: s.bg, border: `1px solid ${s.border}`,
      color: s.color, whiteSpace: 'nowrap',
    }}>{s.label}</span>
  );
}

// ─── Pie chart ────────────────────────────────────────────────────────────

function PieChart({ slices, size = 140 }) {
  const filtered = slices.filter(s => (s.value || 0) > 0);
  const total = filtered.reduce((s, x) => s + x.value, 0);
  if (!total) return null;

  const cx = size / 2, cy = size / 2;
  const outerR = size * 0.42;
  const innerR = size * 0.22;
  let angle = -Math.PI / 2;

  const paths = filtered.map((slice, i) => {
    const sa = angle;
    const da = (slice.value / total) * 2 * Math.PI;
    angle += da;
    if (da >= 2 * Math.PI - 0.001) {
      return <circle key={i} cx={cx} cy={cy} r={outerR} fill={slice.color} stroke="var(--paper)" strokeWidth="2" />;
    }
    const x1 = cx + outerR * Math.cos(sa),  y1 = cy + outerR * Math.sin(sa);
    const x2 = cx + outerR * Math.cos(angle), y2 = cy + outerR * Math.sin(angle);
    return (
      <path key={i}
        d={`M ${cx} ${cy} L ${x1} ${y1} A ${outerR} ${outerR} 0 ${da > Math.PI ? 1 : 0} 1 ${x2} ${y2} Z`}
        fill={slice.color}
        stroke="var(--paper)"
        strokeWidth="2"
      />
    );
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {paths}
      <circle cx={cx} cy={cy} r={innerR} fill="var(--paper)" />
    </svg>
  );
}

// ─── Where It Goes ────────────────────────────────────────────────────────

function WhereItGoes({ budget, onBudgetChange }) {
  const [open,      setOpen]      = React.useState(false);
  const [editingId, setEditingId] = React.useState(null);
  const [editVal,   setEditVal]   = React.useState('');
  const [showAdd,   setShowAdd]   = React.useState(false);
  const [newName,   setNewName]   = React.useState('');
  const [newAmt,    setNewAmt]    = React.useState('');

  const total = budget.reduce((s, c) => s + (parseFloat(c.amount) || 0), 0);

  function addCategory() {
    if (!newName.trim()) return;
    const amt = parseFloat(newAmt) || 0;
    onBudgetChange([...budget, { id: generateId(), name: newName.trim(), amount: amt }]);
    setNewName(''); setNewAmt(''); setShowAdd(false);
  }

  function addStarter(name) {
    onBudgetChange([...budget, { id: generateId(), name, amount: 0 }]);
  }

  function commitEdit(id) {
    const amt = parseFloat(editVal);
    if (!isNaN(amt) && amt >= 0) {
      onBudgetChange(budget.map(c => c.id === id ? { ...c, amount: amt } : c));
    }
    setEditingId(null);
  }

  function removeCategory(id) {
    onBudgetChange(budget.filter(c => c.id !== id));
  }

  const slices = budget.map((c, i) => ({
    value: parseFloat(c.amount) || 0,
    color: BUDGET_COLORS[i % BUDGET_COLORS.length],
    label: c.name,
  }));

  return (
    <div style={{
      margin: '12px 16px 4px',
      border: '1.5px solid var(--rule-soft)',
      borderRadius: '8px 10px 7px 9px',
      overflow: 'hidden',
      background: 'rgba(255,255,255,0.35)',
    }}>
      {/* Collapse toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '11px 14px',
          background: 'none', border: 'none', cursor: 'pointer',
          borderBottom: open ? '1px solid var(--rule-soft)' : 'none',
        }}
      >
        <span style={{
          fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: 'var(--ink-fade)', flex: 1, textAlign: 'left',
        }}>Where It Goes</span>
        {total > 0 && (
          <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: GOLD, fontWeight: 600 }}>
            {fmtMoney(total, 0)}/mo
          </span>
        )}
        {budget.length === 0 && !open && (
          <span style={{ fontFamily: 'var(--pen)', fontSize: 12, color: 'var(--ink-fade)', fontStyle: 'italic' }}>
            budget planner
          </span>
        )}
        <span style={{
          fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-fade)',
          display: 'inline-block', marginLeft: 4,
          transition: 'transform .18s',
          transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
        }}>▸</span>
      </button>

      {open && (
        <div style={{ padding: '14px 14px 16px' }}>

          {/* Pie chart + totals */}
          {slices.some(s => s.value > 0) && (
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
              <div style={{ flexShrink: 0 }}>
                <PieChart slices={slices} size={120} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-fade)', marginBottom: 3 }}>
                  Budget total
                </div>
                <div style={{ fontFamily: 'var(--hand)', fontWeight: 700, fontSize: 24, color: 'var(--ink)', lineHeight: 1 }}>
                  {fmtMoney(total, 0)}/mo
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-fade)', marginTop: 3 }}>
                  {fmtMoney(total * 12, 0)}/yr
                </div>
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {budget.map((c, i) => (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: BUDGET_COLORS[i % BUDGET_COLORS.length], flexShrink: 0 }} />
                      <span style={{ fontFamily: 'var(--pen)', fontSize: 11, color: 'var(--ink-soft)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-fade)' }}>{fmtMoney(parseFloat(c.amount) || 0, 0)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Empty state hint */}
          {budget.length === 0 && !showAdd && (
            <div style={{ fontFamily: 'var(--pen)', fontSize: 13, color: 'var(--ink-fade)', padding: '4px 0 12px', lineHeight: 1.5 }}>
              Set what you expect to spend each month — just a rough plan, nothing tracked.
            </div>
          )}

          {/* Editable list */}
          {budget.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 4 }}>
              {budget.map((cat, i) => (
                <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--rule-soft)' }}>
                  <div style={{ width: 9, height: 9, borderRadius: 2, background: BUDGET_COLORS[i % BUDGET_COLORS.length], flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--pen)', fontSize: 14, color: 'var(--ink)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {cat.name}
                  </span>
                  {editingId === cat.id ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--ink-soft)' }}>$</span>
                      <input
                        type="number" min="0" step="1"
                        autoFocus
                        value={editVal}
                        onChange={e => setEditVal(e.target.value)}
                        onBlur={() => commitEdit(cat.id)}
                        onKeyDown={e => { if (e.key === 'Enter') commitEdit(cat.id); if (e.key === 'Escape') setEditingId(null); }}
                        style={{ width: 72, fontFamily: 'var(--mono)', fontSize: 13, border: `1.5px solid ${GOLD}`, borderRadius: 5, padding: '3px 6px', outline: 'none', background: 'rgba(255,255,255,0.85)', color: 'var(--ink)' }}
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditingId(cat.id); setEditVal(String(cat.amount || 0)); }}
                      title="Tap to edit"
                      style={{
                        fontFamily: 'var(--mono)', fontSize: 13,
                        color: parseFloat(cat.amount) > 0 ? GOLD : 'var(--ink-fade)',
                        background: 'none', border: 'none', cursor: 'pointer',
                        padding: '2px 6px', borderRadius: 4,
                        borderBottom: `1px dashed ${parseFloat(cat.amount) > 0 ? GOLD : 'var(--rule)'}`,
                      }}
                    >
                      {parseFloat(cat.amount) > 0 ? `${fmtMoney(cat.amount, 0)}/mo` : 'set amount'}
                    </button>
                  )}
                  <button
                    onClick={() => removeCategory(cat.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--ink-fade)', cursor: 'pointer', fontSize: 13, padding: '2px 5px', opacity: 0.4, flexShrink: 0 }}
                  >✕</button>
                </div>
              ))}
            </div>
          )}

          {/* Add form / starter chips */}
          {showAdd ? (
            <div style={{ display: 'flex', gap: 7, alignItems: 'center', marginTop: 10 }}>
              <input
                autoFocus
                placeholder="Category name"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') document.getElementById('wit-amt')?.focus();
                  if (e.key === 'Escape') { setShowAdd(false); setNewName(''); setNewAmt(''); }
                }}
                style={{ flex: 2, fontFamily: 'var(--pen)', fontSize: 13, border: '1.5px solid var(--rule)', borderRadius: 6, padding: '6px 9px', outline: 'none', background: 'rgba(255,255,255,0.75)', color: 'var(--ink)' }}
              />
              <div style={{ position: 'relative', flex: 1 }}>
                <span style={{ position: 'absolute', left: 7, top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-soft)' }}>$</span>
                <input
                  id="wit-amt"
                  type="number" min="0" step="1"
                  placeholder="0"
                  value={newAmt}
                  onChange={e => setNewAmt(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') addCategory();
                    if (e.key === 'Escape') { setShowAdd(false); setNewName(''); setNewAmt(''); }
                  }}
                  style={{ width: '100%', fontFamily: 'var(--mono)', fontSize: 13, border: '1.5px solid var(--rule)', borderRadius: 6, padding: '6px 7px 6px 18px', outline: 'none', background: 'rgba(255,255,255,0.75)', color: 'var(--ink)' }}
                />
              </div>
              <button onClick={addCategory} style={{ background: GOLD, color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontFamily: 'var(--pen)', fontSize: 13, cursor: 'pointer', flexShrink: 0 }}>
                Add
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: budget.length > 0 ? 12 : 4 }}>
              <button
                onClick={() => setShowAdd(true)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '5px 12px',
                  border: `1.5px dashed ${GOLD_BORDER}`,
                  borderRadius: '12px 14px 10px 13px',
                  background: 'transparent',
                  fontFamily: 'var(--pen)', fontSize: 13,
                  color: GOLD, cursor: 'pointer',
                }}
              >＋ Add category</button>
              {budget.length === 0 && BUDGET_STARTERS.map(s => (
                <button
                  key={s}
                  onClick={() => addStarter(s)}
                  style={{
                    padding: '4px 10px',
                    border: '1px dashed var(--rule-soft)',
                    borderRadius: 12,
                    background: 'transparent',
                    fontFamily: 'var(--pen)', fontSize: 12,
                    color: 'var(--ink-fade)', cursor: 'pointer',
                  }}
                >{s}</button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Summary bar ──────────────────────────────────────────────────────────

function SummaryBar({ expenses, onInfo }) {
  const active = expenses.filter(e => e.status === 'active');
  if (!active.length) return null;

  const totalMonthly = active.reduce((sum, e) => sum + toMonthly(e.amount, e.cycle), 0);
  const renewalsThisMonth = active.filter(e => isThisMonth(e.renewalDate)).length;

  const catTotals = CATS.map(cat => ({
    ...cat,
    monthly: active.filter(e => e.category === cat.id)
                   .reduce((s, e) => s + toMonthly(e.amount, e.cycle), 0),
  })).filter(c => c.monthly > 0);

  return (
    <div style={{
      margin: '0 16px 4px',
      padding: '14px 16px',
      background: GOLD_BG,
      border: `1px solid ${GOLD_BORDER}`,
      borderRadius: '8px 10px 7px 9px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-fade)', marginBottom: 2 }}>
            Monthly spend
          </div>
          <div style={{ fontFamily: 'var(--hand)', fontWeight: 700, fontSize: 26, color: 'var(--ink)', lineHeight: 1 }}>
            {fmtMoney(totalMonthly, 2)}
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-fade)', marginTop: 2 }}>
            {fmtMoney(totalMonthly * 12, 0)}/yr across {active.length} active
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <button
            onClick={onInfo}
            style={{
              background: 'none', border: `1px solid ${GOLD_BORDER}`,
              borderRadius: 20, padding: '2px 9px',
              fontFamily: 'var(--mono)', fontSize: 10, cursor: 'pointer',
              color: GOLD,
            }}
          >ℹ categories</button>
          {renewalsThisMonth > 0 && (
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--terracotta)' }}>
              🔔 {renewalsThisMonth} renewal{renewalsThisMonth !== 1 ? 's' : ''} this month
            </div>
          )}
        </div>
      </div>

      {catTotals.length > 0 && (
        <div>
          <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', gap: 1 }}>
            {catTotals.map(cat => (
              <div key={cat.id} style={{ flex: cat.monthly / totalMonthly, background: cat.color, opacity: 0.75 }} />
            ))}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', marginTop: 8 }}>
            {catTotals.map(cat => (
              <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: cat.color, opacity: 0.75 }} />
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-soft)' }}>
                  {cat.emoji} {cat.label} {fmtMoney(cat.monthly, 0)}/mo
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Recommendations ──────────────────────────────────────────────────────

const URGENCY_STYLE = {
  high:   { border: 'var(--terracotta)', bg: 'rgba(168,117,77,0.07)', text: 'var(--ink-soft)' },
  med:    { border: 'var(--clay)',       bg: 'rgba(195,145,105,0.07)', text: 'var(--ink-soft)' },
  annual: { border: GOLD,               bg: GOLD_BG,                   text: 'var(--ink)' },
  low:    { border: 'var(--rule)',       bg: 'transparent',             text: 'var(--ink-fade)' },
};

function Recommendations({ expenses }) {
  const [dismissed, setDismissed] = React.useState(loadDismissed);

  function dismiss(key) {
    const updated = { ...dismissed, [key]: nextMonthStr() };
    setDismissed(updated);
    saveDismissed(updated);
  }

  const active    = expenses.filter(e => e.status === 'active');
  const paused    = expenses.filter(e => e.status === 'paused');
  const cancelled = expenses.filter(e => e.status === 'cancelled');
  const tips = [];

  // Upcoming renewals ≤ 30 days
  active.forEach(e => {
    const days = daysUntil(e.renewalDate);
    if (days !== null && days >= 0 && days <= 30) {
      const key = `renewal_${e.id}`;
      if (!isDismissed(dismissed, key)) {
        tips.push({
          key, icon: '🔔',
          text: `${e.name} renews ${days === 0 ? 'today' : `in ${days} day${days === 1 ? '' : 's'}`} — ${fmtMoney(e.amount)} ${e.cycle}`,
          urgency: days <= 7 ? 'high' : 'med',
        });
      }
    }
  });

  // Overdue renewals
  active.forEach(e => {
    const days = daysUntil(e.renewalDate);
    if (days !== null && days < 0) {
      const key = `overdue_${e.id}`;
      if (!isDismissed(dismissed, key)) {
        tips.push({ key, icon: '⚠️', text: `${e.name} renewal date has passed — update it or mark cancelled`, urgency: 'high' });
      }
    }
  });

  // Annual subscriptions — stand out bright
  active.filter(e => e.cycle === 'annual' && e.amount >= 100).forEach(e => {
    const key = `annual_${e.id}`;
    if (!isDismissed(dismissed, key)) {
      tips.push({
        key, icon: '📅',
        text: `${e.name} is ${fmtMoney(e.amount)}/yr — that's ${fmtMoney(toMonthly(e.amount, e.cycle), 2)}/mo`,
        urgency: 'annual',
      });
    }
  });

  // Paused subscriptions
  if (paused.length > 0 && !isDismissed(dismissed, 'paused')) {
    const saving = paused.reduce((s, e) => s + toAnnual(e.amount, e.cycle), 0);
    tips.push({
      key: 'paused', icon: '⏸',
      text: `${paused.length} paused subscription${paused.length !== 1 ? 's' : ''} — cancelling all saves ${fmtMoney(saving, 0)}/yr`,
      urgency: 'med',
    });
  }

  // Convenience overspend
  const convSpend = active.filter(e => e.category === 'convenience').reduce((s, e) => s + toMonthly(e.amount, e.cycle), 0);
  if (convSpend > 50 && !isDismissed(dismissed, 'convenience')) {
    tips.push({ key: 'convenience', icon: '⚡', text: `You're spending ${fmtMoney(convSpend, 0)}/mo on Convenience — the highest-scrutiny category`, urgency: 'med' });
  }

  // Cancelled clutter
  if (cancelled.length > 0 && !isDismissed(dismissed, 'cancelled')) {
    tips.push({ key: 'cancelled', icon: '🗑', text: `${cancelled.length} cancelled item${cancelled.length !== 1 ? 's' : ''} still in the list — delete them to keep things tidy`, urgency: 'low' });
  }

  // Top spender ≥ 30%
  if (active.length >= 3 && !isDismissed(dismissed, 'top_spender')) {
    const sorted = [...active].sort((a, b) => toMonthly(b.amount, b.cycle) - toMonthly(a.amount, a.cycle));
    const top = sorted[0];
    const totalMo = active.reduce((s, e) => s + toMonthly(e.amount, e.cycle), 0);
    const pct = Math.round((toMonthly(top.amount, top.cycle) / totalMo) * 100);
    if (pct >= 30) {
      tips.push({ key: 'top_spender', icon: '📊', text: `${top.name} is ${pct}% of your monthly spend at ${fmtMoney(toMonthly(top.amount, top.cycle), 2)}/mo`, urgency: 'low' });
    }
  }

  if (!tips.length) return null;

  const order = { high: 0, med: 1, annual: 2, low: 3 };
  tips.sort((a, b) => order[a.urgency] - order[b.urgency]);
  const shown = tips.slice(0, 4);

  return (
    <div style={{ margin: '12px 16px 4px' }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-fade)', marginBottom: 8 }}>
        Heads up
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {shown.map(tip => {
          const s = URGENCY_STYLE[tip.urgency];
          return (
            <div key={tip.key} style={{
              display: 'flex', gap: 10, alignItems: 'flex-start',
              padding: '9px 10px 9px 12px',
              background: s.bg,
              border: '1px solid var(--rule-soft)',
              borderLeft: `3px solid ${s.border}`,
              borderRadius: '0 8px 6px 0',
            }}>
              <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{tip.icon}</span>
              <span style={{ fontFamily: 'var(--pen)', fontSize: 13, color: s.text, lineHeight: 1.4, flex: 1 }}>
                {tip.urgency === 'annual' && (
                  <span style={{
                    fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.08em',
                    textTransform: 'uppercase', color: GOLD,
                    background: GOLD_BG, border: `1px solid ${GOLD_BORDER}`,
                    borderRadius: 10, padding: '1px 6px',
                    marginRight: 7, verticalAlign: 'middle',
                  }}>ANNUAL</span>
                )}
                {tip.text}
              </span>
              <button
                onClick={() => dismiss(tip.key)}
                title="Dismiss until next month"
                style={{ background: 'none', border: 'none', color: 'var(--ink-fade)', cursor: 'pointer', fontSize: 13, padding: '2px 4px', opacity: 0.4, flexShrink: 0, lineHeight: 1 }}
              >✕</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Expense card ─────────────────────────────────────────────────────────

function ExpenseCard({ expense, onClick }) {
  const cat    = catInfo(expense.category);
  const monthly = toMonthly(expense.amount, expense.cycle);
  const days   = daysUntil(expense.renewalDate);
  const soon   = days !== null && days >= 0 && days <= 30;
  const isCancelled = expense.status === 'cancelled';

  return (
    <div
      onClick={onClick}
      style={{
        border: '1.5px solid var(--rule-soft)',
        borderLeft: `4px solid ${cat ? cat.color : 'var(--rule-soft)'}`,
        borderRadius: '0 10px 8px 0',
        padding: '12px 14px 12px 12px',
        background: 'rgba(255,255,255,0.55)',
        cursor: 'pointer',
        opacity: isCancelled ? 0.55 : 1,
        transition: 'background .12s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.82)'}
      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.55)'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          {cat && <span style={{ fontSize: 16, flexShrink: 0 }}>{cat.emoji}</span>}
          <span style={{
            fontFamily: 'var(--hand)', fontWeight: 700, fontSize: 17,
            color: 'var(--ink)', lineHeight: 1.1,
            textDecoration: isCancelled ? 'line-through' : 'none',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{expense.name}</span>
        </div>
        <StatusBadge status={expense.status} />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px', marginTop: 8, alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-soft)' }}>
          {fmtMoney(expense.amount)}/{cycleInfo(expense.cycle).label.toLowerCase()}
          {expense.cycle !== 'monthly' && monthly > 0 && (
            <span style={{ color: 'var(--ink-fade)', marginLeft: 4 }}>({fmtMoney(monthly, 2)}/mo)</span>
          )}
        </span>

        {expense.who && expense.who.length > 0 && (
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-fade)' }}>
            👤 {expense.who.join(', ')}
          </span>
        )}

        {expense.renewalDate && (
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: soon ? 'var(--terracotta)' : 'var(--ink-fade)' }}>
            {soon ? '🔔 ' : ''}renews {fmtDate(expense.renewalDate)}
          </span>
        )}
      </div>

      {expense.notes && (
        <div style={{
          fontFamily: 'var(--pen)', fontSize: 12, color: 'var(--ink-fade)',
          marginTop: 6, lineHeight: 1.4,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>{expense.notes}</div>
      )}
    </div>
  );
}

// ─── Expense list ─────────────────────────────────────────────────────────

function ExpenseList({ expenses, onEdit, onAdd }) {
  if (!expenses.length) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--ink-soft)' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>💰</div>
        <div style={{ fontFamily: 'var(--hand)', fontSize: 22, marginBottom: 8 }}>
          Where does it all go?
        </div>
        <div style={{ fontFamily: 'var(--pen)', fontSize: 14, marginBottom: 24, color: 'var(--ink-fade)', lineHeight: 1.5 }}>
          Add your recurring expenses — subscriptions, bills,<br />
          memberships — and see the full picture in one place.
        </div>
        <button
          onClick={onAdd}
          style={{
            padding: '10px 22px',
            border: `1.5px solid ${GOLD}`,
            borderRadius: '12px 14px 10px 13px',
            background: GOLD, color: '#fdf9f0',
            fontFamily: 'var(--pen)', fontSize: 14,
            cursor: 'pointer',
          }}
        >＋ Add an expense</button>
      </div>
    );
  }

  const active    = expenses.filter(e => e.status === 'active');
  const paused    = expenses.filter(e => e.status === 'paused');
  const cancelled = expenses.filter(e => e.status === 'cancelled');

  const Section = ({ items, label }) => items.length === 0 ? null : (
    <>
      {label && (
        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-fade)', marginTop: 14, marginBottom: 6 }}>
          {label}
        </div>
      )}
      {items.map(e => <ExpenseCard key={e.id} expense={e} onClick={() => onEdit(e)} />)}
    </>
  );

  return (
    <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Section items={active} label={paused.length || cancelled.length ? 'Active' : null} />
      <Section items={paused} label="Paused" />
      <Section items={cancelled} label="Cancelled" />
    </div>
  );
}

// ─── Expense sheet (add / edit) ───────────────────────────────────────────

function ExpenseSheet({ expense, memberNames, onSave, onDelete, onClose }) {
  const isNew = !expense.id;

  const [name,        setName]        = React.useState(expense.name         || '');
  const [category,    setCategory]    = React.useState(expense.category     || '');
  const [amount,      setAmount]      = React.useState(expense.amount       || '');
  const [cycle,       setCycle]       = React.useState(expense.cycle        || 'monthly');
  const [renewalDate, setRenewalDate] = React.useState(expense.renewalDate  || '');
  const [who,         setWho]         = React.useState(expense.who          || []);
  const [status,      setStatus]      = React.useState(expense.status       || 'active');
  const [notes,       setNotes]       = React.useState(expense.notes        || '');
  const [confirmDel,  setConfirmDel]  = React.useState(false);
  const [error,       setError]       = React.useState('');

  const whoOptions = ['Everyone', ...memberNames];

  function toggleWho(name) {
    setWho(prev => prev.includes(name) ? prev.filter(w => w !== name) : [...prev, name]);
  }

  function handleSave() {
    if (!name.trim())   { setError('Give this expense a name.'); return; }
    if (!amount || isNaN(parseFloat(amount))) { setError('Enter a valid amount.'); return; }
    setError('');
    const data = {
      name: name.trim(), category,
      amount: parseFloat(amount), cycle,
      renewalDate, who, status,
      notes: notes.trim(),
    };
    if (expense.id) data.id = expense.id;
    onSave(data);
  }

  const inputSty = {
    border: '1.5px solid var(--rule)', borderRadius: '5px 7px 4px 6px',
    padding: '9px 12px', fontFamily: 'var(--pen)', fontSize: 14,
    color: 'var(--ink)', background: 'rgba(255,255,255,0.7)',
    outline: 'none', width: '100%',
  };

  const chipBtn = (active, color = GOLD, border = GOLD) => ({
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '5px 12px', border: `1.5px solid ${active ? border : 'var(--rule)'}`,
    borderRadius: 20,
    background: active ? 'rgba(181,137,46,0.14)' : 'rgba(255,255,255,0.5)',
    fontFamily: 'var(--pen)', fontSize: 13,
    color: active ? color : 'var(--ink-soft)',
    cursor: 'pointer', transition: 'all .1s',
  });

  const monthly = toMonthly(amount, cycle);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(24,20,16,.48)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: 'var(--paper)', borderRadius: '18px 18px 4px 4px',
        padding: '20px 18px 36px', width: '100%', maxWidth: 500,
        maxHeight: '92vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontFamily: 'var(--hand)', fontWeight: 700, fontSize: 20, color: 'var(--ink)' }}>
            {isNew ? '＋ New expense' : 'Edit expense'}
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--ink-fade)', lineHeight: 1, padding: 4 }}>✕</button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontFamily: 'var(--hand)', fontSize: 15, color: 'var(--ink-soft)', display: 'block', marginBottom: 5 }}>What is it?</label>
          <input style={inputSty} value={name} onChange={e => setName(e.target.value)} placeholder="Netflix, electric bill, gym membership…" autoFocus={isNew} />
          {error && <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--terracotta)', marginTop: 4 }}>{error}</div>}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontFamily: 'var(--hand)', fontSize: 15, color: 'var(--ink-soft)', display: 'block', marginBottom: 8 }}>Category</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {CATS.map(cat => (
              <button key={cat.id} onClick={() => setCategory(category === cat.id ? '' : cat.id)} style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '5px 12px',
                border: `1.5px solid ${category === cat.id ? cat.border : 'var(--rule)'}`,
                borderRadius: 20,
                background: category === cat.id ? cat.bg : 'rgba(255,255,255,0.5)',
                fontFamily: 'var(--pen)', fontSize: 13,
                color: category === cat.id ? cat.color : 'var(--ink-soft)',
                cursor: 'pointer', transition: 'all .1s',
              }}>
                <span>{cat.emoji}</span> {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ margin: '4px -18px 16px', padding: '16px 18px', background: GOLD_BG, borderTop: '1px solid var(--rule-soft)', borderBottom: '1px solid var(--rule-soft)' }}>
          <div style={{ fontFamily: 'var(--hand)', fontWeight: 700, fontSize: 17, color: 'var(--ink)', marginBottom: 14 }}>Cost &amp; billing</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-fade)', display: 'block', marginBottom: 6 }}>Amount</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--mono)', fontSize: 14, color: 'var(--ink-soft)' }}>$</span>
                <input type="number" min="0" step="0.01" style={{ ...inputSty, paddingLeft: 22 }} value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
              </div>
            </div>
            <div>
              <label style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-fade)', display: 'block', marginBottom: 6 }}>Billing cycle</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {CYCLES.map(c => (
                  <button key={c.id} onClick={() => setCycle(c.id)} style={{
                    padding: '5px 10px', textAlign: 'left',
                    border: `1.5px solid ${cycle === c.id ? GOLD : 'var(--rule)'}`,
                    borderRadius: 8,
                    background: cycle === c.id ? GOLD_BG : 'rgba(255,255,255,0.5)',
                    fontFamily: 'var(--pen)', fontSize: 13,
                    color: cycle === c.id ? GOLD : 'var(--ink-soft)',
                    cursor: 'pointer',
                  }}>{c.label}</button>
                ))}
              </div>
            </div>
          </div>
          {monthly > 0 && (
            <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.55)', borderRadius: 6 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-soft)' }}>
                {fmtMoney(monthly, 2)}/mo · {fmtMoney(monthly * 12, 0)}/yr
              </span>
            </div>
          )}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontFamily: 'var(--hand)', fontSize: 15, color: 'var(--ink-soft)', display: 'block', marginBottom: 5 }}>
            Next renewal date <span style={{ fontFamily: 'var(--mono)', fontSize: 11, opacity: 0.6 }}>(optional)</span>
          </label>
          <input type="date" style={inputSty} value={renewalDate} onChange={e => setRenewalDate(e.target.value)} />
        </div>

        {whoOptions.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontFamily: 'var(--hand)', fontSize: 15, color: 'var(--ink-soft)', display: 'block', marginBottom: 8 }}>Who uses it?</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {whoOptions.map(w => (
                <button key={w} onClick={() => toggleWho(w)} style={chipBtn(who.includes(w))}>
                  {who.includes(w) ? '✓ ' : ''}{w}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginBottom: 18 }}>
          <label style={{ fontFamily: 'var(--hand)', fontSize: 15, color: 'var(--ink-soft)', display: 'block', marginBottom: 8 }}>Status</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {STATUSES.map(s => (
              <button key={s.id} onClick={() => setStatus(s.id)} style={{
                flex: 1, padding: '6px 0',
                border: `1.5px solid ${status === s.id ? s.border : 'var(--rule)'}`,
                borderRadius: 20,
                background: status === s.id ? s.bg : 'rgba(255,255,255,0.5)',
                fontFamily: 'var(--pen)', fontSize: 13,
                color: status === s.id ? s.color : 'var(--ink-soft)',
                cursor: 'pointer', transition: 'all .1s',
              }}>{s.label}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 22 }}>
          <label style={{ fontFamily: 'var(--hand)', fontSize: 15, color: 'var(--ink-soft)', display: 'block', marginBottom: 5 }}>
            Notes <span style={{ fontFamily: 'var(--mono)', fontSize: 11, opacity: 0.6 }}>(optional)</span>
          </label>
          <textarea className="notes-textarea" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Account login, contract end date, why you added it…" style={{ minHeight: 80 }} />
        </div>

        <button onClick={handleSave} style={{
          width: '100%', padding: '11px',
          border: 'none', borderRadius: '6px 8px 5px 7px',
          background: GOLD, color: '#fdf9f0',
          fontFamily: 'var(--pen)', fontSize: 15, cursor: 'pointer',
        }}>
          {isNew ? '＋ Add expense' : 'Save changes'}
        </button>

        {!isNew && (
          <div style={{ marginTop: 12 }}>
            {!confirmDel ? (
              <button onClick={() => setConfirmDel(true)} style={{ width: '100%', padding: '8px', background: 'none', border: '1.5px solid var(--rule-soft)', borderRadius: '6px', fontFamily: 'var(--pen)', fontSize: 13, color: 'var(--ink-fade)', cursor: 'pointer' }}>
                Delete expense
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => onDelete(expense.id)} style={{ flex: 1, padding: '8px', background: 'none', border: '1.5px solid var(--terracotta)', borderRadius: '6px', fontFamily: 'var(--pen)', fontSize: 13, color: 'var(--terracotta)', cursor: 'pointer' }}>Yes, delete</button>
                <button onClick={() => setConfirmDel(false)} style={{ flex: 1, padding: '8px', background: 'none', border: '1.5px solid var(--rule-soft)', borderRadius: '6px', fontFamily: 'var(--pen)', fontSize: 13, color: 'var(--ink-soft)', cursor: 'pointer' }}>Keep it</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── App root ─────────────────────────────────────────────────────────────

function MoneyApp() {
  const { household } = useMoneyAuth();
  const householdId = household?.id;

  const memberNames = React.useMemo(() => {
    if (!household?.memberProfiles) return [];
    return Object.values(household.memberProfiles).map(p => p.displayName).filter(Boolean);
  }, [household]);

  const [expenses, setExpenses] = React.useState(() => loadExpensesLocal());
  const [budget,   setBudget]   = React.useState(() => loadBudgetLocal());
  const [sheet,    setSheet]    = React.useState(null);
  const [showInfo, setShowInfo] = React.useState(false);

  React.useEffect(() => {
    if (!householdId) return;
    const unsubExpenses = subscribeExpenses(householdId, setExpenses);
    const unsubBudget   = subscribeBudget(householdId, setBudget);
    return () => { unsubExpenses(); unsubBudget(); };
  }, [householdId]);

  async function handleSave(data) {
    if (data.id) {
      setExpenses(prev => prev.map(e => e.id === data.id ? { ...e, ...data } : e));
      updateExpense(householdId, data.id, data).catch(console.error);
    } else {
      addExpense(householdId, data).catch(console.error);
    }
    setSheet(null);
  }

  async function handleDelete(id) {
    setExpenses(prev => prev.filter(e => e.id !== id));
    deleteExpense(householdId, id).catch(console.error);
    setSheet(null);
  }

  function handleBudgetChange(categories) {
    setBudget(categories);
    saveBudget(householdId, categories).catch(console.error);
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', background: 'var(--paper)', minHeight: '100vh' }}>
      <Nav onAdd={() => setSheet({})} />

      <div style={{ paddingBottom: 40 }}>
        {expenses.length > 0 && (
          <div style={{ padding: '14px 0 6px' }}>
            <SummaryBar expenses={expenses} onInfo={() => setShowInfo(true)} />
            <Recommendations expenses={expenses} />
          </div>
        )}

        <WhereItGoes budget={budget} onBudgetChange={handleBudgetChange} />

        <ExpenseList
          expenses={expenses}
          onEdit={e => setSheet(e)}
          onAdd={() => setSheet({})}
        />
      </div>

      {sheet !== null && (
        <ExpenseSheet
          expense={sheet}
          memberNames={memberNames}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setSheet(null)}
        />
      )}

      {showInfo && <CategoryInfoModal onClose={() => setShowInfo(false)} />}
    </div>
  );
}

function MoneyRoot() {
  return (
    <MoneyAuthProvider>
      <MoneyApp />
    </MoneyAuthProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<MoneyRoot />);
