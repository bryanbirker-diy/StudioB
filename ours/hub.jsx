/* ours — suite hub
   Mobile-first. DeskShell adds rails at ≥768px / ≥1024px.
   The center column is identical at every width. */

// ─── Auth imports (from shared firebase-auth.jsx) ─────────────────────────
const { AuthProvider, useAuth, InviteCodeBanner } = window._oursAuth;

// ─── Helpers ──────────────────────────────────────────────────────────────

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function readPantryStats() {
  try {
    const plan = JSON.parse(localStorage.getItem('pm_plan') || 'null');
    const recipes = JSON.parse(localStorage.getItem('pm_recipes') || '[]');
    if (!plan || !plan.slots) return null;
    const total = plan.slots.length;
    const filled = plan.slots.filter(s => s.status && s.status !== 'empty').length;
    const eatOut = plan.slots.filter(s =>
      s.status === 'eat_out' || s.status === 'going_out'
    ).length;
    // rough ingredient count from filled recipe slots
    const recipeMap = Object.fromEntries(recipes.map(r => [r.id, r]));
    const ingredientSet = new Set();
    plan.slots.forEach(s => {
      if (s.status === 'recipe' && s.recipe_id) {
        const r = recipeMap[s.recipe_id];
        if (r && r.ingredients) r.ingredients.forEach(i => ingredientSet.add(i.toLowerCase()));
      }
    });
    return { total, filled, eatOut, ingredients: ingredientSet.size, recipes: recipes.length };
  } catch { return null; }
}

// ─── Clock watermark ──────────────────────────────────────────────────────

function ClockWatermark() {
  return (
    <svg
      viewBox="0 0 100 100"
      style={{
        position: 'absolute', top: 0, right: 0,
        width: 110, height: 110,
        opacity: 0.07,
        pointerEvents: 'none',
        overflow: 'visible',
      }}
      aria-hidden="true"
    >
      {/* Face */}
      <circle cx="50" cy="50" r="44" fill="none" stroke="var(--ink)" strokeWidth="2" />
      {/* Hour ticks */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * 30 - 90) * (Math.PI / 180);
        const x1 = 50 + 38 * Math.cos(angle), y1 = 50 + 38 * Math.sin(angle);
        const x2 = 50 + 44 * Math.cos(angle), y2 = 50 + 44 * Math.sin(angle);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--ink)" strokeWidth={i % 3 === 0 ? 2 : 1} />;
      })}
      {/* Hour hand ~10 */}
      <line x1="50" y1="50" x2="27" y2="22" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" />
      {/* Minute hand ~02 */}
      <line x1="50" y1="50" x2="71" y2="20" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
      {/* Center dot */}
      <circle cx="50" cy="50" r="3" fill="var(--ink)" />
    </svg>
  );
}

// ─── Wordmark ─────────────────────────────────────────────────────────────

function OursMark({ size = 'md', inline = false }) {
  const sizes = { sm: { mark: 20, tag: 11 }, md: { mark: 28, tag: 13 }, lg: { mark: 38, tag: 15 } };
  const s = sizes[size] || sizes.md;
  return (
    <div style={{ display: inline ? 'inline-flex' : 'flex', alignItems: 'baseline', gap: 10 }}>
      <span style={{
        fontFamily: '"Cormorant Garamond", "Cormorant", Garamond, serif',
        fontWeight: 300,
        fontSize: s.mark,
        letterSpacing: '-0.01em',
        color: 'var(--clay)',
        lineHeight: 1,
      }}>ours</span>
      <span style={{
        fontFamily: 'var(--mono)',
        fontSize: s.tag,
        color: 'var(--ink-fade)',
        letterSpacing: '0.01em',
        lineHeight: 1,
      }}>where our hours go</span>
    </div>
  );
}

// ─── Product icon ─────────────────────────────────────────────────────────

