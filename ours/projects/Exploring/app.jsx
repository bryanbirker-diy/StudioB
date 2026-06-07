// app.jsx — Our Exploring

// ─── Auth import ──────────────────────────────────────────────────────────
const { AuthProvider: ExAuthProvider, useAuth: useExAuth } = window._oursAuth;

// ─── Constants ────────────────────────────────────────────────────────────

const STATUSES = [
  { id: 'dreaming',  label: 'Dreaming',  color: 'var(--ink-fade)',   bg: 'transparent',            border: 'var(--rule)' },
  { id: 'planning',  label: 'Planning',  color: 'var(--ink)',        bg: 'rgba(195,145,105,0.18)', border: 'var(--clay)' },
  { id: 'booked',    label: 'Booked',    color: '#fdf6ec',           bg: 'var(--terracotta)',       border: '#5a3a20' },
  { id: 'done',      label: 'Done',      color: 'var(--ink-fade)',   bg: 'rgba(107,122,74,0.15)',  border: 'var(--olive)' },
];

const DURATION_PRESETS = [
  { label: 'Day trip', days: 1 },
  { label: 'Weekend',  days: 2 },
  { label: '3 days',   days: 3 },
  { label: '5 days',   days: 5 },
  { label: '1 week',   days: 7 },
];

// ─── Preference options (stored now, power GCal queries later) ─────────────

const WINDOW_TYPES = [
  { id: 'long-weekend', label: 'Thu – Sun',    emoji: '🗓', hint: 'Long weekend starts' },
  { id: 'weekend',      label: 'Sat & Sun',    emoji: '📅', hint: 'Standard weekend' },
  { id: 'weekdays',     label: 'Weekdays OK',  emoji: '💼', hint: 'Any day of the week' },
  { id: 'any',          label: 'Anytime',      emoji: '🤷', hint: 'Just find us a window' },
];

const DEPART_TIMES = [
  { id: 'morning',   label: 'Morning',   emoji: '🌅', hint: 'Leave before noon' },
  { id: 'afternoon', label: 'Afternoon', emoji: '☀️',  hint: 'After lunch' },
  { id: 'flexible',  label: 'Flexible',  emoji: '🤔', hint: "Doesn't matter" },
];

const WHO_COMING = [
  { id: 'us',      label: 'Just us',       emoji: '👫' },
  { id: 'family',  label: 'Family trip',   emoji: '👨‍👩‍👧' },
  { id: 'friends', label: 'Friends too',   emoji: '🎉' },
  { id: 'solo',    label: 'Solo',          emoji: '🧍' },
];

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES = ['Su','Mo','Tu','We','Th','Fr','Sa'];

// ─── Helpers ──────────────────────────────────────────────────────────────

function fmt(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  return `${MONTHS[m-1]} ${d}, ${y}`;
}

function fmtCost(n) {
  if (!n && n !== 0) return '';
  return '$' + Number(n).toLocaleString();
}

function daysUntil(iso) {
  if (!iso) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  const target = new Date(iso + 'T00:00:00');
  return Math.round((target - today) / 86400000);
}

function statusInfo(id) {
  return STATUSES.find(s => s.id === id) || STATUSES[0];
}

function addDays(isoDate, n) {
  // Returns the last day of a trip: startDate + (n-1) days
  if (!isoDate || !n) return '';
  const d = new Date(isoDate + 'T00:00:00');
  d.setDate(d.getDate() + n - 1);
  return d.toISOString().slice(0, 10);
}

function durationLabel(days) {
  if (days === 1) return 'Day trip';
  if (days === 2) return 'Weekend';
  if (days === 7) return '1 week';
  if (days === 14) return '2 weeks';
  return `${days} days`;
}

