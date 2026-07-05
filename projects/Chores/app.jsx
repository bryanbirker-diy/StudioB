// app.jsx — Our Chores
// Make household work visible: what exists, who owns it, how it's done, what it's worth.

const {
  AuthProvider: ChoresAuthProvider,
  useAuth: useChoresAuth,
  getFamilyMembers,
  familyColorById,
  FAMILY_COLORS,
  saveFamilyMembers,
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

// Ownership status derives from the fields: owned once someone claims it,
// "needs owner" when suggested but unclaimed, otherwise unclaimed.
function choreStatus(chore) {
  if (chore.shared) return 'shared';          // everyone pitches in, no owner, no pay
  if (chore.owner) return 'claimed';
  if (chore.suggestedAssignee) return 'needs_owner';
  return 'unclaimed';
}

// ─── Nav ────────────────────────────────────────────────────────────────────

function Nav({ onAdd, onData }) {
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
    </nav>
  );
}

// ─── Ownership pie (the centerpiece) ─────────────────────────────────────────

function OwnershipPie({ chores, members }) {
  const owned = members.map(m => {
    const mine = chores.filter(c => c.owner === m.id);
    return {
      id: m.id, name: m.name, color: familyColorById(m.colorId),
      count: mine.length,
      weekly: mine.reduce((s, c) => s + (Number(c.allowanceWeekly) || 0), 0),
    };
  }).filter(m => m.count > 0);

  const shared    = chores.filter(c => c.shared).length;
  const unclaimed = chores.filter(c => !c.owner && !c.shared).length;
  const slices = [...owned];
  if (shared > 0)    slices.push({ id: '_shared',    name: 'Shared',    color: 'var(--navy)', count: shared,    weekly: 0 });
  if (unclaimed > 0) slices.push({ id: '_unclaimed', name: 'Unclaimed', color: 'var(--rule)', count: unclaimed, weekly: 0 });

  const total = chores.length;
  if (!total) return null;

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
          <text x={cx} y={cy + 16} textAnchor="middle" style={{ fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 9, letterSpacing: '0.14em', fill: 'var(--ink-2)' }}>CHORES</text>
        </svg>
      </div>

      <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {slices.map(s => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 12, height: 12, background: s.color, flexShrink: 0, border: s.id === '_unclaimed' ? '1px solid var(--rule)' : 'none' }} />
            <span style={{ fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 13, color: 'var(--navy)', flex: 1, textTransform: 'uppercase', letterSpacing: '0.02em' }}>{s.name}</span>
            <span style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--ink-2)', fontVariantNumeric: 'tabular-nums' }}>
              {s.count} · {Math.round((s.count / total) * 100)}%{s.weekly > 0 ? ` · ${fmtMoney(s.weekly)}/wk` : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Owner badge ─────────────────────────────────────────────────────────────

function OwnerBadge({ chore, members }) {
  const status = choreStatus(chore);
  if (status === 'shared') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--sans)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--navy)', whiteSpace: 'nowrap' }}>
        <span style={{ width: 10, height: 10, background: 'var(--navy)', flexShrink: 0 }} />Shared
      </span>
    );
  }
  if (status === 'claimed') {
    const m = members.find(x => x.id === chore.owner);
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--sans)', fontSize: 12, fontWeight: 600, color: 'var(--navy)', whiteSpace: 'nowrap' }}>
        <span style={{ width: 10, height: 10, background: familyColorById(m ? m.colorId : ''), flexShrink: 0 }} />
        {m ? m.name : 'Owned'}
      </span>
    );
  }
  if (status === 'needs_owner') {
    return <span style={{ fontFamily: 'var(--sans)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent)', whiteSpace: 'nowrap' }}>Needs owner</span>;
  }
  return <span style={{ fontFamily: 'var(--sans)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-fade)', whiteSpace: 'nowrap' }}>Unclaimed</span>;
}

// ─── Chore row (editorial index row, expandable) ─────────────────────────────

