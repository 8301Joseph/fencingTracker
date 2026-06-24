'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAuthState, logout } from '@/lib/authUtils';

export default function HistoryPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<'Joseph' | 'Sophia' | null>(null);

  useEffect(() => {
    const auth = getAuthState();
    if (!auth.isAuthenticated) {
      router.push('/login');
    } else {
      setCurrentUser(auth.user);
    }
  }, [router]);

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/sessions');
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Unable to load sessions');
      }
      setSessions(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteSession = async (id: string) => {
    const confirmed = window.confirm('Delete this session permanently?');
    if (!confirmed) {
      return;
    }

    setError(null);
    setDeletingId(id);

    try {
      const response = await fetch(`/api/sessions/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Unable to delete session');
      }
      await fetchSessions();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  return (
    <main style={{ background: 'linear-gradient(135deg, #f8fafb 0%, #f0f4ff 100%)', minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: 880, margin: '0 auto' }}>
        <header style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '2.8rem', margin: 0, color: '#0b1f4d', fontWeight: 700 }}>Session History</h1>
          <p style={{ fontSize: '1rem', color: '#555', margin: '12px 0 0', lineHeight: 1.5 }}>
            All your recorded sessions sorted by date. Each session shows the summary and key takeaways extracted from your notes.
          </p>
        </header>

        <nav style={{ marginBottom: '32px', color: '#555', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ color: '#0b5fff', textDecoration: 'none', marginRight: 20, fontWeight: 500 }}>← Back Home</Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {currentUser && <span style={{ fontSize: '0.9rem', color: '#666' }}>Logged in as <strong>{currentUser}</strong></span>}
            <button
              type="button"
              onClick={() => {
                logout();
                router.push('/login');
              }}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                background: '#fff',
                color: '#666',
                fontSize: '0.9rem',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              Logout
            </button>
          </div>
        </nav>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ color: '#374151', fontSize: '1rem' }}>
            {sessions.length === 0 ? 'No sessions yet.' : `${sessions.length} session${sessions.length === 1 ? '' : 's'}`}
          </div>
          <button
            type="button"
            onClick={fetchSessions}
            style={{
              padding: '12px 20px',
              borderRadius: 14,
              border: 'none',
              background: '#0b5fff',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 500,
              boxShadow: '0 4px 12px rgba(11, 95, 255, 0.2)'
            }}
          >
            Refresh
          </button>
        </div>

        {error ? (
          <div style={{ marginBottom: 24, padding: '20px', borderRadius: 16, background: '#fef3f2', border: '1px solid #fecaca', color: '#b91c1c' }}>
            <p style={{ margin: 0, fontWeight: 600 }}>Unable to load history</p>
            <p style={{ margin: '10px 0 0' }}>{error}</p>
          </div>
        ) : null}

        {loading ? (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '40px' }}>Loading sessions…</p>
        ) : null}

        <div style={{ display: 'grid', gap: '24px' }}>
          {sessions.length === 0 && !loading && !error ? (
            <div style={{ padding: '40px', borderRadius: 18, border: '1px solid #e5e7eb', background: '#ffffff', color: '#6b7280', textAlign: 'center' }}>
              <p style={{ fontSize: '1.1rem', margin: 0 }}>No sessions yet. Head home to record your first training session.</p>
            </div>
          ) : (
            sessions.map((session) => (
              <article key={session.id} style={{ padding: '28px', borderRadius: 18, border: '1px solid #e5e7eb', background: '#fff', boxShadow: '0 4px 12px rgba(11, 95, 255, 0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap', marginBottom: '20px' }}>
                  <div style={{ flex: 1, minWidth: 240 }}>
                    <p style={{ margin: 0, color: '#0b5fff', fontSize: '0.95rem', fontWeight: 600 }}>{session.session_date}</p>
                    <h2 style={{ margin: '8px 0 0', fontSize: '1.3rem', color: '#0b1f4d', lineHeight: 1.3, fontWeight: 600 }}>{session.summary || 'Session summary not available'}</h2>
                  </div>
                  <div style={{ textAlign: 'right', minWidth: 140, color: '#374151' }}>
                    <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>{session.takeaways?.length ?? 0} takeaways</p>
                    <p style={{ margin: '8px 0 0', fontSize: '0.9rem', color: '#6b7280' }}>{session.transcript ? 'Transcribed' : 'No transcript'}</p>
                  </div>
                </div>

                <div style={{ marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {(session.takeaways || []).slice(0, 3).map((takeaway: any) => (
                    <span key={takeaway.content} style={{ padding: '8px 14px', borderRadius: 12, background: '#f0f4ff', color: '#0b5fff', fontSize: '0.9rem', fontWeight: 500 }}>
                      {takeaway.category}
                    </span>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <Link href={`/session/${session.id}`} style={{ color: '#0b5fff', textDecoration: 'none', fontWeight: 600, fontSize: '0.95rem' }}>
                    View details →
                  </Link>
                  <button
                    type="button"
                    onClick={() => deleteSession(session.id)}
                    disabled={deletingId === session.id}
                    style={{
                      padding: '10px 16px',
                      borderRadius: 14,
                      border: '1px solid #ef4444',
                      background: deletingId === session.id ? '#fee2e2' : '#fff',
                      color: '#b91c1c',
                      cursor: deletingId === session.id ? 'not-allowed' : 'pointer',
                      fontWeight: 600,
                      transition: 'background 0.2s ease'
                    }}
                  >
                    {deletingId === session.id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
