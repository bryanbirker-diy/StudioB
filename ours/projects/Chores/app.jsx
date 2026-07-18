// app.jsx — Our Chores
// Make household work visible: what exists, who owns it, how it's done, what it's worth.

const {
  AuthProvider: ChoresAuthProvider,
  useAuth: useChoresAuth,
  getFamilyMembers,
  familyColorById,
  FAMILY_COLORS,
  saveFamilyMembers,
  isHouseholdAdmin,
} = window._oursAuth;

// ─── Constants ──────────────────────────────────────────────────────────────

const FREQUENCIES = [
  { id: 'daily',    label: 'Daily' },
  { id: 'weekly',   label: 'Weekly' },
  { id: 'everyX',   label: 'Every X days' },
  { id: 'monthly',  label: 'Monthly' },
  { id: 'seasonal', label: 'Seasonal' },
  { id: 'custom',   label: 'Custom' },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmtMoney(n) {
  const v = Number(n) || 0;
  return '$' + v.toLocaleString('en-US', { maximumFractionDigits: v % 1 === 0 ? 0 : 2 });
}

function frequencyLabel(freq) {
  if (!freq) return '';
  if (typeof freq === 'string') return freq;
  switch (freq.type) {
    case 'daily':    return 'Daily';
    case 'weekly':   return 'Weekly';
    case 'everyX':   return `Every ${freq.everyXDays || '?'} days`;
    case 'monthly':  return 'Monthly';
    case 'seasonal': return 'Seasonal';
    case 'custom':   return freq.customLabel || 'Custom';
    default:         return '';
  }
}

// Points a chore is worth per completion. Falls back to the legacy weekly-$
// value for chores created before the points switch, so nothing reads as zero.
function chorePoints(chore) {
  if (chore.points !== undefined && chore.points !== null && chore.points !== '') return Number(chore.points) || 0;
  return Number(chore.allowanceWeekly) || 0;
}

// A member's points balance is the running sum of their ledger deltas.
function balanceFor(ledger, memberId) {
  return ledger.reduce((s, e) => (e.memberId === memberId ? s + (Number(e.delta) || 0) : s), 0);
}

// ─── Cadence lock ───────────────────────────────────────────────────────────
// A chore earns points once per its own frequency, then rests until the
// window reopens — the thing that makes "Weekly" mean something, instead of
// being tappable for points ten times in a row. Custom cadences are free text
// ("when soil is dry") and can't be turned into an interval, so they're never
// auto-locked — the family self-polices those.
function frequencyIntervalDays(freq) {
  if (!freq) return 7;
  switch (freq.type) {
    case 'daily':    return 1;
    case 'weekly':   return 7;
    case 'everyX':   return Math.max(1, Number(freq.everyXDays) || 1);
    case 'monthly':  return 30;
    case 'seasonal': return 90;
    case 'custom':   return null;
    default:         return 7;
  }
}

function choreLock(chore) {
  const days = frequencyIntervalDays(chore.frequency);
  if (!days || !chore.lastCompletedAt) return { locked: false };
  const unlockAt = Number(chore.lastCompletedAt) + days * 86400000;
  if (Date.now() >= unlockAt) return { locked: false };
  return { locked: true, unlockAt };
}

function fmtUnlock(unlockAt) {
  const days = Math.ceil((unlockAt - Date.now()) / 86400000);
  if (days <= 1) return 'tomorrow';
  return `in ${days} days`;
}

function fmtLastDone(ts) {
  if (!ts) return '';
  const days = Math.floor((Date.now() - Number(ts)) / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days}d ago`;
}

// "Mom", "Mom & Ava", "Mom, Ava & Dad" — tolerant of the old single-id format
// from before completions could be split.
function fmtLastBy(idsOrId, members) {
  const ids = Array.isArray(idsOrId) ? idsOrId : (idsOrId ? [idsOrId] : []);
  const names = ids.map(id => (members.find(m => m.id === id) || {}).name).filter(Boolean);
  if (!names.length) return '';
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`;
}

// ─── Split claims ───────────────────────────────────────────────────────────
// No pre-assigned ownership — a chore just sits there available to anyone.
// "Who owns it" is purely retrospective: the claims chart and each chore's
// own completion history. Done together, points split evenly among whoever's
// picked in the moment — not a fixed household-size division.
function splitPoints(total, n) {
  return Math.round((Number(total) || 0) / Math.max(1, n || 1));
}

// ─── List priority ──────────────────────────────────────────────────────────
// Sorting is a second signal of what's falling behind, alongside the claims
// chart: never-done and overdue chores (plus daily "quick win" chores, which
// are always due the moment they're open) rise to the top; anything resting
// in its cadence sinks to the bottom.
function choreUrgencyBucket(chore) {
  const lock = choreLock(chore);
  if (lock.locked) return 2; // resting — bottom
  if (!chore.lastCompletedAt) return 0; // never done — top
  if (chore.frequency && chore.frequency.type === 'daily') return 0; // always a quick-win option once open
  const days = frequencyIntervalDays(chore.frequency);
  if (days) {
    const sinceLastDays = (Date.now() - Number(chore.lastCompletedAt)) / 86400000;
    if (sinceLastDays > days) return 0; // overdue relative to its own cadence
  }
  return 1; // available, roughly on schedule
}

function choreStaleDays(chore) {
  if (!chore.lastCompletedAt) return Infinity;
  return (Date.now() - Number(chore.lastCompletedAt)) / 86400000;
}

// A small flag for the row — only shown when it's genuinely informative;
// a daily chore just being open isn't "overdue," it's just today's option.
function choreFlag(chore) {
  if (!chore.lastCompletedAt) return 'Never done';
  if (choreLock(chore).locked) return null;
  if (chore.frequency && chore.frequency.type === 'daily') return null;
  const days = frequencyIntervalDays(chore.frequency);
  if (days) {
    const overdueBy = Math.floor((Date.now() - Number(chore.lastCompletedAt)) / 86400000) - days;
    if (overdueBy > 0) return `${overdueBy}d overdue`;
  }
  return null;
}

// ─── Claims period ──────────────────────────────────────────────────────────
// The dashboard chart is built from actual ledger "earn" events (who really
// did the work), not the static owner snapshot — filterable by a rolling
// window so it reflects recent behavior, not all-time history.
const PERIODS = [
  { id: '30', label: '30D', days: 30 },
  { id: '60', label: '60D', days: 60 },
  { id: '90', label: '90D', days: 90 },
  { id: 'ytd', label: 'YTD', days: null },
];

function periodStart(periodId) {
  if (periodId === 'ytd') {
    const d = new Date(); d.setMonth(0, 1); d.setHours(0, 0, 0, 0);
    return d.getTime();
  }
  const days = (PERIODS.find(p => p.id === periodId) || PERIODS[0]).days || 30;
  return Date.now() - days * 86400000;
}

// Ledger entries persisted through Firestore resolve createdAt as a Timestamp
// (has .toMillis()); optimistic local entries use a plain epoch number.
function entryTimeMs(e) {
  const t = e && e.createdAt;
  if (!t) return Date.now();
  if (typeof t === 'number') return t;
  if (typeof t.toMillis === 'function') return t.toMillis();
  if (typeof t.seconds === 'number') return t.seconds * 1000 + Math.floor((t.nanoseconds || 0) / 1e6);
  return Date.now();
}

// ─── Nav ────────────────────────────────────────────────────────────────────

function Nav({ onAdd, onData, canAddChore }) {
  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'var(--navy)', color: 'var(--paper)',
      display: 'flex', alignItems: 'center',
      padding: '14px 18px', gap: 14,
    }}>
      <a href="../../" style={{
        fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 12,
        color: 'var(--paper)', textDecoration: 'none',
        letterSpacing: '0.16em', textTransform: 'uppercase', flexShrink: 0, opacity: 0.85,
      }}>← ours</a>
      <span style={{
        fontFamily: 'var(--sans)', fontWeight: 900, fontSize: 16,
        letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--paper)', flex: 1,
      }}>Our Chores</span>
      <button
        onClick={onData}
        title="Import / Export"
        style={{
          padding: '8px 12px', borderRadius: 0,
          border: '1px solid var(--paper)', background: 'transparent',
          color: 'var(--paper)', fontFamily: 'var(--sans)', fontWeight: 700,
          fontSize: 15, lineHeight: 1, cursor: 'pointer',
        }}
      >⋯</button>
      {canAddChore && (
        <button
          onClick={onAdd}
          style={{
            padding: '8px 16px', borderRadius: 0,
            border: '1px solid var(--paper)', background: 'transparent',
            color: 'var(--paper)', fontFamily: 'var(--sans)', fontWeight: 700,
            fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >＋ Chore</button>
      )}
    </nav>
  );
}