// Find upcoming windows of N consecutive days between today and targetDate.
// Respects windowType preference — future: replace body with GCal free/busy query.
// gcalReady flag: when true, skip local logic and use GCal API instead.
function findWindows(targetDateIso, durationDays, prefs = {}) {
  if (!targetDateIso) return [];
  const today = new Date(); today.setHours(0,0,0,0);
  const end   = new Date(targetDateIso + 'T00:00:00');
  if (end <= today) return [];

  const windowType = prefs.windowType || 'any';
  const departTime = prefs.departTime || 'flexible'; // stored for GCal, not used locally yet

  // Which day-of-week starts are valid for this preference?
  // DOW: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  function isValidStart(dow) {
    if (windowType === 'long-weekend') {
      // Thu or Fri starts → run through weekend
      return durationDays <= 4 ? [4, 5].includes(dow) : [4, 5, 6].includes(dow);
    }
    if (windowType === 'weekend') {
      // Sat start for 1-2 days; Fri start for 3-day
      return durationDays <= 2 ? dow === 6 : [5, 6].includes(dow);
    }
    if (windowType === 'weekdays') {
      // Mon–Wed start so trip doesn't bleed into next week awkwardly
      return durationDays <= 5 ? [1, 2, 3].includes(dow) : true;
    }
    // 'any' — prefer Fri/Sat/Sun for short, Mon for long
    if (durationDays <= 3) return [4, 5, 6, 0].includes(dow);
    if (durationDays <= 7) return dow === 1;
    return true; // multi-week: any start
  }

  const windows = [];
  const cur = new Date(today);

  while (cur < end && windows.length < 5) {
    const dow = cur.getDay();
    const windowEnd = new Date(cur);
    windowEnd.setDate(cur.getDate() + durationDays - 1);

    if (windowEnd < end && isValidStart(dow)) {
      const startM = cur.getMonth(), startD = cur.getDate();
      const endM   = windowEnd.getMonth(), endD = windowEnd.getDate();
      const startLabel = `${MONTHS[startM].slice(0,3)} ${startD}`;
      const endLabel   = durationDays > 1 ? `– ${MONTHS[endM].slice(0,3)} ${endD}` : '';
      windows.push({
        start:     cur.toISOString().slice(0,10),
        end:       windowEnd.toISOString().slice(0,10),
        label:     `${startLabel} ${endLabel}`.trim(),
        daysUntil: Math.round((cur - today) / 86400000),
        // departTime stored on window for GCal event creation
        departTime,
      });
    }
    cur.setDate(cur.getDate() + 1);
  }
  return windows;
}