const PRODUCTS = [
  {
    id: 'pantry',
    name: 'Our Pantry',
    letter: 'P',
    color: 'var(--brown)',
    border: '#4a3a25',
    tagline: 'Plan meals → groceries. Pantry-aware.',
    href: 'projects/Pantry/',
    live: true,
  },
  {
    id: 'exploring',
    name: 'Our Exploring',
    letter: 'E',
    color: 'var(--terracotta)',
    border: '#5a3a20',
    tagline: 'Fly, drive, hike — all your adventures.',
    href: 'projects/Exploring/',
    live: true,
  },
  {
    id: 'home',
    name: 'Our Home',
    letter: 'H',
    color: 'var(--olive)',
    border: '#3e4823',
    tagline: 'Projects, fixes, and what they\'ll cost.',
    href: 'projects/Home/',
    live: true,
  },
  {
    id: 'money',
    name: 'Our Money',
    letter: '$',
    color: '#b5892e',
    border: '#7a5c1a',
    tagline: 'Subscriptions, bills, and where it goes.',
    href: 'projects/Money/',
    live: true,
  },
];

function ProductIcon({ letter, color, border }) {
  return (
    <div style={{
      width: 48, height: 48, flexShrink: 0,
      background: color,
      border: `1.5px solid ${border}`,
      borderRadius: '10px 13px 9px 12px / 11px 10px 13px 10px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '1.5px 2px 0 rgba(43,38,32,0.18)',
      color: '#fdf9f0',
      fontFamily: 'var(--hand)',
      fontWeight: 700,
      fontSize: 20,
    }}>
      {letter}
    </div>
  );
}

function ProductCard({ product, stats, onClick }) {
  const statusLine = React.useMemo(() => {
    if (!product.live) return 'Coming soon';
    if (product.id === 'pantry' && stats) {
      const parts = [];
      if (stats.filled !== undefined) parts.push(`${stats.filled}/${stats.total} meals set`);
      if (stats.ingredients) parts.push(`${stats.ingredients} to buy`);
      if (!parts.length) return 'No plan yet — tap to start';
      return parts.map((p, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span style={{ margin: '0 5px', opacity: 0.4 }}>•</span>}
          {p}
        </React.Fragment>
      ));
    }
    return null;
  }, [product, stats]);

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '16px 14px',
        border: '1.5px solid var(--rule-soft)',
        borderRadius: '10px 13px 8px 12px / 11px 10px 13px 9px',
        background: 'rgba(255,255,255,0.55)',
        cursor: product.live ? 'pointer' : 'default',
        transition: 'background .12s, transform .1s',
        position: 'relative',
        opacity: product.live ? 1 : 0.72,
      }}
      onMouseEnter={e => { if (product.live) e.currentTarget.style.background = 'rgba(255,255,255,0.82)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.55)'; }}
    >
      <ProductIcon letter={product.letter} color={product.color} border={product.border} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'var(--hand)', fontWeight: 700, fontSize: 20,
          color: 'var(--ink)', lineHeight: 1.1,
        }}>
          {product.name}
        </div>
        <div style={{
          fontFamily: 'var(--pen)', fontSize: 13,
          color: 'var(--ink-soft)', marginTop: 3, lineHeight: 1.3,
        }}>
          {product.tagline}
        </div>
        {statusLine && (
          <div style={{
            fontFamily: 'var(--mono)', fontSize: 11,
            color: 'var(--ink-fade)', marginTop: 5,
          }}>
            {product.live ? <span>• </span> : null}{statusLine}
          </div>
        )}
      </div>

      {product.live && (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0, opacity: 0.35 }}>
          <path d="M6.5 4.5 L11.5 9 L6.5 13.5" stroke="var(--ink)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}

// ─── Summary pills ("This week, between us") ─────────────────────────────

