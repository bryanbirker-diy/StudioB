// firebase-auth.jsx — shared auth + household context for the ours suite
// Loaded as type="text/babel" AFTER firebase-config.js sets db, fbAuth globals.
// Exports to window._oursAuth so any subsequent text/babel script can access them.

(function() {
  const { createContext, useContext, useState, useEffect, useRef } = React;

  // ─── Context ───────────────────────────────────────────────────────────────

  const AuthContext = createContext(null);

  function useAuth() {
    return useContext(AuthContext);
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  function genInviteCode() {
    // Omit easily-confused chars: 0/O, 1/I/L
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  }

  // ─── Accent theme (platform-wide, household-synced) ─────────────────────────
  // Curated presets only — each carries its own ink so text-on-accent stays
  // legible (light accents pair with navy ink, dark ones with paper).
  const ACCENT_PRESETS = [
    { id: 'red',    label: 'Red',    accent: 'oklch(56% 0.22 27)',  ink: 'oklch(99% 0.002 260)' },
    { id: 'cobalt', label: 'Cobalt', accent: 'oklch(52% 0.20 256)', ink: 'oklch(99% 0.002 260)' },
    { id: 'teal',   label: 'Teal',   accent: 'oklch(56% 0.12 195)', ink: 'oklch(99% 0.002 260)' },
    { id: 'forest', label: 'Forest', accent: 'oklch(52% 0.14 152)', ink: 'oklch(99% 0.002 260)' },
    { id: 'plum',   label: 'Plum',   accent: 'oklch(50% 0.20 350)', ink: 'oklch(99% 0.002 260)' },
    { id: 'amber',  label: 'Amber',  accent: 'oklch(74% 0.16 68)',  ink: 'oklch(21% 0.045 262)' },
  ];
  function accentById(id) {
    return ACCENT_PRESETS.find(p => p.id === id) || ACCENT_PRESETS[0];
  }
  // Everything reads var(--accent)/var(--accent-ink), so setting these two vars
  // re-tints the whole suite instantly. Cached in localStorage so the choice
  // paints immediately on next load (no default-red flash before household loads).
  function applyAccent(id) {
    const p = accentById(id);
    const root = document.documentElement;
    root.style.setProperty('--accent', p.accent);
    root.style.setProperty('--accent-ink', p.ink);
    try { localStorage.setItem('ours_accent', p.id); } catch (e) {}
    return p.id;
  }
  // Instant paint from cache, before React/household are ready.
  try { const c = localStorage.getItem('ours_accent'); if (c) applyAccent(c); } catch (e) {}

  // One-time migration: move localStorage data into Firestore on first sign-in
  async function migrateLocalData(householdId) {
    if (localStorage.getItem('ours_migrated')) return;
    const writes = [];

    // Pantry — recipes
    try {
      const recipes = JSON.parse(localStorage.getItem('pm_recipes') || '[]');
      if (recipes.length > 0) {
        const batch = db.batch();
        recipes.forEach(r => {
          const id = r.id || db.collection('_').doc().id;
          batch.set(
            db.doc(`households/${householdId}/recipes/${id}`),
            { ...r, _migrated: true },
            { merge: true }
          );
        });
        writes.push(batch.commit());
      }
    } catch (e) { console.warn('recipe migration:', e); }

    // Pantry — weekly plan
    try {
      const plan = JSON.parse(localStorage.getItem('pm_plan') || 'null');
      if (plan) {
        writes.push(
          db.doc(`households/${householdId}/meta/plan`)
            .set({ ...plan, _migrated: true }, { merge: true })
        );
      }
    } catch (e) { console.warn('plan migration:', e); }

    // Pantry — pantry inventory
    try {
      const items = JSON.parse(localStorage.getItem('pm_pantry') || '[]');
      if (items.length > 0) {
        const batch = db.batch();
        items.forEach(item => {
          const id = item.id || db.collection('_').doc().id;
          batch.set(
            db.doc(`households/${householdId}/pantryItems/${id}`),
            { ...item, _migrated: true },
            { merge: true }
          );
        });
        writes.push(batch.commit());
      }
    } catch (e) { console.warn('pantry migration:', e); }

    // Exploring — trips
    try {
      const trips = JSON.parse(localStorage.getItem('ex_trips') || '[]');
      if (trips.length > 0) {
        const batch = db.batch();
        trips.forEach(t => {
          const id = t.id || db.collection('_').doc().id;
          batch.set(
            db.doc(`households/${householdId}/trips/${id}`),
            { ...t, _migrated: true },
            { merge: true }
          );
        });
        writes.push(batch.commit());
      }
    } catch (e) { console.warn('trips migration:', e); }

    // Our Home projects
    try {
      const homeProjects = JSON.parse(localStorage.getItem('hm_projects') || '[]');
      if (homeProjects.length > 0) {
        const batch = db.batch();
        homeProjects.forEach(p => {
          const id = p.id || db.collection('_').doc().id;
          batch.set(
            db.doc(`households/${householdId}/homeProjects/${id}`),
            { ...p, _migrated: true },
            { merge: true }
          );
        });
        writes.push(batch.commit());
      }
    } catch (e) { console.warn('home projects migration:', e); }

    await Promise.allSettled(writes);
    localStorage.setItem('ours_migrated', '1');
    console.log('ours: local data migrated to Firestore');
  }

  // ─── Loading screen ────────────────────────────────────────────────────────

  function LoadingScreen({ status }) {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--paper-2)', gap: 20,
      }}>
        <div style={{
          fontFamily: 'var(--sans)', fontWeight: 900, fontSize: 46,
          color: 'var(--navy)', letterSpacing: '-0.025em',
          textTransform: 'uppercase', lineHeight: 0.92,
        }}>Ours<span style={{ color: 'var(--accent)' }}>.</span></div>
        <div style={{
          width: 26, height: 26,
          border: '2px solid var(--rule)',
          borderTopColor: 'var(--accent)',
          borderRadius: '50%',
          animation: 'ourspin 0.8s linear infinite',
        }} />
        {status && (
          <div style={{
            fontFamily: 'var(--sans)', fontWeight: 600, fontSize: 11,
            letterSpacing: '0.06em', color: 'var(--ink-2)',
            maxWidth: 280, textAlign: 'center', lineHeight: 1.5,
          }}>{status}</div>
        )}
        <style>{`@keyframes ourspin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ─── Sign-in screen ────────────────────────────────────────────────────────

  function SignInScreen() {
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState(() => {
      // Show any error that was stored across the redirect
      const stored = localStorage.getItem('ours_auth_error');
      if (stored) {
        localStorage.removeItem('ours_auth_error');
        return stored;
      }
      return '';
    });

    function handleSignIn() {
      setLoading(true); setErr('');
      const provider = new firebase.auth.GoogleAuthProvider();

      // Always use popup — redirect is unreliable on iOS Safari (PWA standalone
      // mode) because ITP clears localStorage between redirect and return, causing
      // a "missing initial state" error. If the popup is blocked, tell the user
      // rather than falling back to a broken redirect flow.
      fbAuth.signInWithPopup(provider)
        .catch(e => {
          console.error('sign-in error', e);
          if (e.code === 'auth/popup-blocked') {
            setErr('Sign-in popup was blocked. Please allow popups for this site and try again.');
          } else {
            setErr('Sign-in failed: ' + (e.message || e.code));
          }
          setLoading(false);
        });
    }

    // Clock tick marks
    const ticks = [0,30,60,90,120,150,180,210,240,270,300,330].map(deg => {
      const major = deg % 90 === 0;
      const rad = (deg - 90) * Math.PI / 180;
      const r1 = 80, r2 = major ? 70 : 74;
      return (
        <line key={deg}
          x1={100 + r1 * Math.cos(rad)} y1={100 + r1 * Math.sin(rad)}
          x2={100 + r2 * Math.cos(rad)} y2={100 + r2 * Math.sin(rad)}
          stroke="currentColor" strokeWidth={major ? 3 : 1.5} strokeLinecap="round"
        />
      );
    });

    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--paper-2)', padding: '40px 24px', gap: 36, overflow: 'hidden',
      }}>
        {/* Watermark */}
        <svg style={{
          position: 'fixed', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          width: 340, height: 340, opacity: 0.05,
          pointerEvents: 'none', color: 'var(--ink)',
        }} viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="82" fill="none" stroke="currentColor" strokeWidth="5"/>
          {ticks}
          <line x1="100" y1="100" x2="100" y2="28" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
          <line x1="100" y1="100" x2="148" y2="116" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="100" cy="100" r="4" fill="currentColor"/>
        </svg>

        <div style={{ textAlign: 'center', position: 'relative' }}>
          <div style={{
            fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 12,
            letterSpacing: '0.22em', textTransform: 'uppercase',
            color: 'var(--accent)', marginBottom: 16,
          }}>Plan life, together</div>
          <div style={{
            fontFamily: 'var(--sans)', fontWeight: 900,
            fontSize: 'clamp(56px, 17vw, 92px)', color: 'var(--navy)',
            letterSpacing: '-0.025em', lineHeight: 0.9,
            textTransform: 'uppercase',
          }}>Ours<span style={{ color: 'var(--accent)' }}>.</span></div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: 300, position: 'relative' }}>
          <button
            onClick={handleSignIn}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
              padding: '15px 20px', borderRadius: 0,
              border: '1px solid var(--navy)',
              background: 'transparent',
              fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 13,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'var(--navy)',
              cursor: loading ? 'default' : 'pointer',
              opacity: loading ? 0.6 : 1,
              boxShadow: 'none',
              transition: 'color 0.4s, border-color 0.4s',
            }}
          >
            {/* Google G logo */}
            <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {loading ? 'Signing in…' : 'Sign in with Google'}
          </button>
          {err && <div style={{ fontFamily: 'var(--pen)', fontSize: 12, color: 'var(--terracotta)', textAlign: 'center' }}>{err}</div>}
          <div style={{
            fontFamily: 'var(--pen)', fontSize: 11, color: 'var(--ink)',
            opacity: 0.4, textAlign: 'center', lineHeight: 1.6,
          }}>
            Sign in to sync with your partner across devices
          </div>
        </div>
      </div>
    );
  }

  // ─── Blocked screen ───────────────────────────────────────────────────────

  function BlockedScreen({ email }) {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--paper-2)', fontFamily: 'var(--sans)',
        padding: '40px 24px', textAlign: 'center', gap: 18,
      }}>
        <div style={{
          fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 12,
          letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--accent)',
        }}>Access restricted</div>
        <h2 style={{
          margin: 0, color: 'var(--navy)', fontSize: 34, fontWeight: 900,
          textTransform: 'uppercase', letterSpacing: '-0.025em', lineHeight: 0.94,
        }}>Not on the list<span style={{ color: 'var(--accent)' }}>.</span></h2>
        <p style={{ color: 'var(--ink-soft)', maxWidth: 340, lineHeight: 1.5, margin: 0, fontSize: 15 }}>
          <strong style={{ color: 'var(--navy)' }}>{email}</strong> hasn't been added yet. Contact Bryan to get access.
        </p>
        <button
          onClick={() => { window.location.reload(); }}
          style={{
            background: 'transparent', color: 'var(--navy)',
            border: '1px solid var(--navy)', borderRadius: 0,
            padding: '13px 22px', fontFamily: 'var(--sans)', fontWeight: 700,
            fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase',
            cursor: 'pointer', marginTop: 8,
          }}
        >
          Try a different account
        </button>
      </div>
    );
  }

  // ─── Household setup screen ────────────────────────────────────────────────

  function HouseholdSetupScreen({ user, onDone }) {
    const [mode, setMode] = useState(null); // null | 'create' | 'join'
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState('');

    const firstName = user?.displayName?.split(' ')[0] || 'there';

    async function handleCreate() {
      if (!name.trim()) return;
      setLoading(true); setErr('');
      try {
        const inviteCode = genInviteCode();
        const profile = { displayName: user.displayName || user.email || '' };
        const ref = await db.collection('households').add({
          name: name.trim(),
          inviteCode,
          memberUids: [user.uid],
          memberProfiles: { [user.uid]: profile },
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          createdBy: user.uid,
        });
        await db.doc(`users/${user.uid}`).set({ householdId: ref.id }, { merge: true });
        const snap = await ref.get();
        onDone({ id: ref.id, ...snap.data() });
      } catch (e) {
        console.error('create household:', e);
        setErr('Something went wrong. Try again.');
        setLoading(false);
      }
    }

    async function handleJoin() {
      const trimmed = code.trim().toUpperCase();
      if (trimmed.length !== 6) { setErr('Invite codes are 6 characters.'); return; }
      setLoading(true); setErr('');
      try {
        const snap = await db.collection('households')
          .where('inviteCode', '==', trimmed).limit(1).get();
        if (snap.empty) {
          setErr("Code not found — double-check with your partner.");
          setLoading(false); return;
        }
        const doc = snap.docs[0];
        const profile = { displayName: user.displayName || user.email || '' };
        await doc.ref.update({
          memberUids: firebase.firestore.FieldValue.arrayUnion(user.uid),
          [`memberProfiles.${user.uid}`]: profile,
        });
        await db.doc(`users/${user.uid}`).set({ householdId: doc.id }, { merge: true });
        const updatedSnap = await doc.ref.get();
        onDone({ id: doc.id, ...updatedSnap.data() });
      } catch (e) {
        console.error('join household:', e);
        setErr('Something went wrong. Try again.');
        setLoading(false);
      }
    }

    const inputSty = {
      border: '1px solid var(--rule)', borderRadius: 0,
      padding: '12px 13px', fontFamily: 'var(--sans)', fontSize: 15,
      color: 'var(--ink)', background: 'var(--card)',
      outline: 'none', width: '100%',
    };
    const btnPrimary = (disabled) => ({
      padding: '14px 20px', borderRadius: 0,
      border: '1px solid var(--navy)', background: 'var(--navy)', color: 'var(--paper)',
      fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 13,
      letterSpacing: '0.1em', textTransform: 'uppercase',
      cursor: disabled ? 'default' : 'pointer',
      opacity: disabled ? 0.5 : 1, width: '100%',
      transition: 'opacity 0.15s',
    });
    const btnBack = {
      background: 'none', border: 'none',
      fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 11,
      letterSpacing: '0.16em', textTransform: 'uppercase',
      color: 'var(--ink-2)', cursor: 'pointer', textAlign: 'center',
    };

    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--paper-2)', padding: '40px 24px', gap: 28,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: 'var(--sans)', fontWeight: 900, fontSize: 46,
            color: 'var(--navy)', letterSpacing: '-0.025em',
            textTransform: 'uppercase', lineHeight: 0.92,
          }}>Ours<span style={{ color: 'var(--accent)' }}>.</span></div>
          <div style={{
            fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 11,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            color: 'var(--ink-2)', marginTop: 10,
          }}>Hi {firstName} — one more step</div>
        </div>

        {!mode && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 300 }}>
            {[
              { m: 'create', title: 'Create our household', sub: "Start fresh — you'll get an invite code to share" },
              { m: 'join',   title: 'Join with a code',     sub: 'Your partner already set up — enter their code' },
            ].map(({ m, title, sub }) => (
              <button key={m} onClick={() => { setMode(m); setErr(''); }} style={{
                padding: '16px', borderRadius: 0,
                border: '1px solid var(--rule)', borderLeft: '3px solid var(--accent)',
                background: 'var(--card)',
                fontFamily: 'var(--sans)', fontSize: 14,
                color: 'var(--ink-soft)', cursor: 'pointer', textAlign: 'left',
                boxShadow: 'none',
              }}>
                <div style={{ fontWeight: 700, marginBottom: 4, color: 'var(--navy)', textTransform: 'uppercase', letterSpacing: '0.02em', fontSize: 13 }}>{title}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>{sub}</div>
              </button>
            ))}
          </div>
        )}

        {mode === 'create' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 300 }}>
            <div style={{ fontFamily: 'var(--pen)', fontSize: 13, color: 'var(--ink)', opacity: 0.65 }}>
              What do you call yourselves?
            </div>
            <input
              style={inputSty}
              placeholder="The Birkers, The Chaos Crew…"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
            {err && <div style={{ fontFamily: 'var(--pen)', fontSize: 12, color: 'var(--terracotta)' }}>{err}</div>}
            <button onClick={handleCreate} disabled={loading || !name.trim()} style={btnPrimary(loading || !name.trim())}>
              {loading ? 'Creating…' : 'Create household →'}
            </button>
            <button onClick={() => { setMode(null); setErr(''); }} style={btnBack}>← back</button>
          </div>
        )}

        {mode === 'join' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 300 }}>
            <div style={{ fontFamily: 'var(--pen)', fontSize: 13, color: 'var(--ink)', opacity: 0.65 }}>
              Enter the 6-character invite code
            </div>
            <input
              style={{
                ...inputSty,
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                fontSize: 22, textAlign: 'center',
                fontFamily: '"JetBrains Mono", monospace',
              }}
              placeholder="A1B2C3"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase().slice(0, 6))}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              maxLength={6}
              autoFocus
            />
            {err && <div style={{ fontFamily: 'var(--pen)', fontSize: 12, color: 'var(--terracotta)' }}>{err}</div>}
            <button onClick={handleJoin} disabled={loading || code.length !== 6} style={btnPrimary(loading || code.length !== 6)}>
              {loading ? 'Joining…' : 'Join household →'}
            </button>
            <button onClick={() => { setMode(null); setErr(''); setCode(''); }} style={btnBack}>← back</button>
          </div>
        )}
      </div>
    );
  }

  // ─── Invite code banner (shown in hub when household was just created) ──────

  function InviteCodeBanner({ household }) {
    const [copied, setCopied] = useState(false);
    if (!household?.inviteCode) return null;

    function copy() {
      navigator.clipboard.writeText(household.inviteCode).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }

    return (
      <div style={{
        background: 'var(--card)',
        border: '1px solid var(--rule)', borderLeft: '6px solid var(--accent)',
        borderRadius: 0, padding: '12px 16px',
        display: 'flex', alignItems: 'center',
        gap: 12, flexWrap: 'wrap',
      }}>
        <div style={{
          fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 11,
          letterSpacing: '0.14em', textTransform: 'uppercase',
          color: 'var(--ink-2)', flex: 1, minWidth: 120,
        }}>
          Share this code with your partner
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontFamily: 'var(--sans)', fontSize: 18, fontWeight: 800,
            color: 'var(--navy)', letterSpacing: '0.18em',
          }}>{household.inviteCode}</span>
          <button onClick={copy} style={{
            background: copied ? 'var(--navy)' : 'transparent',
            color: copied ? 'var(--paper)' : 'var(--accent)',
            border: `1px solid ${copied ? 'var(--navy)' : 'var(--accent)'}`,
            borderRadius: 0, padding: '5px 10px',
            fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 10,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            cursor: 'pointer', transition: 'all 0.3s',
          }}>{copied ? '✓ copied' : 'copy'}</button>
        </div>
      </div>
    );
  }

  // ─── Local dev bypass ───────────────────────────────────────────────────────
  // Lets a developer preview the suite without Google sign-in. Hard-gated:
  // only on localhost AND only when explicitly opted in (?dev=1, which persists
  // via localStorage). Never runs in production. Turn off with ?dev=0.
  function devBypass() {
    const isLocal = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
    if (!isLocal) return null;
    const params = new URLSearchParams(location.search);
    if (params.get('dev') === '0') { localStorage.removeItem('ours_dev_bypass'); return null; }
    if (params.get('dev') === '1') localStorage.setItem('ours_dev_bypass', '1');
    if (localStorage.getItem('ours_dev_bypass') !== '1') return null;
    return {
      user: { uid: 'dev-user', displayName: 'Dev Preview', email: 'dev@localhost', photoURL: '' },
      household: {
        id: 'dev-household', name: 'The Preview Household', inviteCode: 'DEV123',
        accentColor: (() => { try { return localStorage.getItem('ours_accent') || 'red'; } catch (e) { return 'red'; } })(),
        memberUids: ['dev-user'],
        memberProfiles: { 'dev-user': { displayName: 'Dev Preview' } },
      },
    };
  }

  // ─── AuthProvider ──────────────────────────────────────────────────────────

  function AuthProvider({ children }) {
    const [user, setUser]           = useState(undefined);
    const [household, setHousehold] = useState(null);
    const [phase, setPhase]         = useState('loading');
    const [loadStatus, setLoadStatus] = useState('');
    const didMigrate      = useRef(false);
    const blockedEmailRef = useRef(null);

    useEffect(() => {
      // Local dev bypass — skip Firebase entirely when opted in on localhost.
      const bypass = devBypass();
      if (bypass) {
        console.warn('ours: DEV BYPASS active — no real auth');
        setUser(bypass.user);
        setHousehold(bypass.household);
        setPhase('ready');
        return;
      }

      setLoadStatus('Checking sign-in…');

      // Process any pending redirect result first, THEN listen for auth state
      fbAuth.getRedirectResult()
        .then(result => {
          if (result && result.user) {
            setLoadStatus('Google sign-in received, loading your account…');
            localStorage.removeItem('ours_auth_error');
          } else {
            // No redirect in flight — normal page load
            localStorage.removeItem('ours_auth_error');
          }
        })
        .catch(e => {
          if (e.code === 'auth/no-auth-event') {
            // Totally normal — no redirect was pending
            localStorage.removeItem('ours_auth_error');
          } else {
            // Real error — store it so SignInScreen can display it
            const msg = `${e.code}: ${e.message}`;
            console.error('getRedirectResult failed:', msg);
            localStorage.setItem('ours_auth_error', msg);
          }
        });

      const unsub = fbAuth.onAuthStateChanged(async (u) => {
        console.log('onAuthStateChanged:', u ? `signed in as ${u.email}` : 'signed out');
        setUser(u);
        if (!u) {
          if (blockedEmailRef.current) {
            setPhase('blocked');
            return;
          }
          // Sub-apps (/projects/...) should never show their own sign-in screen.
          // Redirect unauthenticated users to the hub so sign-in always lands
          // on the main "What are we planning?" page, not inside a sub-app.
          if (window.location.pathname.includes('/projects/')) {
            window.location.href = '/';
            return;
          }
          setPhase('signin');
          return;
        }

        setLoadStatus(`Signed in as ${u.email} — checking access…`);

        // ── Allowlist check ──────────────────────────────────────────────────
        // Only emails present in the allowedUsers collection can proceed.
        // Add/remove access anytime in the Firebase Console without a deploy.
        const allowed = await db.collection('allowedUsers').doc(u.email).get();
        if (!allowed.exists) {
          blockedEmailRef.current = u.email;
          await fbAuth.signOut();
          return;
        }
        // ─────────────────────────────────────────────────────────────────────

        setLoadStatus(`Signed in as ${u.email} — loading household…`);

        try {
          // Save/update user profile
          setLoadStatus('Saving profile…');
          await db.doc(`users/${u.uid}`).set({
            displayName: u.displayName || '',
            email: u.email || '',
            photoURL: u.photoURL || '',
            lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });

          setLoadStatus('Loading household…');
          const userDoc = await db.doc(`users/${u.uid}`).get();
          const data = userDoc.data();

          if (data?.householdId) {
            setLoadStatus('Found household, loading…');
            const hhDoc = await db.doc(`households/${data.householdId}`).get();
            if (hhDoc.exists) {
              const hh = { id: hhDoc.id, ...hhDoc.data() };
              setHousehold(hh);

              if (!didMigrate.current && !localStorage.getItem('ours_migrated')) {
                didMigrate.current = true;
                migrateLocalData(data.householdId).catch(console.warn);
              }

              setPhase('ready');
            } else {
              setPhase('setup');
            }
          } else {
            setLoadStatus('New account — choose or join a household');
            setPhase('setup');
          }
        } catch (e) {
          console.error('auth setup failed:', e.code, e.message);
          setLoadStatus(`Setup error: ${e.code || e.message} — proceeding anyway`);
          // Wait a beat so the user can read the error, then continue
          setTimeout(() => setPhase('setup'), 2500);
        }
      });

      return unsub;
    }, []);

    // Keep the platform accent in sync with the household setting.
    useEffect(() => {
      applyAccent(household && household.accentColor ? household.accentColor : 'red');
    }, [household]);

    function handleHouseholdDone(hh) {
      setHousehold(hh);
      if (!didMigrate.current && !localStorage.getItem('ours_migrated')) {
        didMigrate.current = true;
        migrateLocalData(hh.id).catch(console.warn);
      }
      setPhase('ready');
    }

    if (phase === 'loading') return <LoadingScreen status={loadStatus} />;
    if (phase === 'blocked') return <BlockedScreen email={blockedEmailRef.current} />;
    if (phase === 'signin')  return <SignInScreen />;
    if (phase === 'setup')   return (
      <HouseholdSetupScreen user={user} onDone={handleHouseholdDone} />
    );

    return (
      <AuthContext.Provider value={{ user, household, setHousehold }}>
        {children}
      </AuthContext.Provider>
    );
  }

  // ─── Export to window so subsequent text/babel scripts can import ──────────

  window._oursAuth = {
    AuthContext,
    useAuth,
    AuthProvider,
    InviteCodeBanner,
    migrateLocalData,
    ACCENT_PRESETS,
    accentById,
    applyAccent,
  };

})();