function googleCalUrl(trip, win) {
  // win can be a window object {start, departTime} or a plain ISO string
  const startIso   = typeof win === 'string' ? win : win.start;
  const departTime = typeof win === 'object'  ? win.departTime : null;
  if (!startIso) return null;

  const endDate = new Date(startIso + 'T00:00:00');
  endDate.setDate(endDate.getDate() + trip.duration);
  const fmt8 = d => d.replace(/-/g, '');
  const start8 = fmt8(startIso);
  const end8   = fmt8(endDate.toISOString().slice(0,10));

  const whoLabel = trip.whosComing
    ? { us: 'Just us', family: 'Family trip', friends: 'Friends too', solo: 'Solo' }[trip.whosComing]
    : null;
  const timeLabel = departTime && departTime !== 'flexible'
    ? `Depart: ${departTime}`
    : null;

  const details = [
    trip.estimatedCost ? `Est. cost: $${Number(trip.estimatedCost).toLocaleString()}` : '',
    whoLabel,
    timeLabel,
    trip.notes || '',
  ].filter(Boolean).join(' · ');

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(trip.name)}&dates=${start8}/${end8}&details=${encodeURIComponent(details)}&sf=true`;
}

// ─── Nav ──────────────────────────────────────────────────────────────────

function Nav({ tab, setTab, onAdd }) {
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
        background: 'var(--terracotta)', border: '1.5px solid #5a3a20',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fdf6ec', fontFamily: 'var(--hand)', fontWeight: 700, fontSize: 14,
        flexShrink: 0,
      }}>E</div>

      <span style={{ fontFamily: 'var(--hand)', fontWeight: 700, fontSize: 17, color: 'var(--ink)', flex: 1 }}>
        Our Exploring
      </span>

      <button
        className="btn btn-terracotta btn-sm"
        onClick={onAdd}
        style={{ fontFamily: 'var(--pen)' }}
      >＋ Trip</button>
    </nav>
  );
}

// ─── Tab bar ──────────────────────────────────────────────────────────────

function TabBar({ tab, setTab }) {
  return (
    <div style={{
      display: 'flex', borderBottom: '1.5px solid var(--rule-soft)',
      padding: '0 16px', background: 'var(--paper)',
    }}>
      {[['trips','→ Trips'],['calendar','◻ Calendar']].map(([id, label]) => (
        <button key={id} onClick={() => setTab(id)} style={{
          padding: '8px 16px',
          border: 'none', background: 'none',
          borderBottom: tab === id ? '2px solid var(--terracotta)' : '2px solid transparent',
          fontFamily: 'var(--pen)', fontSize: 14,
          color: tab === id ? 'var(--terracotta)' : 'var(--ink-fade)',
          cursor: 'pointer', transition: 'color .12s',
        }}>{label}</button>
      ))}
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const s = statusInfo(status);
  return (
    <span style={{
      fontFamily: 'var(--mono)', fontSize: 10,
      letterSpacing: '0.08em', textTransform: 'uppercase',
      padding: '2px 8px',
      borderRadius: '10px',
      background: s.bg, border: `1px solid ${s.border}`,
      color: s.color,
    }}>{s.label}</span>
  );
}

// ─── Trip card ────────────────────────────────────────────────────────────

function TripCard({ trip, onClick }) {
  const d = daysUntil(trip.targetDate);
  const urgency = d !== null && d <= 30 && trip.status !== 'done' && trip.status !== 'booked';

  return (
    <div
      onClick={onClick}
      style={{
        border: '1.5px solid var(--rule-soft)',
        borderLeft: `4px solid ${urgency ? 'var(--terracotta)' : 'var(--rule-soft)'}`,
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
        <div style={{ fontFamily: 'var(--hand)', fontWeight: 700, fontSize: 18, color: 'var(--ink)', lineHeight: 1.1, flex: 1 }}>
          {trip.status === 'done'
            ? <span style={{ textDecoration: 'line-through', opacity: 0.5 }}>{trip.name}</span>
            : trip.name
          }
        </div>
        <StatusBadge status={trip.status} />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8, alignItems: 'center' }}>
        {/* Dates or duration */}
        {trip.startDate ? (
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-soft)' }}>
            📅 {fmt(trip.startDate)}{trip.duration > 1 ? ` – ${fmt(addDays(trip.startDate, trip.duration))}` : ''}
          </span>
        ) : (
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-soft)' }}>
            ⏱ {durationLabel(trip.duration)}
          </span>
        )}

        {/* Cal link when dates are confirmed */}
        {trip.startDate && (
          <a
            href={googleCalUrl(trip, trip.startDate)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{
              fontFamily: 'var(--mono)', fontSize: 10,
              color: 'var(--terracotta)', textDecoration: 'none',
              padding: '2px 8px',
              border: '1px solid var(--terracotta)',
              borderRadius: 10, whiteSpace: 'nowrap',
            }}
          >+ Cal</a>
        )}

        {/* Cost */}
        {trip.estimatedCost > 0 && (
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-soft)' }}>
            💰 {fmtCost(trip.estimatedCost)}
          </span>
        )}

        {/* Target date (only show if no startDate set yet) */}
        {trip.targetDate && !trip.startDate && (
          <span style={{
            fontFamily: 'var(--mono)', fontSize: 11,
            color: urgency ? 'var(--terracotta)' : 'var(--ink-soft)',
          }}>
            🗓 by {fmt(trip.targetDate)}
            {d !== null && trip.status !== 'done' && (
              <span style={{ opacity: 0.7 }}> · {d < 0 ? 'overdue' : d === 0 ? 'today' : `${d}d`}</span>
            )}
          </span>
        )}
      </div>

      {trip.notes && (
        <div style={{ fontFamily: 'var(--pen)', fontSize: 12, color: 'var(--ink-fade)', marginTop: 6, lineHeight: 1.4 }}>
          {trip.notes}
        </div>
      )}
    </div>
  );
}

// ─── Trip list ────────────────────────────────────────────────────────────

function TripList({ trips, onEdit, onAdd }) {
  const sorted = [...trips].sort((a, b) => {
    const order = { dreaming: 3, planning: 2, booked: 1, done: 4 };
    if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
    return (a.targetDate || '9999') < (b.targetDate || '9999') ? -1 : 1;
  });

  if (!trips.length) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--ink-soft)' }}>
        <div style={{ fontSize: 36, marginBottom: 16, letterSpacing: '0.15em' }}>✈ 🚗 🥾</div>
        <div style={{ fontFamily: 'var(--hand)', fontSize: 22, marginBottom: 8 }}>Where do you want to go?</div>
        <div style={{ fontFamily: 'var(--pen)', fontSize: 14, marginBottom: 24, color: 'var(--ink-fade)' }}>
          Fly, drive, hike — add your first adventure, even if it's just a dream right now.
        </div>
        <button className="btn btn-terracotta" onClick={onAdd}>＋ Add an adventure</button>
      </div>
    );
  }

  const active = sorted.filter(t => t.status !== 'done');
  const done   = sorted.filter(t => t.status === 'done');

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {active.map(t => <TripCard key={t.id} trip={t} onClick={() => onEdit(t)} />)}
      {done.length > 0 && (
        <>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-fade)', marginTop: 8 }}>
            Done ✓
          </div>
          {done.map(t => <TripCard key={t.id} trip={t} onClick={() => onEdit(t)} />)}
        </>
      )}
    </div>
  );
}

// ─── Calendar view ────────────────────────────────────────────────────────

function CalendarView({ trips }) {
  const today = new Date(); today.setHours(0,0,0,0);
  const [viewDate, setViewDate] = React.useState(() => {
    const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() };
  });

  const prevMonth = () => setViewDate(v => {
    let m = v.m - 1, y = v.y;
    if (m < 0) { m = 11; y--; }
    return { y, m };
  });
  const nextMonth = () => setViewDate(v => {
    let m = v.m + 1, y = v.y;
    if (m > 11) { m = 0; y++; }
    return { y, m };
  });

  const firstDay   = new Date(viewDate.y, viewDate.m, 1).getDay();
  const daysInMo   = new Date(viewDate.y, viewDate.m + 1, 0).getDate();

  // Index trips by date string
  const tripsByDate = {};
  trips.forEach(t => {
    if (t.targetDate) {
      if (!tripsByDate[t.targetDate]) tripsByDate[t.targetDate] = [];
      tripsByDate[t.targetDate].push(t);
    }
  });

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMo; d++) {
    const iso = `${viewDate.y}-${String(viewDate.m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    cells.push({ d, iso, trips: tripsByDate[iso] || [] });
  }

  // Upcoming trips with fit windows
  const upcoming = trips
    .filter(t => t.targetDate && t.status !== 'done' && daysUntil(t.targetDate) > 0)
    .sort((a,b) => a.targetDate < b.targetDate ? -1 : 1)
    .slice(0, 4);

  return (
    <div style={{ padding: '16px' }}>
      {/* Month navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <button onClick={prevMonth} className="btn btn-ghost btn-sm">‹</button>
        <span style={{ fontFamily: 'var(--hand)', fontWeight: 700, fontSize: 18, color: 'var(--ink)' }}>
          {MONTHS[viewDate.m]} {viewDate.y}
        </span>
        <button onClick={nextMonth} className="btn btn-ghost btn-sm">›</button>
      </div>

      {/* Day name headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 4 }}>
        {DAY_NAMES.map(n => (
          <div key={n} style={{ fontFamily: 'var(--mono)', fontSize: 9, textAlign: 'center', color: 'var(--ink-fade)', letterSpacing: '0.06em', textTransform: 'uppercase', padding: '2px 0' }}>
            {n}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
        {cells.map((cell, i) => {
          if (!cell) return <div key={`e${i}`} />;
          const isToday = cell.iso === today.toISOString().slice(0,10);
          const hasTrips = cell.trips.length > 0;
          const isSatSun = (i % 7 === 0) || (i % 7 === 6);

          return (
            <div key={cell.iso} style={{
              minHeight: 36, padding: '3px 2px',
              borderRadius: 4,
              background: isToday ? 'rgba(168,117,77,0.15)' : isSatSun ? 'rgba(0,0,0,0.02)' : 'transparent',
              border: isToday ? '1.5px solid var(--terracotta)' : '1.5px solid transparent',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            }}>
              <span style={{
                fontFamily: 'var(--mono)', fontSize: 11,
                color: isToday ? 'var(--terracotta)' : 'var(--ink-soft)',
                fontWeight: isToday ? 700 : 400,
              }}>{cell.d}</span>
              {cell.trips.map((t, ti) => (
                <div key={ti} style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: statusInfo(t.status).id === 'booked' ? 'var(--terracotta)' :
                              statusInfo(t.status).id === 'done'   ? 'var(--olive)' :
                              statusInfo(t.status).id === 'planning' ? 'var(--clay)' : 'var(--ink-fade)',
                }} />
              ))}
            </div>
          );
        })}
      </div>

      {/* Wavy divider */}
      <div className="divider-wavy" style={{ margin: '20px 0', opacity: 0.35 }} />

      {/* Fit windows */}
      {upcoming.length > 0 && (
        <div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-fade)', marginBottom: 12 }}>
            Window finder
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {upcoming.map(trip => {
              const windows = findWindows(trip.targetDate, trip.duration, { windowType: trip.windowType, departTime: trip.departTime });
              return (
                <div key={trip.id} style={{
                  border: '1.5px solid var(--rule-soft)',
                  borderRadius: '8px 10px 7px 9px',
                  padding: '12px 14px',
                  background: 'rgba(255,255,255,0.45)',
                }}>
                  <div style={{ fontFamily: 'var(--hand)', fontWeight: 700, fontSize: 16, color: 'var(--ink)', marginBottom: 4 }}>
                    {trip.name}
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-fade)', fontWeight: 400, marginLeft: 8 }}>
                      {durationLabel(trip.duration)} · by {fmt(trip.targetDate)}
                    </span>
                  </div>

                  {windows.length === 0 ? (
                    <div style={{ fontFamily: 'var(--pen)', fontSize: 12, color: 'var(--terracotta)' }}>
                      No windows found — target date may have passed.
                    </div>
                  ) : (
                    <>
                      <div style={{ fontFamily: 'var(--pen)', fontSize: 12, color: 'var(--ink-soft)', marginBottom: 8 }}>
                        {windows.length} potential window{windows.length !== 1 ? 's' : ''} before your target:
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {windows.map((w, wi) => (
                          <div key={wi} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                            <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink)' }}>
                              {w.label}
                              <span style={{ color: 'var(--ink-fade)', fontSize: 10, marginLeft: 6 }}>in {w.daysUntil}d</span>
                            </span>
                            <a
                              href={googleCalUrl(trip, w)}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                fontFamily: 'var(--mono)', fontSize: 10,
                                color: 'var(--terracotta)',
                                textDecoration: 'none',
                                padding: '2px 8px',
                                border: '1px solid var(--terracotta)',
                                borderRadius: 10,
                                whiteSpace: 'nowrap',
                              }}
                            >+ Cal</a>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{
            marginTop: 14, padding: '10px 14px',
            border: '1px dashed var(--rule-soft)',
            borderRadius: 8,
            fontFamily: 'var(--pen)', fontSize: 12,
            color: 'var(--ink-fade)', lineHeight: 1.5,
          }}>
            💡 "+ Cal" opens Google Calendar pre-filled with the trip dates — no login needed. Connect Google Calendar for live availability in a future update.
          </div>
        </div>
      )}

      {upcoming.length === 0 && trips.length > 0 && (
        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--ink-soft)', fontFamily: 'var(--pen)', fontSize: 13 }}>
          No upcoming trips with target dates set yet.
        </div>
      )}
    </div>
  );
}

// ─── Trip sheet (add / edit) ──────────────────────────────────────────────

function TripSheet({ trip, onSave, onDelete, onClose }) {
  const isNew = !trip.id;
  const [name,       setName]       = React.useState(trip.name        || '');
  const [startDate,  setStartDate]  = React.useState(trip.startDate   || '');
  const [duration,   setDuration]   = React.useState(trip.duration    || 2);
  const [custom,     setCustom]     = React.useState(!DURATION_PRESETS.find(p => p.days === (trip.duration || 2)));
  const [target,     setTarget]     = React.useState(trip.targetDate  || '');
  const [cost,       setCost]       = React.useState(trip.estimatedCost || '');
  const [status,     setStatus]     = React.useState(trip.status      || 'dreaming');
  const [notes,      setNotes]      = React.useState(trip.notes       || '');
  // Preference fields — used by window finder now, GCal query later
  const [windowType, setWindowType] = React.useState(trip.windowType  || 'any');
  const [departTime, setDepartTime] = React.useState(trip.departTime  || 'flexible');
  const [whosComing, setWhosComing] = React.useState(trip.whosComing  || 'us');
  const [confirmDel, setConfirmDel] = React.useState(false);
  const [error,      setError]      = React.useState('');

  function handleSave() {
    if (!name.trim()) { setError('Give this trip a name.'); return; }
    setError('');
    const data = {
      name:          name.trim(),
      duration:      Number(duration),
      startDate:     startDate || '',
      targetDate:    target,
      estimatedCost: cost ? Number(String(cost).replace(/[^0-9.]/g,'')) : 0,
      status,
      notes:         notes.trim(),
      // Preferences (window finder + future GCal)
      windowType,
      departTime,
      whosComing,
    };
    // Preserve id if editing an existing trip; omit for new trips (store assigns it)
    if (trip.id) data.id = trip.id;
    onSave(data);
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(24,20,16,.48)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: 'var(--paper)', borderRadius: '18px 18px 4px 4px',
        padding: '20px 18px 32px', width: '100%', maxWidth: 500,
        maxHeight: '92vh', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontFamily: 'var(--hand)', fontWeight: 700, fontSize: 20, color: 'var(--ink)' }}>
            {isNew ? '＋ New trip' : 'Edit trip'}
          </span>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ fontSize: 18, lineHeight: 1 }}>✕</button>
        </div>

        {/* Trip name */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontFamily: 'var(--hand)', fontSize: 15, color: 'var(--ink-soft)', display: 'block', marginBottom: 5 }}>
            Where are you going?
          </label>
          <input
            className="text-input"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="We going to Florida?"
            autoFocus={isNew}
            style={{ fontSize: 16 }}
          />
          {error && <div style={{ color: 'var(--terracotta)', fontFamily: 'var(--mono)', fontSize: 11, marginTop: 4 }}>{error}</div>}
        </div>

        {/* Trip dates */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontFamily: 'var(--hand)', fontSize: 15, color: 'var(--ink-soft)', display: 'block', marginBottom: 5 }}>
            When are you going?{' '}
            <span style={{ fontFamily: 'var(--pen)', fontWeight: 400, fontSize: 12, opacity: 0.5 }}>optional</span>
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              type="date"
              className="text-input"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              style={{ fontFamily: 'var(--mono)', flex: 1 }}
            />
            {startDate && duration && (
              <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-soft)', whiteSpace: 'nowrap' }}>
                → {fmt(addDays(startDate, duration))}
              </span>
            )}
          </div>
          {startDate && (
            <a
              href={googleCalUrl({ name: name || 'Our trip', duration: Number(duration), estimatedCost: cost, whosComing, notes, departTime }, startDate)}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                marginTop: 8, padding: '6px 14px',
                border: '1.5px solid var(--terracotta)',
                borderRadius: 20,
                background: 'rgba(168,117,77,0.08)',
                fontFamily: 'var(--pen)', fontSize: 13,
                color: 'var(--terracotta)', textDecoration: 'none',
              }}
            >
              📅 Add to Google Calendar
            </a>
          )}
        </div>

        {/* Duration */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontFamily: 'var(--hand)', fontSize: 15, color: 'var(--ink-soft)', display: 'block', marginBottom: 8 }}>
            Time commitment
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {DURATION_PRESETS.map(p => (
              <button
                key={p.days}
                onClick={() => { setDuration(p.days); setCustom(false); }}
                style={{
                  padding: '5px 12px',
                  border: `1.5px solid ${!custom && duration === p.days ? 'var(--terracotta)' : 'var(--rule)'}`,
                  borderRadius: '12px',
                  background: !custom && duration === p.days ? 'rgba(168,117,77,0.12)' : 'transparent',
                  fontFamily: 'var(--pen)', fontSize: 13,
                  color: !custom && duration === p.days ? 'var(--terracotta)' : 'var(--ink-soft)',
                  cursor: 'pointer',
                }}
              >{p.label}</button>
            ))}
            <button
              onClick={() => setCustom(true)}
              style={{
                padding: '5px 12px',
                border: `1.5px solid ${custom ? 'var(--terracotta)' : 'var(--rule)'}`,
                borderRadius: '12px',
                background: custom ? 'rgba(168,117,77,0.12)' : 'transparent',
                fontFamily: 'var(--pen)', fontSize: 13,
                color: custom ? 'var(--terracotta)' : 'var(--ink-soft)',
                cursor: 'pointer',
              }}
            >Custom</button>
          </div>
          {custom && (
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="number" min="1" max="60"
                className="text-input"
                value={duration}
                onChange={e => setDuration(e.target.value)}
                style={{ width: 64 }}
              />
              <span style={{ fontFamily: 'var(--pen)', fontSize: 13, color: 'var(--ink-soft)' }}>days</span>
            </div>
          )}
        </div>

        {/* ── What are we thinking? ─────────────────────────── */}
        <div style={{
          margin: '4px -18px 16px',
          padding: '16px 18px',
          background: 'rgba(168,117,77,0.06)',
          borderTop: '1px solid var(--rule-soft)',
          borderBottom: '1px solid var(--rule-soft)',
        }}>
          <div style={{ fontFamily: 'var(--hand)', fontWeight: 700, fontSize: 17, color: 'var(--ink)', marginBottom: 14 }}>
            What are we thinking?
          </div>

          {/* When works? */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-fade)', marginBottom: 8 }}>
              When works for us?
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {WINDOW_TYPES.map(opt => (
                <button key={opt.id} onClick={() => setWindowType(opt.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '6px 12px',
                  border: `1.5px solid ${windowType === opt.id ? 'var(--terracotta)' : 'var(--rule)'}`,
                  borderRadius: 20,
                  background: windowType === opt.id ? 'rgba(168,117,77,0.14)' : 'rgba(255,255,255,0.5)',
                  fontFamily: 'var(--pen)', fontSize: 13,
                  color: windowType === opt.id ? 'var(--terracotta)' : 'var(--ink-soft)',
                  cursor: 'pointer', transition: 'all .1s',
                }}>
                  <span>{opt.emoji}</span> {opt.label}
                </button>
              ))}
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-fade)', marginTop: 5 }}>
              {WINDOW_TYPES.find(o => o.id === windowType)?.hint}
            </div>
          </div>

          {/* Leaving when? */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-fade)', marginBottom: 8 }}>
              Leaving when?
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {DEPART_TIMES.map(opt => (
                <button key={opt.id} onClick={() => setDepartTime(opt.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '6px 12px',
                  border: `1.5px solid ${departTime === opt.id ? 'var(--terracotta)' : 'var(--rule)'}`,
                  borderRadius: 20,
                  background: departTime === opt.id ? 'rgba(168,117,77,0.14)' : 'rgba(255,255,255,0.5)',
                  fontFamily: 'var(--pen)', fontSize: 13,
                  color: departTime === opt.id ? 'var(--terracotta)' : 'var(--ink-soft)',
                  cursor: 'pointer', transition: 'all .1s',
                }}>
                  <span>{opt.emoji}</span> {opt.label}
                </button>
              ))}
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-fade)', marginTop: 5 }}>
              Stored for calendar matching — helps when Google Calendar is connected
            </div>
          </div>

          {/* Who's coming? */}
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-fade)', marginBottom: 8 }}>
              Who's coming?
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {WHO_COMING.map(opt => (
                <button key={opt.id} onClick={() => setWhosComing(opt.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '6px 12px',
                  border: `1.5px solid ${whosComing === opt.id ? 'var(--terracotta)' : 'var(--rule)'}`,
                  borderRadius: 20,
                  background: whosComing === opt.id ? 'rgba(168,117,77,0.14)' : 'rgba(255,255,255,0.5)',
                  fontFamily: 'var(--pen)', fontSize: 13,
                  color: whosComing === opt.id ? 'var(--terracotta)' : 'var(--ink-soft)',
                  cursor: 'pointer', transition: 'all .1s',
                }}>
                  <span>{opt.emoji}</span> {opt.label}
                </button>
              ))}
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-fade)', marginTop: 5 }}>
              When Google Calendar connects, we'll check the right calendars automatically
            </div>
          </div>
        </div>

        {/* Target date */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontFamily: 'var(--hand)', fontSize: 15, color: 'var(--ink-soft)', display: 'block', marginBottom: 5 }}>
            Complete by
          </label>
          <input
            type="date"
            className="text-input"
            value={target}
            onChange={e => setTarget(e.target.value)}
            style={{ fontFamily: 'var(--mono)' }}
          />
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-fade)', marginTop: 4 }}>
            "I want to take this trip before..." — helps find available windows.
          </div>
        </div>

        {/* Estimated cost */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontFamily: 'var(--hand)', fontSize: 15, color: 'var(--ink-soft)', display: 'block', marginBottom: 5 }}>
            Estimated cost
          </label>
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
              fontFamily: 'var(--mono)', fontSize: 14, color: 'var(--ink-soft)',
            }}>$</span>
            <input
              type="number" min="0"
              className="text-input"
              value={cost}
              onChange={e => setCost(e.target.value)}
              placeholder="0"
              style={{ paddingLeft: 22 }}
            />
          </div>
        </div>

        {/* Status */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontFamily: 'var(--hand)', fontSize: 15, color: 'var(--ink-soft)', display: 'block', marginBottom: 8 }}>
            Status
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {STATUSES.map(s => (
              <button key={s.id} onClick={() => setStatus(s.id)} style={{
                padding: '5px 12px',
                border: `1.5px solid ${status === s.id ? 'var(--terracotta)' : 'var(--rule)'}`,
                borderRadius: 12,
                background: status === s.id ? 'rgba(168,117,77,0.12)' : 'transparent',
                fontFamily: 'var(--pen)', fontSize: 13,
                color: status === s.id ? 'var(--terracotta)' : 'var(--ink-soft)',
                cursor: 'pointer',
              }}>{s.label}</button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div style={{ marginBottom: 22 }}>
          <label style={{ fontFamily: 'var(--hand)', fontSize: 15, color: 'var(--ink-soft)', display: 'block', marginBottom: 5 }}>
            Notes / things to do
          </label>
          <textarea
            className="ingredient-textarea"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Places to visit, restaurants, must-see spots..."
            style={{ minHeight: 90 }}
          />
        </div>

        {/* Actions */}
        <button className="btn btn-terracotta" style={{ width: '100%', justifyContent: 'center', fontSize: 15, padding: '10px' }} onClick={handleSave}>
          {isNew ? 'Add trip ✈' : 'Save changes'}
        </button>

        {!isNew && (
          <div style={{ marginTop: 12 }}>
            {!confirmDel ? (
              <button className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center', color: 'var(--ink-fade)' }} onClick={() => setConfirmDel(true)}>
                Delete trip
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: 'center', color: 'var(--terracotta)', borderColor: 'var(--terracotta)' }} onClick={() => onDelete(trip.id)}>
                  Yes, delete
                </button>
                <button className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setConfirmDel(false)}>
                  Keep it
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── App root ─────────────────────────────────────────────────────────────

function ExploringApp() {
  const { household } = useExAuth();
  const householdId = household?.id;

  // Seed from localStorage while Firebase loads; replaced by onSnapshot
  const [trips, setTrips] = React.useState(() => loadTripsLocal());
  const [tab,   setTab]   = React.useState('trips');
  const [sheet, setSheet] = React.useState(null); // null | {} (new) | trip (edit)

  // Real-time Firestore subscription
  React.useEffect(() => {
    if (!householdId) return;
    const unsub = subscribeTrips(householdId, setTrips);
    return unsub;
  }, [householdId]);

  async function handleSave(data) {
    if (data.id) {
      // Edit existing — optimistic update first
      setTrips(prev => prev.map(t => t.id === data.id ? { ...t, ...data } : t));
      updateTrip(householdId, data.id, data).catch(err => {
        console.error('update trip failed:', err);
        // onSnapshot will self-correct
      });
    } else {
      // New trip — Firestore write; onSnapshot will add to state
      addTrip(householdId, data).catch(err => {
        console.error('add trip failed:', err);
      });
    }
    setSheet(null);
  }

  async function handleDelete(id) {
    // Optimistic removal
    setTrips(prev => prev.filter(t => t.id !== id));
    deleteTrip(householdId, id).catch(err => {
      console.error('delete trip failed:', err);
    });
    setSheet(null);
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', background: 'var(--paper)', minHeight: '100vh' }}>
      <Nav tab={tab} setTab={setTab} onAdd={() => setSheet({})} />
      <TabBar tab={tab} setTab={setTab} />

      <div style={{ paddingBottom: 40 }}>
        {tab === 'trips'    && <TripList trips={trips} onEdit={t => setSheet(t)} onAdd={() => setSheet({})} />}
        {tab === 'calendar' && <CalendarView trips={trips} />}
      </div>

      {sheet !== null && (
        <TripSheet
          trip={sheet}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setSheet(null)}
        />
      )}
    </div>
  );
}

function ExploringRoot() {
  return (
    <ExAuthProvider>
      <ExploringApp />
    </ExAuthProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<ExploringRoot />);
