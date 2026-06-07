// app.jsx — Our Home

// ─── Auth import ──────────────────────────────────────────────────────────
const { AuthProvider: HomeAuthProvider, useAuth: useHomeAuth } = window._oursAuth;

// ─── Constants ────────────────────────────────────────────────────────────

const STATUSES = [
  { id: 'dreaming',     label: 'Dreaming',    color: 'var(--ink-fade)', bg: 'transparent',            border: 'var(--rule)' },
  { id: 'planning',     label: 'Planning',    color: 'var(--ink)',      bg: 'rgba(107,122,74,0.14)',  border: 'var(--olive)' },
  { id: 'quoted',       label: 'Quoted',      color: 'var(--ink)',      bg: 'rgba(195,145,105,0.18)', border: 'var(--clay)' },
  { id: 'in-progress',  label: 'In Progress', color: '#fdf6ec',         bg: 'var(--terracotta)',       border: '#5a3a20' },
  { id: 'done',         label: 'Done',        color: 'var(--ink-fade)', bg: 'rgba(107,122,74,0.18)',  border: 'var(--olive)' },
];

const CATEGORIES = [
  { id: 'kitchen',  label: 'Kitchen',     emoji: '🍳' },
  { id: 'bathroom', label: 'Bathroom',    emoji: '🚿' },
  { id: 'outdoor',  label: 'Outdoor',     emoji: '🌿' },
  { id: 'bedroom',  label: 'Bedroom',     emoji: '🛏' },
  { id: 'living',   label: 'Living Room', emoji: '🛋' },
  { id: 'basement', label: 'Basement',    emoji: '🔧' },
  { id: 'garage',   label: 'Garage',      emoji: '🏠' },
  { id: 'other',    label: 'Other',       emoji: '📋' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────

function fmtCost(n) {
  if (!n && n !== 0) return '';
  const num = Number(String(n).replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return '';
  return '$' + num.toLocaleString();
}

function parseCost(raw) {
  if (!raw && raw !== 0) return null;
  const n = Number(String(raw).replace(/[^0-9.]/g, ''));
  return isNaN(n) || n === 0 ? null : n;
}

function statusInfo(id) {
  return STATUSES.find(s => s.id === id) || STATUSES[0];
}

function categoryInfo(id) {
  return CATEGORIES.find(c => c.id === id) || null;
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
        background: 'var(--olive)', border: '1.5px solid #3e4823',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#f7f5e6', fontFamily: 'var(--hand)', fontWeight: 700, fontSize: 14,
        flexShrink: 0,
      }}>H</div>

      <span style={{ fontFamily: 'var(--hand)', fontWeight: 700, fontSize: 17, color: 'var(--ink)', flex: 1 }}>
        Our Home
      </span>

      <button
        onClick={onAdd}
        style={{
          padding: '5px 14px',
          border: '1.5px solid var(--olive)',
          borderRadius: '12px 14px 10px 13px',
          background: 'var(--olive)', color: '#f7f5e6',
          fontFamily: 'var(--pen)', fontSize: 13,
          cursor: 'pointer',
        }}
      >＋ Project</button>
    </nav>
  );
}

// ─── Status badge ──────────────────────────────────────────────────────────

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

// ─── Cost comparison display ───────────────────────────────────────────────

function CostDisplay({ estimated, quoted }) {
  const est = parseCost(estimated);
  const quo = parseCost(quoted);

  if (!est && !quo) return null;

  if (est && !quo) {
    return (
      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-soft)' }}>
        💰 est. {fmtCost(est)}
      </span>
    );
  }

  if (!est && quo) {
    return (
      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-soft)' }}>
        📋 quoted {fmtCost(quo)}
      </span>
    );
  }

  // Both — show comparison
  const diff = quo - est;
  const pct  = Math.round(Math.abs(diff) / est * 100);
  const over = diff > 0;
  return (
    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-soft)' }}>
      💰 {fmtCost(est)}
      <span style={{ color: 'var(--ink-fade)', margin: '0 4px' }}>→</span>
      <span style={{ color: over ? 'var(--terracotta)' : 'var(--olive)' }}>
        {fmtCost(quo)}
      </span>
      <span style={{ opacity: 0.6, marginLeft: 4 }}>({over ? '+' : '-'}{pct}%)</span>
    </span>
  );
}

// ─── Project card ──────────────────────────────────────────────────────────