// ─── Claims pie (the centerpiece) ────────────────────────────────────────────
// Built from actual completions (ledger "earn" events) in the selected
// window, not the static ownership snapshot — this answers "who's really
// doing the work," which a point-in-time owner list can't.

function PeriodToggle({ period, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
      {PERIODS.map(p => (
        <button key={p.id} onClick={() => onChange(p.id)} style={{
          padding: '6px 12px', borderRadius: 0, cursor: 'pointer',
          border: `1px solid ${period === p.id ? 'var(--accent)' : 'var(--rule)'}`,
          background: period === p.id ? 'color-mix(in oklch, var(--accent) 10%, transparent)' : 'var(--card)',
          fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase',
          color: period === p.id ? 'var(--navy)' : 'var(--ink-2)',
        }}>{p.label}</button>
      ))}
    </div>
  );
}

function ClaimsPie({ ledger, members, period }) {
  const since = periodStart(period);
  const earns = ledger.filter(e => e.type === 'earn' && entryTimeMs(e) >= since);

  const slices = members.map(m => {
    const mine = earns.filter(e => e.memberId === m.id);
    return {
      id: m.id, name: m.name, color: familyColorById(m.colorId),
      count: mine.length,
      points: mine.reduce((s, e) => s + (Number(e.delta) || 0), 0),
    };
  }).filter(m => m.count > 0).sort((a, b) => b.count - a.count);

  const total = earns.length;
  if (!total) {
    return (
      <div style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink-fade)', padding: '8px 0 4px' }}>
        No completions logged in this window yet — mark a chore done to see who's claiming the work.
      </div>
    );
  }

  const size = 176, cx = size / 2, cy = size / 2, outerR = 74, innerR = 47;
  let angle = -Math.PI / 2;
  const paths = slices.map((s, i) => {
    const frac = s.count / total;
    const sa = angle;
    const da = frac * 2 * Math.PI;
    angle += da;
    if (frac >= 0.9999) {
      return <circle key={i} cx={cx} cy={cy} r={outerR} fill={s.color} stroke="var(--paper)" strokeWidth="2" />;
    }
    const x1 = cx + outerR * Math.cos(sa),    y1 = cy + outerR * Math.sin(sa);
    const x2 = cx + outerR * Math.cos(angle), y2 = cy + outerR * Math.sin(angle);
    return (
      <path key={i}
        d={`M ${cx} ${cy} L ${x1} ${y1} A ${outerR} ${outerR} 0 ${da > Math.PI ? 1 : 0} 1 ${x2} ${y2} Z`}
        fill={s.color} stroke="var(--paper)" strokeWidth="2"
      />
    );
  });

  return (
    <div style={{ display: 'flex', gap: 22, alignItems: 'center', flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {paths}
          <circle cx={cx} cy={cy} r={innerR} fill="var(--card)" />
          <text x={cx} y={cy - 4} textAnchor="middle" style={{ fontFamily: 'var(--sans)', fontWeight: 900, fontSize: 30, fill: 'var(--navy)' }}>{total}</text>
          <text x={cx} y={cy + 16} textAnchor="middle" style={{ fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 9, letterSpacing: '0.14em', fill: 'var(--ink-2)' }}>CLAIMS</text>
        </svg>
      </div>

      <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {slices.map(s => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 12, height: 12, background: s.color, flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 13, color: 'var(--navy)', flex: 1, textTransform: 'uppercase', letterSpacing: '0.02em' }}>{s.name}</span>
            <span style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--ink-2)', fontVariantNumeric: 'tabular-nums' }}>
              {s.count} · {Math.round((s.count / total) * 100)}% · {s.points} pts
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Chore row (editorial index row, expandable) ─────────────────────────────

function ChoreRow({ chore, members, expanded, onToggle, onEdit, onDone, onReset, bonusMult = 1, canEdit = true }) {
  const lock = choreLock(chore);
  const flag = choreFlag(chore);
  const pts  = chorePoints(chore) * bonusMult;
  const lastByText = fmtLastBy(chore.lastCompletedBy, members);
  const edge = flag ? 'var(--accent)' : (chore.lastCompletedAt ? 'var(--navy)' : 'var(--rule)');

  return (
    <div style={{ borderBottom: '1px solid var(--rule)', borderLeft: `3px solid ${edge}` }}>
      {/* Collapsed header */}
      <div
        onClick={onToggle}
        style={{
          display: 'grid', gridTemplateColumns: '1fr auto auto',
          alignItems: 'center', gap: 14,
          padding: '16px 14px 16px 12px', cursor: 'pointer',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 16, color: 'var(--navy)', lineHeight: 1.2 }}>
            {chore.name}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 12px', marginTop: 4, alignItems: 'center' }}>
            {flag && (
              <span style={{ fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)' }}>{flag}</span>
            )}
            {chore.frequency && (
              <span style={{ fontFamily: 'var(--sans)', fontSize: 11, color: 'var(--ink-2)' }}>{frequencyLabel(chore.frequency)}</span>
            )}
            {chore.estimatedTime && (
              <span style={{ fontFamily: 'var(--sans)', fontSize: 11, color: 'var(--ink-fade)' }}>{chore.estimatedTime}</span>
            )}
            {lastByText && (
              <span style={{ fontFamily: 'var(--sans)', fontSize: 11, color: 'var(--ink-fade)' }}>{lastByText} · {fmtLastDone(chore.lastCompletedAt)}</span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {pts > 0 && (
            <div style={{ fontFamily: 'var(--sans)', fontWeight: 900, fontSize: 16, color: 'var(--navy)', lineHeight: 1, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
              {pts}<span style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-2)' }}> pts</span>{bonusMult > 1 ? <span style={{ color: 'var(--accent)' }}> ⚡</span> : null}
            </div>
          )}
          {lock.locked ? (
            <div style={{ fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-fade)', whiteSpace: 'nowrap' }}>
              opens {fmtUnlock(lock.unlockAt)}
            </div>
          ) : (
            <button
              onClick={e => { e.stopPropagation(); onDone(chore); }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '7px 11px', borderRadius: 0, cursor: 'pointer',
                border: '1px solid var(--navy)', background: 'var(--navy)', color: 'var(--paper)',
                fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}
            >✓ Done</button>
          )}
        </div>

        <span style={{
          color: 'var(--accent)', fontSize: 18, lineHeight: 1,
          transition: 'transform 0.3s var(--ease)', transform: expanded ? 'rotate(90deg)' : 'none',
        }}>→</span>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div style={{ padding: '0 14px 18px 12px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {chore.description && (
            <div style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
              {chore.description}
            </div>
          )}

          {/* Standards / links */}
          {chore.links && chore.links.length > 0 && (
            <div>
              <div style={{ fontFamily: 'var(--sans)', fontWeight: 800, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8 }}>
                How it's done
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {chore.links.map((l, i) => (
                  <a key={i} href={l.url} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--navy)', textDecoration: 'none', borderBottom: '1px solid var(--rule)', paddingBottom: 4 }}>
                    <span style={{ color: 'var(--accent)' }}>→</span>{l.label || l.url}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Resting: already earned this cadence */}
          {lock.locked && (
            <div style={{ background: 'var(--paper-2)', border: '1px solid var(--rule)', padding: '10px 12px', fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.5 }}>
              Already done this cadence{lastByText ? ` by ${lastByText}` : ''} — opens again {fmtUnlock(lock.unlockAt)}.
              {' '}Did it happen again already? Ask a parent to award the extra in Manage,
              {' '}or <button onClick={() => onReset(chore.id)} style={{ ...textBtn, display: 'inline', textTransform: 'none', letterSpacing: 0, fontWeight: 700, textDecoration: 'underline' }}>reset availability</button>.
            </div>
          )}

          {canEdit && (
            <div style={{ borderTop: '1px solid var(--rule)', paddingTop: 12 }}>
              <button onClick={() => onEdit(chore)} style={textBtn}>Edit chore</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const textBtn = {
  background: 'none', border: 'none', cursor: 'pointer',
  fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 11,
  letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-2)',
  padding: 0,
};

// ─── Create / edit sheet ─────────────────────────────────────────────────────

function ChoreSheet({ chore, onSave, onDelete, onClose }) {
  const isNew = !chore.id;
  const [name,     setName]     = React.useState(chore.name || '');
  const [desc,     setDesc]     = React.useState(chore.description || '');
  const [points,   setPoints]   = React.useState(chore.points != null ? chore.points : (chore.allowanceWeekly != null ? chore.allowanceWeekly : ''));
  const [estTime,  setEstTime]  = React.useState(chore.estimatedTime || '');
  const [freqType, setFreqType] = React.useState((chore.frequency && chore.frequency.type) || 'weekly');
  const [everyX,   setEveryX]   = React.useState((chore.frequency && chore.frequency.everyXDays) || 3);
  const [customLbl,setCustomLbl]= React.useState((chore.frequency && chore.frequency.customLabel) || '');
  const [links,    setLinks]    = React.useState(chore.links && chore.links.length ? chore.links : []);
  const [confirmDel, setConfirmDel] = React.useState(false);
  const [error,    setError]    = React.useState('');

  function buildFrequency() {
    if (freqType === 'everyX')  return { type: 'everyX', everyXDays: Number(everyX) || 1 };
    if (freqType === 'custom')  return { type: 'custom', customLabel: customLbl.trim() };
    return { type: freqType };
  }

  function handleSave() {
    if (!name.trim()) { setError('Give this chore a name.'); return; }
    const data = {
      name: name.trim(),
      description: desc.trim(),
      points: points === '' ? 0 : Number(String(points).replace(/[^0-9.]/g, '')) || 0,
      estimatedTime: estTime.trim(),
      frequency: buildFrequency(),
      links: links.filter(l => (l.url || '').trim()),
    };
    if (chore.id) data.id = chore.id;
    onSave(data);
  }

  function addLink()      { setLinks(prev => [...prev, { label: '', url: '' }]); }
  function setLink(i, k, v){ setLinks(prev => prev.map((l, j) => j === i ? { ...l, [k]: v } : l)); }
  function removeLink(i)  { setLinks(prev => prev.filter((_, j) => j !== i)); }

  const label = { fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-2)', display: 'block', marginBottom: 8 };
  const chip = (active) => ({
    padding: '6px 13px', borderRadius: 0, cursor: 'pointer',
    border: `1px solid ${active ? 'var(--accent)' : 'var(--rule)'}`,
    background: active ? 'color-mix(in oklch, var(--accent) 12%, transparent)' : 'var(--card)',
    fontFamily: 'var(--sans)', fontWeight: 600, fontSize: 13,
    color: active ? 'var(--navy)' : 'var(--ink-soft)',
  });

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'oklch(21% 0.045 262 / 0.55)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}>
      <div style={{
        background: 'var(--paper)', borderTop: '5px solid var(--navy)', borderRadius: 0,
        padding: '20px 18px 36px', width: '100%', maxWidth: 520,
        maxHeight: '92vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontFamily: 'var(--sans)', fontWeight: 900, fontSize: 22, color: 'var(--navy)', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
            {isNew ? 'New chore' : 'Edit chore'}<span style={{ color: 'var(--accent)' }}>.</span>
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--ink-fade)', padding: 4 }}>✕</button>
        </div>

        {/* Name */}
        <div style={{ marginBottom: 16 }}>
          <label style={label}>What's the chore?</label>
          <input className="text-input" value={name} onChange={e => setName(e.target.value)} placeholder="Take out the trash, clean the bathroom…" autoFocus={isNew} style={{ fontSize: 16 }} />
          {error && <div style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--accent)', marginTop: 4 }}>{error}</div>}
        </div>

        {/* Description */}
        <div style={{ marginBottom: 16 }}>
          <label style={label}>Description</label>
          <textarea className="notes-textarea" value={desc} onChange={e => setDesc(e.target.value)} placeholder="What does 'done' look like?" style={{ minHeight: 70 }} />
        </div>

        {/* Points + estimated time */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 6 }}>
          <div>
            <label style={label}>Points <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400, color: 'var(--ink-fade)' }}>(per completion)</span></label>
            <input className="text-input" type="number" min="0" value={points} onChange={e => setPoints(e.target.value)} placeholder="0" />
          </div>
          <div>
            <label style={label}>Est. time</label>
            <input className="text-input" value={estTime} onChange={e => setEstTime(e.target.value)} placeholder="20 min" />
          </div>
        </div>
        <div style={{ fontFamily: 'var(--sans)', fontSize: 11, color: 'var(--ink-fade)', marginBottom: 16, lineHeight: 1.4 }}>
          Done together? Whoever marks it done can split these points between everyone who helped.
        </div>

        {/* Frequency */}
        <div style={{ marginBottom: 16 }}>
          <label style={label}>How often?</label>
          <div style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--ink-2)', marginBottom: 8, lineHeight: 1.4 }}>
            Points can be earned once per cadence — done once this week, it rests until next week.
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {FREQUENCIES.map(f => (
              <button key={f.id} onClick={() => setFreqType(f.id)} style={chip(freqType === f.id)}>{f.label}</button>
            ))}
          </div>
          {freqType === 'everyX' && (
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-soft)' }}>Every</span>
              <input className="text-input" type="number" min="1" value={everyX} onChange={e => setEveryX(e.target.value)} style={{ width: 72 }} />
              <span style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-soft)' }}>days</span>
            </div>
          )}
          {freqType === 'custom' && (
            <>
              <input className="text-input" value={customLbl} onChange={e => setCustomLbl(e.target.value)} placeholder="e.g. Before guests visit" style={{ marginTop: 8 }} />
              <div style={{ fontFamily: 'var(--sans)', fontSize: 11, color: 'var(--ink-fade)', marginTop: 6, lineHeight: 1.4 }}>
                Custom cadence isn't on a schedule, so it isn't auto-limited — it can be marked done anytime.
              </div>
            </>
          )}
        </div>

        {/* Standards / links */}
        <div style={{ marginBottom: 20 }}>
          <label style={label}>Standards &amp; links</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {links.map((l, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input className="text-input" value={l.label} onChange={e => setLink(i, 'label', e.target.value)} placeholder="Label" style={{ flex: 1 }} />
                <input className="text-input" value={l.url} onChange={e => setLink(i, 'url', e.target.value)} placeholder="https://…" style={{ flex: 2 }} />
                <button onClick={() => removeLink(i)} style={{ background: 'none', border: 'none', color: 'var(--ink-fade)', cursor: 'pointer', fontSize: 14, padding: '0 4px' }}>✕</button>
              </div>
            ))}
            <button onClick={addLink} style={{ ...chip(false), borderStyle: 'dashed', alignSelf: 'flex-start', color: 'var(--ink-2)' }}>
              ＋ Add link (checklist, video, doc…)
            </button>
          </div>
        </div>

        {/* Save */}
        <button onClick={handleSave} style={{
          width: '100%', padding: '14px', borderRadius: 0,
          border: '1px solid var(--navy)', background: 'var(--navy)', color: 'var(--paper)',
          fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 13,
          letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer',
        }}>{isNew ? 'Add chore' : 'Save changes'}</button>

        {!isNew && (
          <div style={{ marginTop: 12 }}>
            {!confirmDel ? (
              <button onClick={() => setConfirmDel(true)} style={{ width: '100%', padding: '10px', background: 'none', border: '1px solid var(--rule)', borderRadius: 0, fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-fade)', cursor: 'pointer' }}>Delete chore</button>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => onDelete(chore.id)} style={{ flex: 1, padding: '10px', background: 'none', border: '1px solid var(--accent)', borderRadius: 0, fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent)', cursor: 'pointer' }}>Yes, delete</button>
                <button onClick={() => setConfirmDel(false)} style={{ flex: 1, padding: '10px', background: 'none', border: '1px solid var(--rule)', borderRadius: 0, fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-soft)', cursor: 'pointer' }}>Keep it</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState({ onAdd, onImport }) {
  return (
    <div style={{ textAlign: 'center', padding: '64px 24px' }}>
      <div style={{ fontFamily: 'var(--sans)', fontWeight: 800, fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 14 }}>
        No chores yet
      </div>
      <div style={{ fontFamily: 'var(--sans)', fontWeight: 900, fontSize: 'clamp(30px, 8vw, 44px)', lineHeight: 0.95, letterSpacing: '-0.025em', textTransform: 'uppercase', color: 'var(--navy)', marginBottom: 14 }}>
        Make the work<br />visible<span style={{ color: 'var(--accent)' }}>.</span>
      </div>
      <div style={{ fontFamily: 'var(--sans)', fontSize: 15, color: 'var(--ink-2)', maxWidth: 380, margin: '0 auto 26px', lineHeight: 1.5 }}>
        Start building your family's shared responsibilities — what needs doing, how it's done, and what it's worth.
      </div>
      <button onClick={onAdd} style={{
        padding: '13px 26px', borderRadius: 0,
        border: '1px solid var(--navy)', background: 'var(--navy)', color: 'var(--paper)',
        fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer',
      }}>Create first chore</button>
      <div style={{ marginTop: 16 }}>
        <button onClick={onImport} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-2)' }}>
          or import a list →
        </button>
      </div>
    </div>
  );
}

// ─── Import / export ─────────────────────────────────────────────────────────
// CSV is the primary format — it opens directly in Excel/Sheets for offline
// editing, which is the point (unlike JSON, which nobody hand-edits). Legacy
// JSON exports (from before this change) are still accepted on import.

const CSV_HEADER = ['Chore Name', 'Description', 'Points', 'Estimated Time', 'Frequency', 'Every X Days', 'Links'];

function csvEscape(val) {
  const s = String(val === undefined || val === null ? '' : val);
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function frequencyToCsvCells(freq) {
  const f = freq || { type: 'weekly' };
  switch (f.type) {
    case 'daily':    return ['Daily', ''];
    case 'weekly':   return ['Weekly', ''];
    case 'monthly':  return ['Monthly', ''];
    case 'seasonal': return ['Seasonal', ''];
    case 'everyX':   return ['Every X Days', String(f.everyXDays || '')];
    case 'custom':   return [f.customLabel || 'Custom', ''];
    default:         return ['Weekly', ''];
  }
}

// "Label - https://url, Another - https://url2" — readable in a spreadsheet cell.
function linksToCsvCell(links) {
  return (links || []).map(l => (l.label ? `${l.label} - ${l.url}` : l.url)).join(' | ');
}
function csvCellToLinks(cell) {
  if (!cell) return [];
  return cell.split('|').map(s => s.trim()).filter(Boolean).map(entry => {
    const i = entry.indexOf(' - ');
    return i === -1 ? { label: '', url: entry } : { label: entry.slice(0, i).trim(), url: entry.slice(i + 3).trim() };
  });
}

function choresToCsv(chores) {
  const rows = [CSV_HEADER];
  chores.forEach(c => {
    const [freqCell, everyXCell] = frequencyToCsvCells(c.frequency);
    rows.push([
      c.name || '', c.description || '',
      chorePoints(c),
      c.estimatedTime || '',
      freqCell, everyXCell,
      linksToCsvCell(c.links),
    ]);
  });
  // ﻿ (UTF-8 BOM) so Excel on Windows renders accented/special characters correctly.
  return '﻿' + rows.map(r => r.map(csvEscape).join(',')).join('\r\n');
}

// Minimal RFC4180-ish parser: handles quoted fields with embedded commas,
// quotes ("" = literal "), and newlines.
function parseCsvRows(text) {
  const rows = []; let row = []; let field = ''; let inQuotes = false;
  const t = text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text; // strip BOM
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (inQuotes) {
      if (ch === '"') { if (t[i + 1] === '"') { field += '"'; i++; } else inQuotes = false; }
      else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\r') { /* skip; \n closes the row */ }
    else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else field += ch;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => !(r.length === 1 && r[0].trim() === ''));
}

function csvToChores(text) {
  const rows = parseCsvRows(text);
  if (rows.length < 2) return [];
  const header = rows[0].map(h => h.trim().toLowerCase());
  const col = (...names) => { for (const n of names) { const i = header.indexOf(n); if (i !== -1) return i; } return -1; };
  const iName  = col('chore name', 'name');
  const iDesc  = col('description');
  const iPay   = col('points', 'weekly pay', 'allowance', 'pay');
  const iTime  = col('estimated time', 'time');
  const iFreq  = col('frequency');
  const iEveryX= col('every x days');
  const iLinks = col('links');
  const get = (cells, i) => (i === -1 ? '' : (cells[i] || '').trim());

  const out = [];
  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r];
    const name = get(cells, iName);
    if (!name) continue;
    const freqRaw = get(cells, iFreq), freqNorm = freqRaw.toLowerCase();
    let frequency;
    if (!freqRaw)                                       frequency = { type: 'weekly' };
    else if (freqNorm === 'daily')                       frequency = { type: 'daily' };
    else if (freqNorm === 'weekly')                       frequency = { type: 'weekly' };
    else if (freqNorm === 'monthly')                      frequency = { type: 'monthly' };
    else if (freqNorm === 'seasonal')                     frequency = { type: 'seasonal' };
    else if (freqNorm.startsWith('every'))                frequency = { type: 'everyX', everyXDays: Number(get(cells, iEveryX)) || 1 };
    else                                                  frequency = { type: 'custom', customLabel: freqRaw };

    out.push({
      name: name.slice(0, 200),
      description: get(cells, iDesc),
      points: Number(String(get(cells, iPay)).replace(/[^0-9.]/g, '')) || 0,
      estimatedTime: get(cells, iTime),
      frequency,
      links: csvCellToLinks(get(cells, iLinks)),
    });
  }
  return out;
}

// Legacy support for the original JSON export format (drops shared/owner
// fields from older exports — that model no longer exists).
function jsonToChores(text) {
  const data = JSON.parse(text);
  const arr = Array.isArray(data) ? data : (data && data.chores) || [];
  return arr.filter(c => c && c.name).map(c => ({
    name: String(c.name).slice(0, 200), description: c.description || '',
    points: c.points != null ? Number(c.points) || 0 : Number(c.allowanceWeekly) || 0,
    estimatedTime: c.estimatedTime || '',
    frequency: (c.frequency && c.frequency.type) ? c.frequency : { type: 'weekly' },
    links: Array.isArray(c.links) ? c.links.filter(l => l && l.url) : [],
  }));
}

function textToChores(text) {
  const t = text.trim();
  return (t.startsWith('{') || t.startsWith('[')) ? jsonToChores(text) : csvToChores(text);
}

function downloadText(filename, text, mime) {
  const blob = new Blob([text], { type: mime || 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 120);
}

const dataSolidBtn   = { flex: 1, padding: '12px', borderRadius: 0, border: '1px solid var(--navy)', background: 'var(--navy)', color: 'var(--paper)', fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' };
const dataOutlineBtn = { flex: 1, padding: '12px', borderRadius: 0, border: '1px solid var(--navy)', background: 'transparent', color: 'var(--navy)', fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' };

function DataSheet({ chores, onImport, onClose }) {
  const [tab, setTab]     = React.useState('export');
  const [paste, setPaste] = React.useState('');
  const [msg, setMsg]     = React.useState('');
  const fileRef = React.useRef(null);
  const exportText = React.useMemo(() => choresToCsv(chores), [chores]);

  function copyExport() {
    navigator.clipboard.writeText(exportText).then(() => setMsg('Copied to clipboard.')).catch(() => setMsg('Copy failed — select the text and copy manually.'));
  }
  function doImport(text) {
    try {
      const defs = textToChores(text);
      if (!defs.length) { setMsg('No chores found in that data — check the header row matches.'); return; }
      onImport(defs);
      setMsg(`Imported ${defs.length} chore${defs.length === 1 ? '' : 's'}.`);
      setTimeout(onClose, 700);
    } catch (e) { setMsg('Could not read that file — is it a valid CSV?'); }
  }
  function onFile(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => doImport(String(r.result || ''));
    r.readAsText(f);
  }

  const tabBtn = (id, txt) => (
    <button onClick={() => { setTab(id); setMsg(''); }} style={{
      flex: 1, padding: '10px', borderRadius: 0, cursor: 'pointer', border: 'none',
      borderBottom: `2px solid ${tab === id ? 'var(--accent)' : 'var(--rule)'}`,
      background: 'none', fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 12,
      letterSpacing: '0.1em', textTransform: 'uppercase', color: tab === id ? 'var(--accent)' : 'var(--ink-2)',
    }}>{txt}</button>
  );

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'oklch(21% 0.045 262 / 0.55)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}>
      <div style={{ background: 'var(--paper)', borderTop: '5px solid var(--navy)', borderRadius: 0, padding: '20px 18px 32px', width: '100%', maxWidth: 520, maxHeight: '92vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontFamily: 'var(--sans)', fontWeight: 900, fontSize: 22, color: 'var(--navy)', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>Import / Export<span style={{ color: 'var(--accent)' }}>.</span></span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--ink-fade)', padding: 4 }}>✕</button>
        </div>

        <div style={{ display: 'flex', marginBottom: 16 }}>
          {tabBtn('export', 'Export')}
          {tabBtn('import', 'Import')}
        </div>

        {tab === 'export' ? (
          <div>
            <div style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-2)', marginBottom: 12, lineHeight: 1.5 }}>
              Download as a spreadsheet — open it in Excel or Google Sheets to edit offline, then import it back. Also handy to share a starter list with another family.
            </div>
            <textarea readOnly value={exportText} className="notes-textarea" style={{ minHeight: 160, fontFamily: 'ui-monospace, monospace', fontSize: 12 }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={copyExport} style={dataSolidBtn}>Copy CSV</button>
              <button onClick={() => downloadText('our-chores.csv', exportText, 'text/csv;charset=utf-8;')} style={dataOutlineBtn}>Download .csv</button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-2)', marginBottom: 12, lineHeight: 1.5 }}>
              Choose a .csv file (from Excel/Sheets), or paste CSV text. Columns: {CSV_HEADER.join(', ')}. Imported chores are added fresh, ready to mark done.
            </div>
            <textarea value={paste} onChange={e => setPaste(e.target.value)} placeholder="Paste CSV here…" className="notes-textarea" style={{ minHeight: 140, fontFamily: 'ui-monospace, monospace', fontSize: 12 }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={() => doImport(paste)} style={dataSolidBtn}>Import pasted</button>
              <button onClick={() => fileRef.current && fileRef.current.click()} style={dataOutlineBtn}>Choose file</button>
              <input ref={fileRef} type="file" accept=".csv,text/csv,.json,application/json" onChange={onFile} style={{ display: 'none' }} />
            </div>
          </div>
        )}

        {msg && <div style={{ marginTop: 14, fontFamily: 'var(--sans)', fontSize: 12, fontWeight: 600, color: 'var(--navy)' }}>{msg}</div>}
      </div>
    </div>
  );
}

// ─── Points: completion, rewards, wallet ─────────────────────────────────────

function Modal({ title, onClose, children, maxWidth = 460 }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'oklch(21% 0.045 262 / 0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: 'var(--paper)', borderTop: '5px solid var(--navy)', borderRadius: 0, padding: '20px 18px 28px', width: '100%', maxWidth, maxHeight: '92vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontFamily: 'var(--sans)', fontWeight: 900, fontSize: 20, color: 'var(--navy)', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>{title}<span style={{ color: 'var(--accent)' }}>.</span></span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--ink-fade)', padding: 4 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const eyebrow    = { fontFamily: 'var(--sans)', fontWeight: 800, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 12 };
const primaryBtn = { padding: '11px 16px', borderRadius: 0, border: '1px solid var(--navy)', background: 'var(--navy)', color: 'var(--paper)', fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' };
const smallBtn   = { padding: '7px 12px', borderRadius: 0, border: '1px solid var(--navy)', background: 'transparent', color: 'var(--navy)', fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap' };

function MemberChip({ m, onClick, disabled, suffix, highlight }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 0,
      cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.4 : 1,
      border: `1px solid ${highlight ? 'var(--accent)' : 'var(--rule)'}`, background: 'var(--card)',
      fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 13, color: 'var(--navy)', textTransform: 'uppercase', letterSpacing: '0.02em',
    }}>
      <span style={{ width: 12, height: 12, background: familyColorById(m.colorId), flexShrink: 0 }} />{m.name}{suffix ? <span style={{ color: 'var(--ink-2)', fontWeight: 600 }}> · {suffix}</span> : null}
    </button>
  );
}

function CompletionSheet({ chore, members, bonusMult = 1, onComplete, onAddMember, onClose }) {
  const [selected, setSelected] = React.useState([]);
  const total = chorePoints(chore) * bonusMult;
  const each = splitPoints(total, selected.length || 1);

  function toggle(id) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }
  function handleAdd() {
    const nm = (prompt('Family member name?') || '').trim();
    if (nm) { const created = onAddMember(nm); if (created) setSelected(prev => [...prev, created.id]); }
  }

  return (
    <Modal title="Who did it?" onClose={onClose}>
      <div style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink-2)', marginBottom: 14, lineHeight: 1.5 }}>
        <strong style={{ color: 'var(--navy)' }}>{chore.name}</strong> — earns <strong style={{ color: 'var(--accent)' }}>{total} pts</strong>{bonusMult > 1 ? <span style={{ color: 'var(--accent)', fontWeight: 800 }}> ⚡{bonusMult}×</span> : null}. Tap everyone who helped — done together, points split evenly.
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {members.map(m => (
          <MemberChip key={m.id} m={m} highlight={selected.includes(m.id)} onClick={() => toggle(m.id)} />
        ))}
        <button onClick={handleAdd} style={{ ...smallBtn, border: '1px dashed var(--ink-2)', color: 'var(--ink-2)' }}>＋ Add person</button>
      </div>
      {selected.length > 0 && (
        <div style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-2)', marginBottom: 14 }}>
          {selected.length === 1 ? `${each} pts to them.` : `Split ${selected.length} ways — ${each} pts each.`}
        </div>
      )}
      <button
        onClick={() => selected.length && onComplete(chore, selected)}
        disabled={!selected.length}
        style={{ ...primaryBtn, width: '100%', padding: '14px', opacity: selected.length ? 1 : 0.4, cursor: selected.length ? 'pointer' : 'default' }}
      >{selected.length ? 'Confirm' : 'Select who did it'}</button>
    </Modal>
  );
}

function RedeemSheet({ reward, members, ledger, onRedeem, onClose }) {
  const noneAfford = members.length > 0 && members.every(m => balanceFor(ledger, m.id) < reward.cost);
  return (
    <Modal title="Redeem" onClose={onClose}>
      <div style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink-2)', marginBottom: 14, lineHeight: 1.5 }}>
        <strong style={{ color: 'var(--navy)' }}>{reward.name}</strong> costs <strong style={{ color: 'var(--accent)' }}>{reward.cost} pts</strong>. Who's cashing in?
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {members.map(m => {
          const bal = balanceFor(ledger, m.id);
          return <MemberChip key={m.id} m={m} disabled={bal < reward.cost} suffix={`${bal} pts`} onClick={() => onRedeem(reward, m)} />;
        })}
      </div>
      {noneAfford && <div style={{ marginTop: 12, fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--ink-fade)' }}>Nobody has enough points for this yet.</div>}
    </Modal>
  );
}

function RewardEditSheet({ reward, onSave, onDelete, onClose }) {
  const isNew = !reward.id;
  const [name, setName] = React.useState(reward.name || '');
  const [cost, setCost] = React.useState(reward.cost != null ? reward.cost : '');
  const label = { fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-2)', display: 'block', marginBottom: 8 };
  return (
    <Modal title={isNew ? 'New reward' : 'Edit reward'} onClose={onClose}>
      <div style={{ marginBottom: 16 }}>
        <label style={label}>Reward</label>
        <input className="text-input" value={name} onChange={e => setName(e.target.value)} placeholder="Movie night, 1 hr screen time, $10 cash…" autoFocus />
      </div>
      <div style={{ marginBottom: 20 }}>
        <label style={label}>Cost (points)</label>
        <input className="text-input" type="number" min="0" value={cost} onChange={e => setCost(e.target.value)} placeholder="100" />
      </div>
      <button onClick={() => { if (!name.trim()) return; onSave({ id: reward.id, name: name.trim(), cost: Number(cost) || 0 }); }} style={{ ...primaryBtn, width: '100%', padding: '14px' }}>{isNew ? 'Add reward' : 'Save'}</button>
      {!isNew && (
        <button onClick={() => onDelete(reward.id)} style={{ width: '100%', marginTop: 10, padding: '10px', background: 'none', border: '1px solid var(--rule)', borderRadius: 0, fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-fade)', cursor: 'pointer' }}>Delete reward</button>
      )}
    </Modal>
  );
}

function AdjustSheet({ member, onAdjust, onClose }) {
  const [amount, setAmount] = React.useState('');
  const [reason, setReason] = React.useState('');
  const [dir, setDir]       = React.useState('add');   // give is the common case
  const label = { fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-2)', display: 'block', marginBottom: 8 };
  const dirBtn = (id, txt) => (
    <button onClick={() => setDir(id)} style={{ flex: 1, padding: '10px', borderRadius: 0, cursor: 'pointer', border: `1px solid ${dir === id ? 'var(--accent)' : 'var(--rule)'}`, background: dir === id ? 'color-mix(in oklch, var(--accent) 10%, transparent)' : 'var(--card)', fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--navy)' }}>{txt}</button>
  );
  return (
    <Modal title="Award points" onClose={onClose}>
      <div style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink-2)', marginBottom: 14, lineHeight: 1.5 }}>
        Give <strong style={{ color: 'var(--navy)' }}>{member.name}</strong> bonus points for help that isn't a tracked chore — carrying groceries, a hand with dinner — or dock points for a job left half-done.
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>{dirBtn('add', '＋ Give')}{dirBtn('subtract', '− Dock')}</div>
      <div style={{ marginBottom: 14 }}><label style={label}>Points</label><input className="text-input" type="number" min="0" value={amount} onChange={e => setAmount(e.target.value)} placeholder="20" autoFocus /></div>
      <div style={{ marginBottom: 20 }}><label style={label}>Reason (optional)</label><input className="text-input" value={reason} onChange={e => setReason(e.target.value)} placeholder="Helped carry the groceries" /></div>
      <button onClick={() => { const a = Number(amount) || 0; if (!a) return; onAdjust(member, dir === 'subtract' ? -a : a, reason.trim(), dir === 'subtract' ? 'dock' : 'award'); }} style={{ ...primaryBtn, width: '100%', padding: '14px' }}>{dir === 'subtract' ? 'Dock points' : 'Give points'}</button>
    </Modal>
  );
}

// Kid-facing: wallet + browse the reward menu + redeem. Nothing here edits
// the economy — awarding, promos, and the menu itself live in Manage.
function RewardsView({ members, ledger, rewards, onRedeemClick }) {
  return (
    <div style={{ paddingBottom: 48 }}>
      {/* Wallets */}
      <div style={{ padding: '22px 16px 4px' }}>
        <div style={eyebrow}>Points wallet</div>
        {members.length === 0 ? (
          <div style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-fade)', paddingBottom: 8 }}>Add family members in the hub Settings → Family to start tracking points.</div>
        ) : members.map(m => (
          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderBottom: '1px solid var(--rule)' }}>
            <span style={{ width: 14, height: 14, background: familyColorById(m.colorId), flexShrink: 0 }} />
            <span style={{ flex: 1, fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 16, color: 'var(--navy)' }}>{m.name}</span>
            <span style={{ fontFamily: 'var(--sans)', fontWeight: 900, fontSize: 22, color: 'var(--navy)', fontVariantNumeric: 'tabular-nums' }}>{balanceFor(ledger, m.id)}<span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-2)' }}> pts</span></span>
          </div>
        ))}
      </div>

      {/* Reward menu */}
      <div style={{ padding: '22px 16px 4px' }}>
        <div style={eyebrow}>Reward menu</div>
        {rewards.length === 0 ? (
          <div style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink-2)', marginBottom: 14, lineHeight: 1.5 }}>
            Nothing on the menu yet — ask a parent to add what points can buy.
          </div>
        ) : rewards.map(r => (
          <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderBottom: '1px solid var(--rule)' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 15, color: 'var(--navy)' }}>{r.name}</div>
              <div style={{ fontFamily: 'var(--sans)', fontWeight: 800, fontSize: 12, color: 'var(--accent)', marginTop: 2 }}>{r.cost} pts</div>
            </div>
            <button onClick={() => onRedeemClick(r)} style={{ ...smallBtn, background: 'var(--navy)', color: 'var(--paper)' }}>Redeem</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Manage (parent-only): awards, promos, reward menu, fulfillment, ledger ──

function fmtEntryTime(e) {
  const ms = entryTimeMs(e);
  const days = Math.floor((Date.now() - ms) / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days}d ago`;
}

const LEDGER_TYPE_LABEL = { earn: 'Earn', redeem: 'Redeem', dock: 'Dock', award: 'Award' };

function LedgerRow({ entry, members }) {
  const m = members.find(x => x.id === entry.memberId);
  const positive = Number(entry.delta) > 0;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: '1px dotted var(--rule)' }}>
      <span style={{ width: 10, height: 10, background: familyColorById(m ? m.colorId : ''), flexShrink: 0, marginTop: 4 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--navy)' }}>
          <strong>{m ? m.name : 'Someone'}</strong>
          {' '}{LEDGER_TYPE_LABEL[entry.type] || entry.type}
          {entry.choreName ? ` · ${entry.choreName}` : ''}
          {entry.rewardName ? ` · ${entry.rewardName}` : ''}
        </div>
        {entry.reason && (
          <div style={{ fontFamily: 'var(--sans)', fontSize: 11, color: 'var(--ink-fade)', marginTop: 2 }}>{entry.reason}</div>
        )}
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontFamily: 'var(--sans)', fontWeight: 800, fontSize: 13, color: positive ? 'var(--navy)' : 'var(--accent)', fontVariantNumeric: 'tabular-nums' }}>
          {positive ? '+' : ''}{entry.delta} pts
        </div>
        <div style={{ fontFamily: 'var(--sans)', fontSize: 10, color: 'var(--ink-fade)' }}>{fmtEntryTime(entry)}</div>
      </div>
    </div>
  );
}

function ManageView({ members, ledger, rewards, bonus, onAdjustClick, onAddReward, onEditReward, onFulfill, onBonusOpen }) {
  const [period, setPeriod] = React.useState('30');
  const pending  = ledger.filter(e => e.type === 'redeem' && e.status === 'pending');
  const given    = ledger.filter(e => e.type === 'redeem' && e.status === 'given')
    .sort((a, b) => entryTimeMs(b) - entryTimeMs(a));
  const nameOf   = id => (members.find(m => m.id === id) || {}).name || 'someone';
  const colorOf  = id => familyColorById((members.find(m => m.id === id) || {}).colorId);

  const since = periodStart(period);
  const recent = ledger.filter(e => entryTimeMs(e) >= since).sort((a, b) => entryTimeMs(b) - entryTimeMs(a));

  return (
    <div style={{ paddingBottom: 48 }}>
      {/* Award points */}
      <div style={{ padding: '22px 16px 4px' }}>
        <div style={eyebrow}>Award points</div>
        {members.length === 0 ? (
          <div style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-fade)', paddingBottom: 8 }}>Add family members in Settings → Family first.</div>
        ) : members.map(m => (
          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--rule)' }}>
            <span style={{ width: 12, height: 12, background: familyColorById(m.colorId), flexShrink: 0 }} />
            <span style={{ flex: 1, fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 14, color: 'var(--navy)' }}>{m.name}</span>
            <span style={{ fontFamily: 'var(--sans)', fontWeight: 800, fontSize: 14, color: 'var(--ink-2)', fontVariantNumeric: 'tabular-nums' }}>{balanceFor(ledger, m.id)} pts</span>
            <button onClick={() => onAdjustClick(m)} style={{ ...smallBtn, border: '1px solid var(--rule)', color: 'var(--ink-2)' }}>Award</button>
          </div>
        ))}
      </div>

      {/* To deliver */}
      {pending.length > 0 && (
        <div style={{ padding: '22px 16px 4px' }}>
          <div style={eyebrow}>To deliver</div>
          {pending.map(e => (
            <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--rule)' }}>
              <span style={{ width: 12, height: 12, background: colorOf(e.memberId), flexShrink: 0 }} />
              <span style={{ flex: 1, fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--navy)' }}><strong>{nameOf(e.memberId)}</strong> redeemed {e.rewardName}</span>
              <button onClick={() => onFulfill(e.id)} style={{ ...smallBtn, background: 'var(--navy)', color: 'var(--paper)' }}>Mark given</button>
            </div>
          ))}
        </div>
      )}

      {/* Delivered history */}
      {given.length > 0 && (
        <div style={{ padding: '22px 16px 4px' }}>
          <div style={eyebrow}>Delivered</div>
          {given.map(e => (
            <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px dotted var(--rule)' }}>
              <span style={{ width: 10, height: 10, background: colorOf(e.memberId), flexShrink: 0 }} />
              <span style={{ flex: 1, fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-soft)' }}><strong style={{ color: 'var(--navy)' }}>{nameOf(e.memberId)}</strong> · {e.rewardName}</span>
              <span style={{ fontFamily: 'var(--sans)', fontSize: 11, color: 'var(--ink-fade)' }}>{e.givenAt ? fmtEntryTime({ createdAt: e.givenAt }) : ''}</span>
            </div>
          ))}
        </div>
      )}

      {/* Promo control */}
      <div style={{ padding: '22px 16px 4px' }}>
        <div style={eyebrow}>Points promo</div>
        {bonus.active ? (
          <div style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-soft)' }}>
            ⚡ {bonus.label || 'Bonus'} running at ×{bonus.multiplier}. Manage it from the banner above.
          </div>
        ) : (
          <button onClick={onBonusOpen} style={{ ...smallBtn, border: '1px dashed var(--accent)', color: 'var(--accent)' }}>⚡ Run a points promo</button>
        )}
      </div>

      {/* Reward menu management */}
      <div style={{ padding: '22px 16px 4px' }}>
        <div style={eyebrow}>Reward menu</div>
        {rewards.length === 0 ? (
          <div style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink-2)', marginBottom: 14, lineHeight: 1.5 }}>
            Set what points can buy — screen time, a movie night, $10 cash, a later bedtime.
          </div>
        ) : rewards.map(r => (
          <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderBottom: '1px solid var(--rule)' }}>
            <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => onEditReward(r)}>
              <div style={{ fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 15, color: 'var(--navy)' }}>{r.name}</div>
              <div style={{ fontFamily: 'var(--sans)', fontWeight: 800, fontSize: 12, color: 'var(--accent)', marginTop: 2 }}>{r.cost} pts</div>
            </div>
            <button onClick={() => onEditReward(r)} style={{ ...smallBtn, border: '1px solid var(--rule)', color: 'var(--ink-2)' }}>Edit</button>
          </div>
        ))}
        <button onClick={onAddReward} style={{ ...smallBtn, border: '1px dashed var(--accent)', color: 'var(--accent)', marginTop: 14 }}>＋ Add reward</button>
      </div>

      {/* Ledger */}
      <div style={{ padding: '22px 16px 4px' }}>
        <div style={eyebrow}>Ledger — every claim, every user</div>
        <PeriodToggle period={period} onChange={setPeriod} />
        {recent.length === 0 ? (
          <div style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-fade)' }}>No activity logged in this window yet.</div>
        ) : recent.map(e => <LedgerRow key={e.id} entry={e} members={members} />)}
      </div>
    </div>
  );
}

// ─── App root ────────────────────────────────────────────────────────────────

function BonusSheet({ bonus, onSave, onClose }) {
  const [mult, setMult]   = React.useState(bonus.multiplier > 1 ? bonus.multiplier : 2);
  const [label, setLabel] = React.useState(bonus.label || '');
  const lbl = { fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-2)', display: 'block', marginBottom: 8 };
  const multBtn = n => (
    <button onClick={() => setMult(n)} style={{ flex: 1, padding: '14px', borderRadius: 0, cursor: 'pointer', border: `1px solid ${mult === n ? 'var(--accent)' : 'var(--rule)'}`, background: mult === n ? 'color-mix(in oklch, var(--accent) 12%, transparent)' : 'var(--card)', fontFamily: 'var(--sans)', fontWeight: 900, fontSize: 18, color: 'var(--navy)' }}>{n}×</button>
  );
  return (
    <Modal title="Points promo" onClose={onClose}>
      <div style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink-2)', marginBottom: 16, lineHeight: 1.5 }}>
        Run a limited-time multiplier to spark a push — like a double-points weekend cleaning sprint. Every chore completed earns the boosted amount until you end it.
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={lbl}>Multiplier</label>
        <div style={{ display: 'flex', gap: 8 }}>{multBtn(2)}{multBtn(3)}</div>
      </div>
      <div style={{ marginBottom: 20 }}>
        <label style={lbl}>Name (optional)</label>
        <input className="text-input" value={label} onChange={e => setLabel(e.target.value)} placeholder="Weekend cleaning sprint" />
      </div>
      <button onClick={() => onSave({ active: true, multiplier: Number(mult) || 2, label: label.trim() })} style={{ ...primaryBtn, width: '100%', padding: '14px' }}>{bonus.active ? 'Update promo' : 'Start promo'}</button>
      {bonus.active && (
        <button onClick={() => onSave({ active: false, multiplier: Number(mult) || 2, label: label.trim() })} style={{ width: '100%', marginTop: 10, padding: '10px', background: 'none', border: '1px solid var(--rule)', borderRadius: 0, fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-fade)', cursor: 'pointer' }}>End promo</button>
      )}
    </Modal>
  );
}

function ChoresApp() {
  const { user, household, setHousehold } = useChoresAuth();
  const householdId = household && household.id;
  const members  = getFamilyMembers(household);
  const rewards  = (household && Array.isArray(household.rewards)) ? household.rewards : [];
  const bonus    = (household && household.pointsBonus) || { active: false, multiplier: 1, label: '' };
  const bonusMult = bonus.active ? (Number(bonus.multiplier) || 1) : 1;
  const amAdmin = isHouseholdAdmin(household, user && user.uid);

  const [chores, setChores]       = React.useState(() => loadChoresLocal());
  const [ledger, setLedger]       = React.useState(() => loadLedgerLocal());
  const [view, setView]           = React.useState('chores');
  const [period, setPeriod]       = React.useState('30');
  const [sheet, setSheet]         = React.useState(null);
  const [expandedId, setExpanded] = React.useState(null);
  const [dataOpen, setDataOpen]   = React.useState(false);
  const [completing, setCompleting] = React.useState(null);
  const [redeeming, setRedeeming]   = React.useState(null);
  const [rewardEdit, setRewardEdit] = React.useState(null);
  const [adjusting, setAdjusting]   = React.useState(null);
  const [bonusOpen, setBonusOpen]   = React.useState(false);
  const [toast, setToast]           = React.useState('');

  React.useEffect(() => {
    if (!householdId) return;
    const u1 = subscribeChores(householdId, setChores);
    const u2 = subscribeLedger(householdId, setLedger);
    return () => { u1 && u1(); u2 && u2(); };
  }, [householdId]);

  React.useEffect(() => {
    if (view === 'manage' && !amAdmin) setView('chores');
  }, [view, amAdmin]);

  function flash(msg) { setToast(msg); setTimeout(() => setToast(t => (t === msg ? '' : t)), 2400); }

  function addMember(name) {
    const used = new Set(members.map(m => m.colorId));
    const nextColor = (FAMILY_COLORS.find(c => !used.has(c.id)) || FAMILY_COLORS[members.length % FAMILY_COLORS.length]).id;
    const nm = { id: generateId(), name: name.trim(), colorId: nextColor, linkedUid: null };
    const updated = [...members, nm];
    setHousehold(h => ({ ...(h || {}), familyMembers: updated }));
    saveFamilyMembers(householdId, updated).catch(console.error);
    return nm;
  }

  function handleSave(data) {
    if (data.id) {
      setChores(prev => prev.map(c => c.id === data.id ? { ...c, ...data } : c));
      updateChore(householdId, data.id, data).catch(console.error);
    } else {
      addChore(householdId, data).catch(console.error);
    }
    setSheet(null);
  }
  function handleDelete(id) {
    setChores(prev => prev.filter(c => c.id !== id));
    deleteChore(householdId, id).catch(console.error);
    setSheet(null);
  }
  function handleImport(defs) {
    defs.forEach(d => addChore(householdId, d).catch(console.error));
    setChores(prev => [...prev, ...defs.map(d => ({ ...d, id: generateId() }))]);
  }

  // ── Points ledger ──
  function logLedger(entry) {
    const e = { ...entry, by: (user && user.displayName) || '' };
    addLedgerEntry(householdId, e).catch(console.error);
    setLedger(prev => [...prev, { ...e, id: generateId(), createdAt: Date.now() }]); // optimistic
  }
  // A completion can credit more than one person — points split evenly among
  // whoever's picked, one ledger entry each, each noting who else was in on it.
  function handleComplete(chore, memberIds) {
    const total = chorePoints(chore) * bonusMult;
    const each  = splitPoints(total, memberIds.length);
    const nameOf = id => (members.find(m => m.id === id) || {}).name || 'someone';
    memberIds.forEach(id => {
      const others = memberIds.filter(mid => mid !== id).map(nameOf);
      const parts = [];
      if (bonusMult > 1) parts.push(`${bonusMult}× promo`);
      if (others.length) parts.push(`split with ${others.join(', ')}`);
      logLedger({ memberId: id, delta: each, type: 'earn', reason: parts.join(' · '), choreId: chore.id, choreName: chore.name });
    });
    const now = Date.now();
    setChores(prev => prev.map(c => c.id === chore.id ? { ...c, lastCompletedAt: now, lastCompletedBy: memberIds } : c));
    updateChore(householdId, chore.id, { lastCompletedAt: now, lastCompletedBy: memberIds }).catch(console.error);
    setCompleting(null);
    const names = memberIds.map(nameOf);
    const who = names.length > 1 ? `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}` : names[0];
    flash(`${who} earned ${each} pts each${bonusMult > 1 ? ` ⚡${bonusMult}×` : ''} ⭐`);
  }
  function handleResetLock(choreId) {
    setChores(prev => prev.map(c => c.id === choreId ? { ...c, lastCompletedAt: null, lastCompletedBy: '' } : c));
    updateChore(householdId, choreId, { lastCompletedAt: null, lastCompletedBy: '' }).catch(console.error);
    flash('Availability reset');
  }
  function handleRedeem(reward, member) {
    logLedger({ memberId: member.id, delta: -(Number(reward.cost) || 0), type: 'redeem', reason: '', rewardId: reward.id, rewardName: reward.name, status: 'pending' });
    setRedeeming(null);
    flash(`${member.name} redeemed ${reward.name}`);
  }
  function handleFulfill(entryId) {
    const now = Date.now();
    updateLedgerEntry(householdId, entryId, { status: 'given', givenAt: now }).catch(console.error);
    setLedger(prev => prev.map(e => e.id === entryId ? { ...e, status: 'given', givenAt: now } : e));
  }
  function handleAdjust(member, delta, reason, type) {
    logLedger({ memberId: member.id, delta, type, reason });
    setAdjusting(null);
    flash(`${delta < 0 ? 'Docked' : 'Gave'} ${Math.abs(delta)} pts · ${member.name}`);
  }

  // ── Rewards menu + promo (household config) ──
  function persistHousehold(patch) {
    setHousehold(h => ({ ...(h || {}), ...patch }));
    if (householdId) db.doc(`households/${householdId}`).set(patch, { merge: true }).catch(console.error);
  }
  function saveReward(r) {
    const withId = r.id ? r : { ...r, id: generateId() };
    const exists = rewards.some(x => x.id === withId.id);
    persistHousehold({ rewards: exists ? rewards.map(x => x.id === withId.id ? withId : x) : [...rewards, withId] });
    setRewardEdit(null);
  }
  function deleteReward(id) { persistHousehold({ rewards: rewards.filter(x => x.id !== id) }); setRewardEdit(null); }
  function saveBonus(next) {
    persistHousehold({ pointsBonus: next });
    setBonusOpen(false);
    flash(next.active ? `Promo on — points ×${next.multiplier}` : 'Promo ended');
  }

  // Never-done, overdue, and available daily chores float up; resting chores
  // sink down — the list itself flags what's falling behind.
  const sorted = [...chores].sort((a, b) => {
    const ba = choreUrgencyBucket(a), bb = choreUrgencyBucket(b);
    if (ba !== bb) return ba - bb;
    return choreStaleDays(b) - choreStaleDays(a);
  });

  const pendingCount = ledger.filter(e => e.type === 'redeem' && e.status === 'pending').length;

  const tab = (id, txt, badge) => (
    <button onClick={() => setView(id)} style={{
      flex: 1, padding: '12px', borderRadius: 0, cursor: 'pointer', border: 'none',
      borderBottom: `2px solid ${view === id ? 'var(--accent)' : 'var(--rule)'}`,
      background: 'none', fontFamily: 'var(--sans)', fontWeight: 800, fontSize: 12,
      letterSpacing: '0.14em', textTransform: 'uppercase', color: view === id ? 'var(--accent)' : 'var(--ink-2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    }}>
      {txt}
      {!!badge && (
        <span style={{ background: 'var(--accent)', color: 'var(--accent-ink)', borderRadius: 999, minWidth: 16, height: 16, padding: '0 4px', fontSize: 10, fontWeight: 900, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{badge}</span>
      )}
    </button>
  );

  const promoBanner = bonus.active ? (
    <div style={{ background: 'var(--accent)', color: 'var(--accent-ink)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontFamily: 'var(--sans)', fontWeight: 900, fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase', flex: 1 }}>
        ⚡ {bonus.label || 'Bonus'} — points ×{bonus.multiplier}
      </span>
      {amAdmin && (
        <button onClick={() => setBonusOpen(true)} style={{ background: 'none', border: '1px solid var(--accent-ink)', color: 'var(--accent-ink)', fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '5px 10px', cursor: 'pointer', borderRadius: 0 }}>Manage</button>
      )}
    </div>
  ) : null;

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', background: 'var(--paper)', minHeight: '100vh' }}>
      <Nav onAdd={() => setSheet({})} onData={() => setDataOpen(true)} canAddChore={amAdmin} />

      <div style={{ display: 'flex', borderBottom: '1px solid var(--rule)' }}>
        {tab('chores', 'Chores')}
        {tab('rewards', 'Rewards')}
        {amAdmin && tab('manage', 'Manage', pendingCount)}
      </div>

      {promoBanner}

      {view === 'chores' ? (
        chores.length === 0 ? (
          <EmptyState onAdd={() => setSheet({})} onImport={() => setDataOpen(true)} />
        ) : (
          <div style={{ paddingBottom: 48 }}>
            <div style={{ padding: '22px 16px 4px' }}>
              <div style={eyebrow}>Who's claiming the work?</div>
              <PeriodToggle period={period} onChange={setPeriod} />
              <ClaimsPie ledger={ledger} members={members} period={period} />
            </div>
            <div style={{ height: 1, background: 'var(--rule)', margin: '18px 16px 0' }} />
            <div style={{ padding: '4px 16px 0' }}>
              {sorted.map(c => (
                <ChoreRow
                  key={c.id}
                  chore={c}
                  members={members}
                  bonusMult={bonusMult}
                  expanded={expandedId === c.id}
                  onToggle={() => setExpanded(expandedId === c.id ? null : c.id)}
                  onEdit={ch => { setExpanded(null); setSheet(ch); }}
                  onDone={ch => setCompleting(ch)}
                  onReset={handleResetLock}
                  canEdit={amAdmin}
                />
              ))}
            </div>
          </div>
        )
      ) : view === 'rewards' ? (
        <RewardsView
          members={members} ledger={ledger} rewards={rewards}
          onRedeemClick={setRedeeming}
        />
      ) : (
        amAdmin && (
          <ManageView
            members={members} ledger={ledger} rewards={rewards} bonus={bonus}
            onAdjustClick={setAdjusting}
            onAddReward={() => setRewardEdit({})} onEditReward={setRewardEdit}
            onFulfill={handleFulfill}
            onBonusOpen={() => setBonusOpen(true)}
          />
        )
      )}

      {sheet !== null && (
        <ChoreSheet chore={sheet} onSave={handleSave} onDelete={handleDelete} onClose={() => setSheet(null)} />
      )}
      {dataOpen && <DataSheet chores={chores} onImport={handleImport} onClose={() => setDataOpen(false)} />}
      {completing && <CompletionSheet chore={completing} members={members} bonusMult={bonusMult} onComplete={handleComplete} onAddMember={addMember} onClose={() => setCompleting(null)} />}
      {redeeming && <RedeemSheet reward={redeeming} members={members} ledger={ledger} onRedeem={handleRedeem} onClose={() => setRedeeming(null)} />}
      {rewardEdit && <RewardEditSheet reward={rewardEdit} onSave={saveReward} onDelete={deleteReward} onClose={() => setRewardEdit(null)} />}
      {adjusting && <AdjustSheet member={adjusting} onAdjust={handleAdjust} onClose={() => setAdjusting(null)} />}
      {bonusOpen && <BonusSheet bonus={bonus} onSave={saveBonus} onClose={() => setBonusOpen(false)} />}

      {toast && (
        <div style={{ position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)', background: 'var(--navy)', color: 'var(--paper)', fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 13, letterSpacing: '0.04em', padding: '12px 22px', borderRadius: 0, zIndex: 300, whiteSpace: 'nowrap' }}>{toast}</div>
      )}
    </div>
  );
}

function ChoresRoot() {
  return (
    <ChoresAuthProvider>
      <ChoresApp />
    </ChoresAuthProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<ChoresRoot />);