function ChoreRow({ chore, members, expanded, onToggle, onClaim, onRelease, onEdit }) {
  const status = choreStatus(chore);
  const owner  = members.find(m => m.id === chore.owner);
  const edge   = status === 'claimed' ? familyColorById(owner ? owner.colorId : '')
              : status === 'needs_owner' ? 'var(--accent)'
              : status === 'shared' ? 'var(--navy)' : 'var(--rule)';
  const suggested = members.find(m => m.id === chore.suggestedAssignee);

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
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 12px', marginTop: 4 }}>
            <OwnerBadge chore={chore} members={members} />
            {chore.frequency && (
              <span style={{ fontFamily: 'var(--sans)', fontSize: 11, color: 'var(--ink-2)' }}>{frequencyLabel(chore.frequency)}</span>
            )}
            {chore.estimatedTime && (
              <span style={{ fontFamily: 'var(--sans)', fontSize: 11, color: 'var(--ink-fade)' }}>{chore.estimatedTime}</span>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
          {!chore.shared && Number(chore.allowanceWeekly) > 0 && (
            <div style={{ fontFamily: 'var(--sans)', fontWeight: 800, fontSize: 15, color: 'var(--navy)', fontVariantNumeric: 'tabular-nums' }}>
              {fmtMoney(chore.allowanceWeekly)}<span style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink-2)' }}>/wk</span>
            </div>
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

          {/* Ownership controls */}
          <div style={{ borderTop: '1px solid var(--rule)', paddingTop: 12 }}>
            {status === 'shared' ? (
              <span style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5 }}>
                Shared by everyone — no single owner, no pay. Just one of those realities.
              </span>
            ) : status === 'claimed' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--ink-2)' }}>
                  Owned by <strong style={{ color: 'var(--navy)' }}>{owner ? owner.name : 'someone'}</strong>
                </span>
                <button onClick={() => onRelease(chore.id)} style={textBtn}>Release</button>
              </div>
            ) : (
              <div>
                <div style={{ fontFamily: 'var(--sans)', fontWeight: 800, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-2)', marginBottom: 8 }}>
                  Who's taking this on?{suggested ? ` (suggested: ${suggested.name})` : ''}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {members.map(m => (
                    <button key={m.id} onClick={() => onClaim(chore.id, m.id)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 7,
                        padding: '7px 13px', borderRadius: 0, cursor: 'pointer',
                        border: `1px solid ${m.id === chore.suggestedAssignee ? 'var(--accent)' : 'var(--rule)'}`,
                        background: 'var(--card)',
                        fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 12,
                        color: 'var(--navy)', textTransform: 'uppercase', letterSpacing: '0.04em',
                      }}>
                      <span style={{ width: 10, height: 10, background: familyColorById(m.colorId) }} />
                      Claim · {m.name}
                    </button>
                  ))}
                  {members.length === 0 && (
                    <span style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--ink-fade)' }}>Add family members to claim chores.</span>
                  )}
                </div>
              </div>
            )}
            <button onClick={() => onEdit(chore)} style={{ ...textBtn, marginTop: 12 }}>Edit chore</button>
          </div>
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