function ProjectCard({ project, onClick }) {
  const cat  = categoryInfo(project.category);
  const s    = statusInfo(project.status);
  const inProgress = project.status === 'in-progress';

  return (
    <div
      onClick={onClick}
      style={{
        border: '1.5px solid var(--rule-soft)',
        borderLeft: `4px solid ${inProgress ? 'var(--terracotta)' : s.id === 'done' ? 'var(--olive)' : 'var(--rule-soft)'}`,
        borderRadius: '0 10px 8px 0',
        padding: '14px 14px 14px 12px',
        background: 'rgba(255,255,255,0.55)',
        cursor: 'pointer',
        transition: 'background .12s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.82)'}
      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.55)'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          {cat && <span style={{ fontSize: 18, flexShrink: 0 }}>{cat.emoji}</span>}
          <span style={{
            fontFamily: 'var(--hand)', fontWeight: 700, fontSize: 18,
            color: s.id === 'done' ? 'var(--ink-fade)' : 'var(--ink)',
            lineHeight: 1.1,
            textDecoration: s.id === 'done' ? 'line-through' : 'none',
            opacity: s.id === 'done' ? 0.55 : 1,
          }}>{project.name}</span>
        </div>
        <StatusBadge status={project.status} />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8, alignItems: 'center' }}>
        {cat && (
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-fade)' }}>
            {cat.label}
          </span>
        )}
        <CostDisplay estimated={project.estimatedCost} quoted={project.quotedCost} />
      </div>

      {project.notes && (
        <div style={{
          fontFamily: 'var(--pen)', fontSize: 12, color: 'var(--ink-fade)',
          marginTop: 6, lineHeight: 1.4,
          // Clamp to 2 lines
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {project.notes}
        </div>
      )}
    </div>
  );
}

// ─── Project list ──────────────────────────────────────────────────────────

function ProjectList({ projects, onEdit, onAdd }) {
  if (!projects.length) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--ink-soft)' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🏠</div>
        <div style={{ fontFamily: 'var(--hand)', fontSize: 22, marginBottom: 8 }}>
          What needs to happen around the house?
        </div>
        <div style={{ fontFamily: 'var(--pen)', fontSize: 14, marginBottom: 24, color: 'var(--ink-fade)', lineHeight: 1.5 }}>
          Track projects from a quick fix to a full renovation —<br />
          estimate the cost, log the quote, mark it done.
        </div>
        <button
          onClick={onAdd}
          style={{
            padding: '10px 22px',
            border: '1.5px solid var(--olive)',
            borderRadius: '12px 14px 10px 13px',
            background: 'var(--olive)', color: '#f7f5e6',
            fontFamily: 'var(--pen)', fontSize: 14,
            cursor: 'pointer',
          }}
        >＋ Add a project</button>
      </div>
    );
  }

  // Sort: in-progress first, then by status order, done last
  const ORDER = { 'in-progress': 0, quoted: 1, planning: 2, dreaming: 3, done: 4 };
  const sorted = [...projects].sort((a, b) => (ORDER[a.status] ?? 3) - (ORDER[b.status] ?? 3));

  const active = sorted.filter(p => p.status !== 'done');
  const done   = sorted.filter(p => p.status === 'done');

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {active.map(p => <ProjectCard key={p.id} project={p} onClick={() => onEdit(p)} />)}

      {done.length > 0 && (
        <>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-fade)', marginTop: 10 }}>
            Done ✓
          </div>
          {done.map(p => <ProjectCard key={p.id} project={p} onClick={() => onEdit(p)} />)}
        </>
      )}
    </div>
  );
}

// ─── Project sheet (add / edit) ────────────────────────────────────────────

