import React, { useEffect, useState } from 'react';

const VOTE_LABELS = {
  creative: { label: 'Most Creative', emoji: '🎨' },
  funny:    { label: 'Funniest',       emoji: '😂' },
  color:    { label: 'Best Color Use', emoji: '🌈' },
  impressive: { label: 'Most Impressive', emoji: '🏆' },
};

function BuildCard({ build, onVote, voted }) {
  const total = Object.values(build.votes).reduce((a, b) => a + b, 0);
  return (
    <div style={{
      background: '#1a1a2e', border: '1px solid #4c1d95', borderRadius: '14px',
      padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px',
    }}>
      <div>
        <div style={{ fontSize: '11px', color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Theme</div>
        <div style={{ fontSize: '16px', fontWeight: 700, color: '#f0f0f0' }}>{build.theme}</div>
        <div style={{ fontSize: '12px', color: '#555', marginTop: '2px' }}>
          {build.cubes.length} cubes · {new Date(build.createdAt).toLocaleDateString()}
        </div>
      </div>

      <div style={{ background: '#0f0f1a', borderRadius: '10px', padding: '12px' }}>
        <div style={{ fontSize: '24px', textAlign: 'center' }}>{build.badge?.emoji}</div>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#e9d5ff', textAlign: 'center' }}>{build.badge?.name}</div>
        <div style={{ fontSize: '12px', color: '#7c3aed', fontWeight: 700, textAlign: 'center', marginTop: '2px' }}>"{build.review?.title}"</div>
        <div style={{ fontSize: '11px', color: '#888', marginTop: '6px', lineHeight: 1.5 }}>{build.review?.text?.slice(0, 120)}…</div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {Object.entries(VOTE_LABELS).map(([cat, { label, emoji }]) => {
          const hasVoted = voted.has(cat);
          return (
            <button
              key={cat}
              onClick={() => !hasVoted && onVote(build.id, cat)}
              style={{
                flex: '1 1 calc(50% - 3px)', padding: '6px 4px', borderRadius: '8px',
                border: `1px solid ${hasVoted ? '#7c3aed' : '#4c1d95'}`,
                background: hasVoted ? '#4c1d95' : 'transparent',
                color: hasVoted ? '#e9d5ff' : '#a78bfa',
                fontSize: '11px', fontWeight: 600, cursor: hasVoted ? 'default' : 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {emoji} {label} · {build.votes[cat]}
            </button>
          );
        })}
      </div>
      <div style={{ fontSize: '11px', color: '#555', textAlign: 'center' }}>{total} total vote{total !== 1 ? 's' : ''}</div>
    </div>
  );
}

export default function GalleryPage() {
  const [builds, setBuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [votes, setVotes] = useState({});

  useEffect(() => {
    fetch('/api/builds')
      .then(r => r.json())
      .then(d => { setBuilds(d); setLoading(false); })
      .catch(() => setLoading(false));
    const saved = JSON.parse(localStorage.getItem('cc_votes') || '{}');
    setVotes(saved);
  }, []);

  const handleVote = async (id, category) => {
    const key = `${id}:${category}`;
    const saved = JSON.parse(localStorage.getItem('cc_votes') || '{}');
    if (saved[key]) return;

    try {
      const res = await fetch(`/api/builds/${id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category }),
      });
      const updated = await res.json();
      setBuilds(prev => prev.map(b => b.id === id ? updated : b));
      saved[key] = true;
      localStorage.setItem('cc_votes', JSON.stringify(saved));
      setVotes(saved);
    } catch {
      alert('Vote failed — is the server running?');
    }
  };

  const getVoted = (id) => {
    const saved = JSON.parse(localStorage.getItem('cc_votes') || '{}');
    return new Set(Object.keys(VOTE_LABELS).filter(cat => saved[`${id}:${cat}`]));
  };

  if (loading) return <div style={{ textAlign: 'center', paddingTop: '80px', color: '#a78bfa' }}>Loading gallery…</div>;

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#0f0f1a' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 16px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#a78bfa', marginBottom: '6px' }}>🏛 Gallery</h1>
        <p style={{ color: '#555', fontSize: '13px', marginBottom: '24px' }}>
          {builds.length} build{builds.length !== 1 ? 's' : ''} submitted. Vote for your favorites!
        </p>

        {builds.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#555', paddingTop: '60px' }}>
            No builds yet. <a href="/" style={{ color: '#a78bfa' }}>Be the first!</a>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px',
          }}>
            {builds.map(b => (
              <BuildCard
                key={b.id}
                build={b}
                onVote={handleVote}
                voted={getVoted(b.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