function SummaryPill({ icon, label, color, border, textColor }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '5px 12px',
      background: color || 'rgba(255,255,255,0.6)',
      border: `1.5px solid ${border || 'var(--rule)'}`,
      borderRadius: '16px 18px 14px 17px',
      fontFamily: 'var(--pen)',
      fontSize: 13,
      color: textColor || 'var(--ink)',
      boxShadow: '1px 1.5px 0 rgba(43,38,32,0.12)',
      whiteSpace: 'nowrap',
    }}>
      {icon && <span>{icon}</span>}
      {label}
    </div>
  );
}

// ─── Bottom tabbar (suite-level) ─────────────────────────────────────────

const NAVIGABLE_TABS = new Set(['home', 'settings']);

function BottomTabBar({ active = 'home', onTabChange }) {
  const tabs = [
    { id: 'home',     label: 'Home',     icon: '⌂' },
    { id: 'calendar', label: 'Calendar', icon: '◻' },
    { id: 'us',       label: 'Us',       icon: '◎' },
    { id: 'settings', label: 'Settings', icon: '⚙' },
  ];
  return (
    <div style={{
      position: 'sticky', bottom: 0,
      display: 'flex', justifyContent: 'space-around',
      padding: '10px 8px 18px',
      borderTop: '1.5px solid var(--rule-soft)',
      background: 'var(--paper)',
      zIndex: 20,
    }}>
      {tabs.map(t => {
        const navigable = NAVIGABLE_TABS.has(t.id);
        const isActive  = t.id === active;
        return (
          <div key={t.id}
            onClick={() => navigable && onTabChange?.(t.id)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              fontFamily: 'var(--mono)', fontSize: 9,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              color: isActive ? 'var(--ink)' : 'var(--ink-fade)',
              cursor: navigable ? 'pointer' : 'default',
              opacity: navigable ? 1 : 0.38,
              minWidth: 48,
              userSelect: 'none',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <div style={{
              width: 22, height: 22,
              border: `1.5px solid ${isActive ? 'var(--ink)' : 'var(--ink-fade)'}`,
              borderRadius: '50% 55% 45% 52%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11,
              background: isActive ? 'var(--ink)' : 'transparent',
              color: isActive ? 'var(--paper)' : 'var(--ink-fade)',
            }}>
              {t.icon}
            </div>
            {t.label}
          </div>
        );
      })}
    </div>
  );
}

// ─── Left rail (desktop ≥1024px) ─────────────────────────────────────────

function LeftRail({ activeProduct, household, user }) {
  const [copied, setCopied] = React.useState(false);

  function copyCode() {
    if (!household?.inviteCode) return;
    navigator.clipboard.writeText(household.inviteCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  const memberProfiles = household?.memberProfiles || {};
  const memberList = Object.values(memberProfiles);
  const soloHousehold = (household?.memberUids || []).length < 2;
  const firstName = name => (name || '').split(' ')[0] || name;

  return (
    <div style={{
      width: 220, flexShrink: 0,
      padding: '28px 20px',
      display: 'flex', flexDirection: 'column', gap: 28,
    }}>
      {/* Wordmark */}
      <div style={{ position: 'relative' }}>
        <div style={{
          fontFamily: '"Cormorant Garamond", Garamond, serif',
          fontWeight: 300, fontSize: 32,
          color: 'var(--clay)', letterSpacing: '-0.01em',
        }}>ours</div>
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 11,
          color: 'var(--ink-fade)', marginTop: 2,
        }}>where our hours go</div>
        {/* mini clock */}
        <svg viewBox="0 0 100 100" style={{ position: 'absolute', top: -8, right: 0, width: 54, height: 54, opacity: 0.09 }} aria-hidden="true">
          <circle cx="50" cy="50" r="44" fill="none" stroke="var(--ink)" strokeWidth="2.5" />
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i * 30 - 90) * (Math.PI / 180);
            return <line key={i} x1={50 + 36 * Math.cos(a)} y1={50 + 36 * Math.sin(a)} x2={50 + 44 * Math.cos(a)} y2={50 + 44 * Math.sin(a)} stroke="var(--ink)" strokeWidth={i % 3 === 0 ? 2.5 : 1.5} />;
          })}
          <line x1="50" y1="50" x2="27" y2="22" stroke="var(--ink)" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="50" y1="50" x2="71" y2="20" stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="50" cy="50" r="3.5" fill="var(--ink)" />
        </svg>
      </div>

      {/* Suite nav */}
      <div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-fade)', marginBottom: 10 }}>
          The Suite
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {PRODUCTS.map(p => (
            <div
              key={p.id}
              onClick={() => p.live && p.href && (window.location.href = p.href)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '7px 10px',
                borderRadius: '7px 9px 6px 8px',
                background: activeProduct === p.id ? 'rgba(255,255,255,0.7)' : 'transparent',
                border: activeProduct === p.id ? '1.5px solid var(--rule-soft)' : '1.5px solid transparent',
                cursor: p.live ? 'pointer' : 'default',
                opacity: p.live ? 1 : 0.5,
              }}
            >
              <div style={{
                width: 24, height: 24, borderRadius: '6px 7px 5px 6px',
                background: p.color, border: `1px solid ${p.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fdf9f0', fontFamily: 'var(--hand)', fontWeight: 700, fontSize: 12,
                flexShrink: 0,
              }}>
                {p.letter}
              </div>
              <div>
                <div style={{ fontFamily: 'var(--pen)', fontSize: 13, color: 'var(--ink)', lineHeight: 1.1 }}>{p.name}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink-fade)' }}>
                  {p.id === 'pantry' ? 'meals → groceries' :
                   p.id === 'exploring' ? 'fly, drive, hike' :
                   p.id === 'money' ? 'bills & subscriptions' :
                   'projects & costs'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Household */}
      <div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-fade)', marginBottom: 8 }}>
          {household?.name || 'Household'}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {memberList.length > 0 ? memberList.map((m, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--pen)', fontSize: 13, color: 'var(--ink-soft)' }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', border: '1.5px solid var(--rule-soft)', background: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, flexShrink: 0 }}>
                {(m.displayName || '?')[0]}
              </div>
              {firstName(m.displayName)}
            </div>
          )) : user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--pen)', fontSize: 13, color: 'var(--ink-soft)' }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', border: '1.5px solid var(--rule-soft)', background: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, flexShrink: 0 }}>
                {(user.displayName || user.email || '?')[0]}
              </div>
              {firstName(user.displayName || user.email)}
            </div>
          )}

          {/* Invite code if solo */}
          {soloHousehold && household?.inviteCode && (
            <div style={{ paddingLeft: 0, marginTop: 4 }}>
              <div style={{ fontFamily: 'var(--pen)', fontSize: 11, color: 'var(--ink-fade)', marginBottom: 4 }}>
                Invite your partner:
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 14, fontWeight: 600, color: 'var(--terracotta)', letterSpacing: '0.15em' }}>
                  {household.inviteCode}
                </span>
                <button onClick={copyCode} style={{
                  background: copied ? 'var(--olive)' : 'transparent',
                  color: copied ? '#fff' : 'var(--ink-fade)',
                  border: `1px solid ${copied ? 'var(--olive)' : 'var(--rule)'}`,
                  borderRadius: 3, padding: '2px 6px',
                  fontFamily: 'var(--pen)', fontSize: 10, cursor: 'pointer',
                  transition: 'all 0.2s',
                }}>{copied ? '✓' : 'copy'}</button>
              </div>
            </div>
          )}

          {/* Sign out */}
          {user && (
            <button onClick={() => fbAuth.signOut()} style={{
              background: 'none', border: 'none',
              fontFamily: 'var(--pen)', fontSize: 11,
              color: 'var(--ink-fade)', cursor: 'pointer',
              textAlign: 'left', padding: '4px 0 0', opacity: 0.6,
            }}>Sign out</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Right rail (desktop ≥768px) ─────────────────────────────────────────

function RightRail({ stats }) {
  return (
    <div style={{
      width: 280, flexShrink: 0,
      padding: '28px 20px',
      display: 'flex', flexDirection: 'column', gap: 20,
    }}>
      {/* This week at a glance */}
      <div style={{
        border: '1.5px solid var(--rule-soft)',
        borderRadius: '8px 10px 7px 9px',
        padding: '14px 16px',
        background: 'rgba(255,255,255,0.45)',
      }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-fade)', marginBottom: 12 }}>
          This week, at a glance
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { label: 'Meals planned', value: stats ? `${stats.filled}/${stats.total}` : '—' },
            { label: 'Grocery items', value: stats ? (stats.ingredients || '—') : '—' },
            { label: 'Eating out', value: stats ? (stats.eatOut || '0') : '—' },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontFamily: 'var(--pen)', fontSize: 13, color: 'var(--ink-soft)' }}>{row.label}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--ink)' }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* The suite blurb */}
      <div style={{
        border: '1.5px dashed var(--rule-soft)',
        borderRadius: '8px 10px 7px 9px',
        padding: '14px 16px',
        background: 'transparent',
      }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-fade)', marginBottom: 8 }}>
          The Suite
        </div>
        <div style={{ fontFamily: 'var(--pen)', fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
          Four products. One household. Everything is shared by default — the same plan, together.
        </div>
      </div>
    </div>
  );
}

// ─── Settings view ───────────────────────────────────────────────────────

function SettingsView({ user, household }) {
  const [copied, setCopied] = React.useState(false);

  function copyCode() {
    if (!household?.inviteCode) return;
    navigator.clipboard.writeText(household.inviteCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  const memberProfiles = household?.memberProfiles || {};
  const memberList     = Object.values(memberProfiles);

  const card = {
    border: '1.5px solid var(--rule-soft)',
    borderRadius: '8px 10px 7px 9px',
    background: 'rgba(255,255,255,0.55)',
    overflow: 'hidden',
  };
  const cardHeader = {
    padding: '10px 16px',
    borderBottom: '1.5px solid var(--rule-soft)',
    background: 'rgba(255,255,255,0.3)',
    fontFamily: 'var(--mono)', fontSize: 9,
    letterSpacing: '0.14em', textTransform: 'uppercase',
    color: 'var(--ink-fade)',
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 18px', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Page heading */}
      <div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-fade)', marginBottom: 5 }}>
          Settings
        </div>
        <div style={{ fontFamily: 'var(--hand)', fontWeight: 700, fontSize: 28, color: 'var(--ink)', lineHeight: 1.1 }}>
          {household?.name || 'Our Household'}
        </div>
      </div>

      {/* ── Family code ── */}
      <div style={card}>
        <div style={cardHeader}>Family Code</div>
        <div style={{ padding: '16px 18px' }}>
          <div style={{ fontFamily: 'var(--pen)', fontSize: 13, color: 'var(--ink-soft)', marginBottom: 14, lineHeight: 1.5 }}>
            Share this code with anyone who needs to join your household. They'll enter it on the sign-in screen.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 30, fontWeight: 600,
              color: 'var(--terracotta)',
              letterSpacing: '0.22em',
              flex: 1,
            }}>
              {household?.inviteCode || '——————'}
            </span>
            <button
              onClick={copyCode}
              style={{
                background: copied ? 'var(--olive)' : 'var(--terracotta)',
                color: '#fff', border: 'none',
                borderRadius: '6px 8px 5px 7px',
                padding: '9px 18px',
                fontFamily: 'var(--pen)', fontSize: 13,
                cursor: 'pointer',
                transition: 'background 0.2s',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >{copied ? '✓ Copied!' : 'Copy code'}</button>
          </div>
        </div>
      </div>

      {/* ── Members ── */}
      <div style={card}>
        <div style={cardHeader}>Members</div>
        {memberList.length > 0 ? memberList.map((m, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px',
            borderBottom: i < memberList.length - 1 ? '1px dotted var(--rule-soft)' : 'none',
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              border: '1.5px solid var(--rule-soft)',
              background: 'rgba(138,111,78,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--hand)', fontSize: 15, fontWeight: 700,
              color: 'var(--brown)', flexShrink: 0,
            }}>
              {(m.displayName || m.email || '?')[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--pen)', fontSize: 14, color: 'var(--ink)', lineHeight: 1.2 }}>
                {m.displayName || m.email || 'Unknown'}
              </div>
              {m.email && m.displayName && (
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-fade)', marginTop: 1 }}>
                  {m.email}
                </div>
              )}
            </div>
          </div>
        )) : (
          <div style={{ padding: '16px', fontFamily: 'var(--pen)', fontSize: 13, color: 'var(--ink-fade)', fontStyle: 'italic' }}>
            No member profiles found
          </div>
        )}
      </div>

      {/* ── Account / sign out ── */}
      <div style={card}>
        <div style={cardHeader}>Account</div>
        <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px dotted var(--rule-soft)' }}>
          <div style={{
            width: 38, height: 38, borderRadius: '50%',
            border: '1.5px solid var(--rule-soft)',
            background: 'rgba(138,111,78,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--hand)', fontSize: 17, fontWeight: 700,
            color: 'var(--brown)', flexShrink: 0,
          }}>
            {(user?.displayName || user?.email || '?')[0].toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--pen)', fontSize: 14, color: 'var(--ink)', lineHeight: 1.2 }}>
              {user?.displayName || 'You'}
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-fade)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email}
            </div>
          </div>
        </div>
        <div style={{ padding: '14px 16px' }}>
          <button
            onClick={() => fbAuth.signOut()}
            style={{
              width: '100%', padding: '10px 14px',
              border: '1.5px solid var(--rule-soft)',
              borderRadius: '6px 8px 5px 7px',
              background: 'none',
              fontFamily: 'var(--pen)', fontSize: 14,
              color: 'var(--ink-soft)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--terracotta)'; e.currentTarget.style.color = 'var(--terracotta)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--rule-soft)'; e.currentTarget.style.color = 'var(--ink-soft)'; }}
          >
            <span style={{ fontSize: 15 }}>→</span> Sign out
          </button>
        </div>
      </div>

      {/* bottom breathing room above sticky tab bar */}
      <div style={{ height: 8 }} />
    </div>
  );
}

// ─── Center column content ────────────────────────────────────────────────

function CenterColumn({ stats, user, household }) {
  const [comingSoon, setComingSoon] = React.useState(null);
  const [activeTab,  setActiveTab]  = React.useState('home');

  function handleCardClick(product) {
    if (product.live && product.href) {
      window.location.href = product.href;
    } else {
      setComingSoon(product.name);
      setTimeout(() => setComingSoon(null), 2200);
    }
  }

  const pillsData = React.useMemo(() => {
    const pills = [];
    if (stats && stats.total > stats.filled) {
      pills.push({ icon: '🍲', label: `${stats.total - stats.filled} meals to plan`, color: 'var(--brown)', border: '#4a3a25', textColor: '#fdf9f0' });
    } else if (stats && stats.filled > 0) {
      pills.push({ icon: '✓', label: 'Meals all set', color: 'var(--olive)', border: '#3e4823', textColor: '#f7f5e6' });
    }
    pills.push({ icon: '🚗', label: 'Plan an adventure', color: 'rgba(168,117,77,0.15)', border: 'var(--terracotta)', textColor: 'var(--ink)' });
    pills.push({ icon: '🏠', label: 'Home project', color: 'rgba(107,122,74,0.12)', border: 'var(--olive)', textColor: 'var(--ink)' });
    return pills;
  }, [stats]);

  return (
    <div style={{
      flex: 1,
      maxWidth: 420,
      width: '100%',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      position: 'relative',
    }}>

      {/* ── Home view ── */}
      {activeTab === 'home' && <>
        {/* Header area */}
        <div style={{ padding: '16px 18px 0', position: 'relative', overflow: 'hidden' }}>
          <ClockWatermark />
          <OursMark size="md" />

          <div style={{ height: 24 }} />

          <div style={{
            fontFamily: 'var(--mono)', fontSize: 11,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: 'var(--ink-fade)', marginBottom: 6,
          }}>
            {greeting()}{user ? `, ${user.displayName?.split(' ')[0] || ''}` : ''}
          </div>

          <h1 style={{
            fontFamily: 'var(--hand)',
            fontWeight: 700,
            fontSize: 32,
            color: 'var(--ink)',
            margin: 0,
            lineHeight: 1.1,
            display: 'inline-block',
            backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 4'><path d='M0,2 Q15,4 30,2 T60,2' fill='none' stroke='%23a8754d' stroke-width='1.6' stroke-linecap='round'/></svg>\")",
            backgroundSize: '60px 4px',
            backgroundRepeat: 'repeat-x',
            backgroundPosition: '0 100%',
            paddingBottom: 6,
          }}>
            What are we planning?
          </h1>
        </div>

        {/* Product cards */}
        <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
          {/* Mobile: invite code banner if solo household */}
          {household?.inviteCode && (household?.memberUids || []).length < 2 && (
            <InviteCodeBanner household={household} />
          )}
          {PRODUCTS.map(p => (
            <ProductCard
              key={p.id}
              product={p}
              stats={p.id === 'pantry' ? stats : null}
              onClick={() => handleCardClick(p)}
            />
          ))}

          {/* Wavy divider */}
          <div style={{ margin: '8px 0' }}>
            <div className="divider-wavy" style={{ opacity: 0.4 }} />
          </div>

          {/* This week, between us */}
          <div>
            <div style={{
              fontFamily: 'var(--mono)', fontSize: 9,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              color: 'var(--ink-fade)', marginBottom: 10,
            }}>
              This week, between us
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {pillsData.map((pill, i) => (
                <SummaryPill key={i} {...pill} />
              ))}
            </div>
          </div>
        </div>
      </>}

      {/* ── Settings view ── */}
      {activeTab === 'settings' && (
        <SettingsView user={user} household={household} />
      )}

      {/* Coming soon toast (home only) */}
      {comingSoon && activeTab === 'home' && (
        <div style={{
          position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--ink)', color: 'var(--paper)',
          fontFamily: 'var(--pen)', fontSize: 14,
          padding: '10px 20px',
          borderRadius: '20px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
          zIndex: 100,
          whiteSpace: 'nowrap',
        }}>
          {comingSoon} — coming soon
        </div>
      )}

      {/* Bottom tabbar */}
      <BottomTabBar active={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

// ─── DeskShell ────────────────────────────────────────────────────────────

function DeskShell({ children, stats, user, household }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--paper-2)' }}>
      {/* Left rail — ≥1024px */}
      <div className="left-rail">
        <LeftRail activeProduct="hub" household={household} user={user} />
      </div>

      {/* Center column */}
      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        borderLeft: 'var(--rail-border-left)',
        borderRight: 'var(--rail-border-right)',
        background: 'var(--paper)',
        minHeight: '100vh',
      }}>
        {children}
      </div>

      {/* Right rail — ≥768px */}
      <div className="right-rail">
        <RightRail stats={stats} />
      </div>
    </div>
  );
}

// ─── App root ─────────────────────────────────────────────────────────────

function HubApp() {
  const { user, household } = useAuth();
  const stats = React.useMemo(() => readPantryStats(), []);

  return (
    <DeskShell stats={stats} user={user} household={household}>
      <CenterColumn stats={stats} user={user} household={household} />
    </DeskShell>
  );
}

function RootApp() {
  return (
    <AuthProvider>
      <HubApp />
    </AuthProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<RootApp />);