function ProjectSheet({ project, onSave, onDelete, onClose }) {
  const isNew = !project.id;

  const [name,      setName]      = React.useState(project.name          || '');
  const [category,  setCategory]  = React.useState(project.category      || '');
  const [status,    setStatus]    = React.useState(project.status        || 'dreaming');
  const [estCost,   setEstCost]   = React.useState(project.estimatedCost || '');
  const [quotedCost,setQuotedCost]= React.useState(project.quotedCost    || '');
  const [notes,     setNotes]     = React.useState(project.notes         || '');
  const [confirmDel,setConfirmDel]= React.useState(false);
  const [error,     setError]     = React.useState('');

  function handleSave() {
    if (!name.trim()) { setError('Give this project a name.'); return; }
    setError('');
    const data = {
      name:          name.trim(),
      category,
      status,
      estimatedCost: parseCost(estCost),
      quotedCost:    parseCost(quotedCost),
      notes:         notes.trim(),
    };
    if (project.id) data.id = project.id;
    onSave(data);
  }

  const chipBtn = (active, onClick, children, activeColor = 'var(--olive)', activeBorder = 'var(--olive)') => ({
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '6px 12px',
    border: `1.5px solid ${active ? activeBorder : 'var(--rule)'}`,
    borderRadius: 20,
    background: active ? `rgba(107,122,74,0.14)` : 'rgba(255,255,255,0.5)',
    fontFamily: 'var(--pen)', fontSize: 13,
    color: active ? activeColor : 'var(--ink-soft)',
    cursor: 'pointer', transition: 'all .1s',
  });

  const inputSty = {
    border: '1.5px solid var(--rule)', borderRadius: '5px 7px 4px 6px',
    padding: '9px 12px', fontFamily: 'var(--pen)', fontSize: 14,
    color: 'var(--ink)', background: 'rgba(255,255,255,0.7)',
    outline: 'none', width: '100%',
  };

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
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontFamily: 'var(--hand)', fontWeight: 700, fontSize: 20, color: 'var(--ink)' }}>
            {isNew ? '＋ New project' : 'Edit project'}
          </span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--ink-fade)', lineHeight: 1, padding: 4 }}
          >✕</button>
        </div>

        {/* Project name */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontFamily: 'var(--hand)', fontSize: 15, color: 'var(--ink-soft)', display: 'block', marginBottom: 5 }}>
            What's the project?
          </label>
          <input
            style={inputSty}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Kitchen backsplash, fix the deck..."
            autoFocus={isNew}
          />
          {error && <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--terracotta)', marginTop: 4 }}>{error}</div>}
        </div>

        {/* Category */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontFamily: 'var(--hand)', fontSize: 15, color: 'var(--ink-soft)', display: 'block', marginBottom: 8 }}>
            Where in the house?
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategory(category === cat.id ? '' : cat.id)}
                style={chipBtn(category === cat.id, null, null)}
              >
                <span>{cat.emoji}</span> {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Status */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontFamily: 'var(--hand)', fontSize: 15, color: 'var(--ink-soft)', display: 'block', marginBottom: 8 }}>
            Status
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {STATUSES.map(s => (
              <button
                key={s.id}
                onClick={() => setStatus(s.id)}
                style={{
                  padding: '6px 14px',
                  border: `1.5px solid ${status === s.id ? s.border : 'var(--rule)'}`,
                  borderRadius: 20,
                  background: status === s.id ? s.bg : 'rgba(255,255,255,0.5)',
                  fontFamily: 'var(--pen)', fontSize: 13,
                  color: status === s.id ? s.color : 'var(--ink-soft)',
                  cursor: 'pointer', transition: 'all .1s',
                }}
              >{s.label}</button>
            ))}
          </div>
          {status === 'in-progress' && (
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-fade)', marginTop: 6 }}>
              Work in progress — project gets a terracotta accent on the card
            </div>
          )}
        </div>

        {/* Cost section */}
        <div style={{
          margin: '4px -18px 18px',
          padding: '16px 18px',
          background: 'rgba(107,122,74,0.06)',
          borderTop: '1px solid var(--rule-soft)',
          borderBottom: '1px solid var(--rule-soft)',
        }}>
          <div style={{ fontFamily: 'var(--hand)', fontWeight: 700, fontSize: 17, color: 'var(--ink)', marginBottom: 14 }}>
            What will this cost?
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {/* Estimated cost */}
            <div>
              <label style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-fade)', display: 'block', marginBottom: 6 }}>
                Your estimate
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--mono)', fontSize: 14, color: 'var(--ink-soft)' }}>$</span>
                <input
                  type="number" min="0"
                  style={{ ...inputSty, paddingLeft: 22 }}
                  value={estCost}
                  onChange={e => setEstCost(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-fade)', marginTop: 4 }}>
                What you think it'll run
              </div>
            </div>

            {/* Quoted cost */}
            <div>
              <label style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-fade)', display: 'block', marginBottom: 6 }}>
                Quoted cost
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--mono)', fontSize: 14, color: 'var(--ink-soft)' }}>$</span>
                <input
                  type="number" min="0"
                  style={{ ...inputSty, paddingLeft: 22 }}
                  value={quotedCost}
                  onChange={e => setQuotedCost(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-fade)', marginTop: 4 }}>
                Once you get a quote
              </div>
            </div>
          </div>

          {/* Live cost comparison */}
          {(parseCost(estCost) || parseCost(quotedCost)) && (
            <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(255,255,255,0.5)', borderRadius: 6 }}>
              <CostDisplay estimated={estCost} quoted={quotedCost} />
            </div>
          )}
        </div>

        {/* Notes / details */}
        <div style={{ marginBottom: 22 }}>
          <label style={{ fontFamily: 'var(--hand)', fontSize: 15, color: 'var(--ink-soft)', display: 'block', marginBottom: 5 }}>
            Details &amp; notes
          </label>
          <textarea
            className="notes-textarea"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="What needs doing, materials needed, contractor contacts, links to inspiration..."
            style={{ minHeight: 100 }}
          />
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-fade)', marginTop: 4 }}>
            Update as you learn more — this is a living document for the project
          </div>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          style={{
            width: '100%', padding: '11px',
            border: 'none', borderRadius: '6px 8px 5px 7px',
            background: 'var(--olive)', color: '#f7f5e6',
            fontFamily: 'var(--pen)', fontSize: 15,
            cursor: 'pointer',
          }}
        >
          {isNew ? '＋ Add project' : 'Save changes'}
        </button>

        {/* Delete */}
        {!isNew && (
          <div style={{ marginTop: 12 }}>
            {!confirmDel ? (
              <button
                onClick={() => setConfirmDel(true)}
                style={{
                  width: '100%', padding: '8px',
                  background: 'none', border: '1.5px solid var(--rule-soft)',
                  borderRadius: '6px', fontFamily: 'var(--pen)', fontSize: 13,
                  color: 'var(--ink-fade)', cursor: 'pointer',
                }}
              >Delete project</button>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => onDelete(project.id)}
                  style={{
                    flex: 1, padding: '8px',
                    background: 'none', border: '1.5px solid var(--terracotta)',
                    borderRadius: '6px', fontFamily: 'var(--pen)', fontSize: 13,
                    color: 'var(--terracotta)', cursor: 'pointer',
                  }}
                >Yes, delete</button>
                <button
                  onClick={() => setConfirmDel(false)}
                  style={{
                    flex: 1, padding: '8px',
                    background: 'none', border: '1.5px solid var(--rule-soft)',
                    borderRadius: '6px', fontFamily: 'var(--pen)', fontSize: 13,
                    color: 'var(--ink-soft)', cursor: 'pointer',
                  }}
                >Keep it</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Summary bar ───────────────────────────────────────────────────────────

function SummaryBar({ projects }) {
  if (!projects.length) return null;

  const active      = projects.filter(p => p.status !== 'done');
  const inProgress  = projects.filter(p => p.status === 'in-progress');
  const quoted      = projects.filter(p => p.status === 'quoted');
  const totalEst    = active.reduce((sum, p) => sum + (parseCost(p.estimatedCost) || 0), 0);
  const totalQuoted = active.reduce((sum, p) => sum + (parseCost(p.quotedCost)    || 0), 0);

  return (
    <div style={{
      margin: '0 16px 4px',
      padding: '10px 14px',
      background: 'rgba(107,122,74,0.08)',
      border: '1px solid rgba(107,122,74,0.2)',
      borderRadius: '8px 10px 7px 9px',
      display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center',
    }}>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-soft)' }}>
        {active.length} active project{active.length !== 1 ? 's' : ''}
      </span>
      {inProgress.length > 0 && (
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--terracotta)' }}>
          {inProgress.length} in progress
        </span>
      )}
      {quoted.length > 0 && (
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-soft)' }}>
          {quoted.length} quoted
        </span>
      )}
      {totalEst > 0 && (
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-soft)' }}>
          est. {fmtCost(totalEst)}
          {totalQuoted > 0 && totalQuoted !== totalEst && (
            <span style={{ color: totalQuoted > totalEst ? 'var(--terracotta)' : 'var(--olive)', marginLeft: 4 }}>
              → {fmtCost(totalQuoted)} quoted
            </span>
          )}
        </span>
      )}
    </div>
  );
}