function ChoreSheet({ chore, members, onSave, onDelete, onClose, onAddMember }) {
  const isNew = !chore.id;
  const [name,     setName]     = React.useState(chore.name || '');
  const [desc,     setDesc]     = React.useState(chore.description || '');
  const [shared,   setShared]   = React.useState(!!chore.shared);
  const [allowance,setAllowance]= React.useState(chore.allowanceWeekly || '');
  const [estTime,  setEstTime]  = React.useState(chore.estimatedTime || '');
  const [category, setCategory] = React.useState(chore.category || '');
  const [freqType, setFreqType] = React.useState((chore.frequency && chore.frequency.type) || 'weekly');
  const [everyX,   setEveryX]   = React.useState((chore.frequency && chore.frequency.everyXDays) || 3);
  const [customLbl,setCustomLbl]= React.useState((chore.frequency && chore.frequency.customLabel) || '');
  const [assignee, setAssignee] = React.useState(chore.suggestedAssignee || '');
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
      shared,
      allowanceWeekly: shared ? 0 : (allowance === '' ? 0 : Number(String(allowance).replace(/[^0-9.]/g, '')) || 0),
      estimatedTime: estTime.trim(),
      category: category.trim(),
      frequency: buildFrequency(),
      suggestedAssignee: shared ? '' : (assignee || ''),
      links: links.filter(l => (l.url || '').trim()),
    };
    // Shared chores have no owner; otherwise preserve owner when editing.
    if (chore.id) { data.id = chore.id; data.owner = shared ? '' : (chore.owner || ''); }
    else { data.owner = ''; }
    onSave(data);
  }

  function addLink()      { setLinks(prev => [...prev, { label: '', url: '' }]); }
  function setLink(i, k, v){ setLinks(prev => prev.map((l, j) => j === i ? { ...l, [k]: v } : l)); }
  function removeLink(i)  { setLinks(prev => prev.filter((_, j) => j !== i)); }

  function handleAddMember() {
    const nm = (prompt('Family member name?') || '').trim();
    if (nm) { const created = onAddMember(nm); if (created) setAssignee(created.id); }
  }

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

        {/* Shared toggle */}
        <div style={{ marginBottom: 16 }}>
          <button type="button" onClick={() => setShared(s => !s)} style={{
            display: 'flex', alignItems: 'center', gap: 11, width: '100%', textAlign: 'left',
            padding: '12px 13px', borderRadius: 0, cursor: 'pointer',
            border: `1px solid ${shared ? 'var(--accent)' : 'var(--rule)'}`,
            background: shared ? 'color-mix(in oklch, var(--accent) 8%, transparent)' : 'var(--card)',
          }}>
            <span style={{ width: 18, height: 18, flexShrink: 0, border: `1px solid ${shared ? 'var(--accent)' : 'var(--navy)'}`, background: shared ? 'var(--accent)' : 'transparent', color: 'var(--accent-ink)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 }}>{shared ? '✓' : ''}</span>
            <span>
              <span style={{ display: 'block', fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 13, color: 'var(--navy)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Shared chore</span>
              <span style={{ display: 'block', fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--ink-2)', marginTop: 2 }}>Everyone pitches in — no single owner, no pay.</span>
            </span>
          </button>
        </div>

        {/* Allowance (hidden when shared) + estimated time */}
        {shared ? (
          <div style={{ marginBottom: 16 }}>
            <label style={label}>Est. time</label>
            <input className="text-input" value={estTime} onChange={e => setEstTime(e.target.value)} placeholder="20 min" />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={label}>Weekly pay</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink-soft)' }}>$</span>
                <input className="text-input" type="number" min="0" value={allowance} onChange={e => setAllowance(e.target.value)} placeholder="0" style={{ paddingLeft: 22 }} />
              </div>
            </div>
            <div>
              <label style={label}>Est. time</label>
              <input className="text-input" value={estTime} onChange={e => setEstTime(e.target.value)} placeholder="20 min" />
            </div>
          </div>
        )}

        {/* Frequency */}
        <div style={{ marginBottom: 16 }}>
          <label style={label}>How often?</label>
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
            <input className="text-input" value={customLbl} onChange={e => setCustomLbl(e.target.value)} placeholder="e.g. Before guests visit" style={{ marginTop: 8 }} />
          )}
        </div>

        {/* Category */}
        <div style={{ marginBottom: 16 }}>
          <label style={label}>Category <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400, color: 'var(--ink-fade)' }}>(optional)</span></label>
          <input className="text-input" value={category} onChange={e => setCategory(e.target.value)} placeholder="Kitchen, outdoor, pets…" />
        </div>

        {/* Suggested assignee (hidden when shared) */}
        {!shared && <div style={{ marginBottom: 16 }}>
          <label style={label}>Suggested owner <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400, color: 'var(--ink-fade)' }}>(they still claim it)</span></label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {members.map(m => (
              <button key={m.id} onClick={() => setAssignee(assignee === m.id ? '' : m.id)}
                style={{ ...chip(assignee === m.id), display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                <span style={{ width: 10, height: 10, background: familyColorById(m.colorId) }} />
                {m.name}
              </button>
            ))}
            <button onClick={handleAddMember} style={{ ...chip(false), borderStyle: 'dashed', color: 'var(--ink-2)' }}>＋ Add person</button>
          </div>
        </div>}

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
        Start building your family's shared responsibilities — who owns what, how it's done, and what it's worth.
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

const CSV_HEADER = ['Chore Name', 'Description', 'Category', 'Shared', 'Weekly Pay', 'Estimated Time', 'Frequency', 'Every X Days', 'Links'];

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
      c.name || '', c.description || '', c.category || '',
      c.shared ? 'Yes' : 'No',
      c.shared ? '' : (Number(c.allowanceWeekly) || 0),
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
  const iCat   = col('category');
  const iShared= col('shared');
  const iPay   = col('weekly pay', 'allowance', 'pay');
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
    const shared = ['yes', 'y', 'true', '1'].includes(get(cells, iShared).toLowerCase());
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
      category: get(cells, iCat),
      shared,
      allowanceWeekly: shared ? 0 : (Number(String(get(cells, iPay)).replace(/[^0-9.]/g, '')) || 0),
      estimatedTime: get(cells, iTime),
      frequency,
      suggestedAssignee: '', owner: '',
      links: csvCellToLinks(get(cells, iLinks)),
    });
  }
  return out;
}

