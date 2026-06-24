'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAuthState, logout } from '@/lib/authUtils';

export default function SessionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params?.id;
  const [session, setSession] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<'Joseph' | 'Sophia' | null>(null);

  useEffect(() => {
    const auth = getAuthState();
    if (!auth.isAuthenticated) {
      router.push('/login');
    } else {
      setCurrentUser(auth.user);
    }
  }, [router]);

  useEffect(() => {
    if (!sessionId) return;
    fetch(`/api/sessions/${sessionId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setSession(data);
        }
      })
      .catch((err) => setError(err.message));
  }, [sessionId]);

  const toggleCompleted = async (takeaway: any) => {
    setSaving(true);
    const response = await fetch(`/api/takeaways/${takeaway.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !takeaway.completed })
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error || 'Unable to update takeaway');
    } else {
      setSession((current: any) => ({
        ...current,
        takeaways: current.takeaways.map((item: any) => item.id === takeaway.id ? payload : item)
      }));
    }
    setSaving(false);
  };

  if (!sessionId) {
    return <p>Session ID missing.</p>;
  }

  return (
    <main style={{ background: 'linear-gradient(135deg, #f8fafb 0%, #f0f4ff 100%)', minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: 880, margin: '0 auto' }}>
        <header style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '2.8rem', margin: 0, color: '#0b1f4d', fontWeight: 700 }}>Session Detail</h1>
        </header>

        <nav style={{ marginBottom: '28px' }}>
          <Link href="/" style={{ color: '#0b5fff', textDecoration: 'none', marginRight: 20, fontWeight: 500 }}>← Back Home</Link>
          <Link href="/history" style={{ color: '#0b5fff', textDecoration: 'none', fontWeight: 500 }}>Back to History</Link>
        </nav>

        {error ? (
          <div style={{ padding: '20px', borderRadius: 16, background: '#fef3f2', border: '1px solid #fecaca', color: '#b91c1c', marginBottom: 24 }}>
            <p style={{ margin: 0, fontWeight: 600 }}>Error</p>
            <p style={{ margin: '8px 0 0' }}>{error}</p>
          </div>
        ) : null}

        {!session ? (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '40px' }}>Loading session…</p>
        ) : (
          <div style={{ display: 'grid', gap: '28px' }}>
            {/* Session Info Card */}
            <article style={{ padding: '28px', borderRadius: 18, background: '#fff', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(11, 95, 255, 0.06)' }}>
              <h2 style={{ margin: '0 0 20px', fontSize: '1.6rem', color: '#0b1f4d', fontWeight: 600 }}>📅 {session.session_date}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', color: '#555' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280', fontWeight: 600 }}>Weapon</p>
                  <p style={{ margin: '6px 0 0', fontSize: '1rem' }}>{session.weapon ?? '—'}</p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280', fontWeight: 600 }}>Session Type</p>
                  <p style={{ margin: '6px 0 0', fontSize: '1rem' }}>{session.session_type ?? '—'}</p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280', fontWeight: 600 }}>Duration</p>
                  <p style={{ margin: '6px 0 0', fontSize: '1rem' }}>{session.duration_minutes ? `${session.duration_minutes} min` : '—'}</p>
                </div>
              </div>
            </article>

            {/* Summary Card */}
            <article style={{ padding: '28px', borderRadius: 18, background: '#ecf9f5', border: '2px solid #10b981' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', color: '#047857', fontWeight: 600 }}>📝 Summary</h3>
              <p style={{ margin: 0, fontSize: '1.05rem', lineHeight: 1.6, color: '#047857' }}>{session.summary ?? 'No summary available.'}</p>
            </article>

            {/* Transcript Card */}
            <article style={{ padding: '28px', borderRadius: 18, background: '#fff', border: '1px solid #e5e7eb' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', color: '#0b1f4d', fontWeight: 600 }}>🎙️ Transcript</h3>
              <pre style={{ whiteSpace: 'pre-wrap', margin: 0, padding: '16px', background: '#f8fafb', borderRadius: 12, fontSize: '0.95rem', lineHeight: 1.5, border: '1px solid #e5e7eb', color: '#374151' }}>{session.transcript}</pre>
            </article>

            {/* Takeaways Card */}
            <article style={{ padding: '28px', borderRadius: 18, background: '#fff', border: '1px solid #e5e7eb' }}>
              <h3 style={{ margin: '0 0 20px', fontSize: '1.1rem', color: '#0b1f4d', fontWeight: 600 }}>💡 Key Takeaways ({session.takeaways?.length ?? 0})</h3>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '14px' }}>
                {session.takeaways.map((takeaway: any) => (
                  <li key={takeaway.id} style={{ padding: '16px', background: '#f8fafb', borderRadius: 12, border: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '12px', marginBottom: '10px' }}>
                      <span style={{ display: 'inline-block', padding: '6px 12px', background: '#f0f4ff', color: '#0b5fff', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600 }}>
                        {takeaway.category}
                      </span>
                      {takeaway.is_action_item && (
                        <span style={{ display: 'inline-block', padding: '6px 12px', background: '#fef3c7', color: '#b45309', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600 }}>
                          Action Item
                        </span>
                      )}
                    </div>
                    <p style={{ margin: '8px 0 0', color: '#374151', lineHeight: 1.5 }}>{takeaway.content}</p>
                    {takeaway.category === 'action_item' && (
                      <button
                        type="button"
                        onClick={() => toggleCompleted(takeaway)}
                        disabled={saving}
                        style={{
                          marginTop: '12px',
                          padding: '8px 16px',
                          borderRadius: 8,
                          border: 'none',
                          background: takeaway.completed ? '#d1fae5' : '#fef3c7',
                          color: takeaway.completed ? '#047857' : '#b45309',
                          cursor: saving ? 'not-allowed' : 'pointer',
                          fontWeight: 500,
                          fontSize: '0.9rem'
                        }}
                      >
                        {takeaway.completed ? '✓ Complete' : 'Mark complete'}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </article>
          </div>
        )}
      </div>
    </main>
  );
}