// ─── App root ─────────────────────────────────────────────────────────────

function HomeApp() {
  const { household } = useHomeAuth();
  const householdId = household?.id;

  const [projects, setProjects] = React.useState(() => loadProjectsLocal());
  const [sheet,    setSheet]    = React.useState(null);

  // Real-time Firestore subscription
  React.useEffect(() => {
    if (!householdId) return;
    const unsub = subscribeProjects(householdId, setProjects);
    return unsub;
  }, [householdId]);

  async function handleSave(data) {
    if (data.id) {
      setProjects(prev => prev.map(p => p.id === data.id ? { ...p, ...data } : p));
      updateProject(householdId, data.id, data).catch(console.error);
    } else {
      addProject(householdId, data).catch(console.error);
    }
    setSheet(null);
  }

  async function handleDelete(id) {
    setProjects(prev => prev.filter(p => p.id !== id));
    deleteProject(householdId, id).catch(console.error);
    setSheet(null);
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', background: 'var(--paper)', minHeight: '100vh' }}>
      <Nav onAdd={() => setSheet({})} />

      <div style={{ paddingBottom: 40 }}>
        {projects.length > 0 && (
          <div style={{ padding: '14px 0 6px' }}>
            <SummaryBar projects={projects} />
          </div>
        )}
        <ProjectList
          projects={projects}
          onEdit={p => setSheet(p)}
          onAdd={() => setSheet({})}
        />
      </div>

      {sheet !== null && (
        <ProjectSheet
          project={sheet}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setSheet(null)}
        />
      )}
    </div>
  );
}

function HomeRoot() {
  return (
    <HomeAuthProvider>
      <HomeApp />
    </HomeAuthProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<HomeRoot />);
