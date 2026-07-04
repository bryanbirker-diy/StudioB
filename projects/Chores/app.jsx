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
  if (chore.owner) return 'claimed';
  if (chore.suggestedAssignee) return 'needs_owner';
  return 'unclaimed';
}

// ─── Nav ────────────────────────────────────────────────────────────────────

function Nav({ onAdd }) {
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

  const unclaimed = chores.filter(c => !c.owner).length;
  const slices = [...owned];
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
              : status === 'needs_owner' ? 'var(--accent)' : 'var(--rule)';
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
          {Number(chore.allowanceWeekly) > 0 && (
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
            {status === 'claimed' ? (
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
      allowanceWeekly: allowance === '' ? 0 : Number(String(allowance).replace(/[^0-9.]/g, '')) || 0,
      estimatedTime: estTime.trim(),
      category: category.trim(),
      frequency: buildFrequency(),
      suggestedAssignee: assignee || '',
      links: links.filter(l => (l.url || '').trim()),
    };
    // Preserve owner/status when editing; new chores start unclaimed.
    if (chore.id) { data.id = chore.id; data.owner = chore.owner || ''; }
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
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
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

        {/* Allowance + estimated time */}
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

        {/* Suggested assignee */}
        <div style={{ marginBottom: 16 }}>
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

function EmptyState({ onAdd }) {
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

  // Order: needs-owner first, then unclaimed, then owned — surface the gaps.
  const order = { needs_owner: 0, unclaimed: 1, claimed: 2 };
  const sorted = [...chores].sort((a, b) => (order[choreStatus(a)] - order[choreStatus(b)]));

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', background: 'var(--paper)', minHeight: '100vh' }}>
      <Nav onAdd={() => setSheet({})} />

      {chores.length === 0 ? (
        <EmptyState onAdd={() => setSheet({})} />
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