// Legacy support for the original JSON export format.
function jsonToChores(text) {
  const data = JSON.parse(text);
  const arr = Array.isArray(data) ? data : (data && data.chores) || [];
  return arr.filter(c => c && c.name).map(c => ({
    name: String(c.name).slice(0, 200), description: c.description || '', category: c.category || '',
    shared: !!c.shared, allowanceWeekly: Number(c.allowanceWeekly) || 0,
    estimatedTime: c.estimatedTime || '',
    frequency: (c.frequency && c.frequency.type) ? c.frequency : { type: 'weekly' },
    suggestedAssignee: '', owner: '',
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
              Choose a .csv file (from Excel/Sheets), or paste CSV text. Columns: {CSV_HEADER.join(', ')}. Imported chores are added fresh — owners reset so your family claims their own.
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

// ─── App root ────────────────────────────────────────────────────────────────

function ChoresApp() {
  const { household, setHousehold } = useChoresAuth();
  const householdId = household && household.id;
  const members = getFamilyMembers(household);

  const [chores, setChores]       = React.useState(() => loadChoresLocal());
  const [sheet, setSheet]         = React.useState(null);
  const [expandedId, setExpanded] = React.useState(null);
  const [dataOpen, setDataOpen]   = React.useState(false);

  React.useEffect(() => {
    if (!householdId) return;
    return subscribeChores(householdId, setChores);
  }, [householdId]);

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
  function handleClaim(choreId, memberId) {
    setChores(prev => prev.map(c => c.id === choreId ? { ...c, owner: memberId } : c));
    updateChore(householdId, choreId, { owner: memberId }).catch(console.error);
  }
  function handleRelease(choreId) {
    setChores(prev => prev.map(c => c.id === choreId ? { ...c, owner: '' } : c));
    updateChore(householdId, choreId, { owner: '' }).catch(console.error);
  }
  function handleImport(defs) {
    defs.forEach(d => addChore(householdId, d).catch(console.error));
    // optimistic local add so imported chores show immediately (real ids arrive via onSnapshot)
    setChores(prev => [...prev, ...defs.map(d => ({ ...d, id: generateId() }))]);
  }

  // Order: needs-owner first, then unclaimed, then owned — surface the gaps.
  const order = { needs_owner: 0, unclaimed: 1, claimed: 2, shared: 3 };
  const sorted = [...chores].sort((a, b) => (order[choreStatus(a)] - order[choreStatus(b)]));

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', background: 'var(--paper)', minHeight: '100vh' }}>
      <Nav onAdd={() => setSheet({})} onData={() => setDataOpen(true)} />

      {chores.length === 0 ? (
        <EmptyState onAdd={() => setSheet({})} onImport={() => setDataOpen(true)} />
      ) : (
        <div style={{ paddingBottom: 48 }}>
          {/* Dashboard: who owns the work? */}
          <div style={{ padding: '22px 16px 4px' }}>
            <div style={{ fontFamily: 'var(--sans)', fontWeight: 800, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 14 }}>
              Who owns the work?
            </div>
            <OwnershipPie chores={chores} members={members} />
          </div>

          <div style={{ height: 1, background: 'var(--rule)', margin: '18px 16px 0' }} />

          {/* Master list */}
          <div style={{ padding: '4px 16px 0' }}>
            {sorted.map(c => (
              <ChoreRow
                key={c.id}
                chore={c}
                members={members}
                expanded={expandedId === c.id}
                onToggle={() => setExpanded(expandedId === c.id ? null : c.id)}
                onClaim={handleClaim}
                onRelease={handleRelease}
                onEdit={ch => { setExpanded(null); setSheet(ch); }}
              />
            ))}
          </div>
        </div>
      )}

      {sheet !== null && (
        <ChoreSheet
          chore={sheet}
          members={members}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setSheet(null)}
          onAddMember={addMember}
        />
      )}

      {dataOpen && (
        <DataSheet chores={chores} onImport={handleImport} onClose={() => setDataOpen(false)} />
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
