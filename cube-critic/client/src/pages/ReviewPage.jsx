import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

const card = {
  maxWidth: '600px', margin: '0 auto', padding: '40px 20px',
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px',
};

export default function ReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [build, setBuild] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/builds/${id}`)
      .then(r => r.json())
      .then(d => { setBuild(d); setLoading(false); })
      .catch(() => { setLoading(false); });
  }, [id]);

  if (loading) return <div style={{ textAlign: 'center', paddingTop: '80px', color: '#a78bfa' }}>Loading review…</div>;
  if (!build) return <div style={{ textAlign: 'center', paddingTop: '80px', color: '#ef4444' }}>Build not found.</div>;

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: 'linear-gradient(180deg,#0f0f1a,#1a1a2e)' }}>
      <div style={card}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#a78bfa', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>
            Theme: {build.theme}
          </div>
          <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
            {build.cubes.length} cube{build.cubes.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div style={{
          width: '100%', background: '#1a1a2e', border: '2px solid #7c3aed',
          borderRadius: '16px', padding: '28px', textAlign: 'center',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>{build.badge?.emoji ?? '⭐'}</div>
          <div style={{ fontSize: '13px', color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Badge Earned</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#e9d5ff', marginBottom: '20px' }}>{build.badge?.name}</div>

          <div style={{ width: '100%', height: '1px', background: '#4c1d95', margin: '16px 0' }} />

          <div style={{ fontSize: '13px', color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>The Critic Says</div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#f0f0f0', marginBottom: '12px' }}>"{build.review?.title}"</div>
          <div style={{ fontSize: '14px', color: '#c4b5fd', lineHeight: 1.7 }}>{build.review?.text}</div>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '12px 28px', borderRadius: '10px', border: 'none',
              background: '#7c3aed', color: '#fff', fontSize: '15px', fontWeight: 700, cursor: 'pointer',
            }}
          >
            🎲 New Build
          </button>
          <Link
            to="/gallery"
            style={{
              padding: '12px 28px', borderRadius: '10px',
              background: 'transparent', color: '#a78bfa', fontSize: '15px', fontWeight: 700,
              border: '1px solid #4c1d95', textDecoration: 'none',
            }}
          >
            🏛 Gallery
          </Link>
        </div>
      </div>
    </div>
  );
}
