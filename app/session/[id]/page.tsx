'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function SessionDetailPage() {
  const params = useParams();
  const sessionId = params?.id;
  const [session, setSession] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
    <main>
      <h1>Session detail</h1>
      <nav style={{ marginBottom: '18px' }}>
        <Link href="/">Home</Link> · <Link href="/history">History</Link> · <Link href="/record">Record</Link>
      </nav>

      {error ? <p style={{ color: 'red' }}>{error}</p> : null}
      {!session ? <p>Loading session…</p> : (
        <section>
          <h2>{session.session_date}</h2>
          <p><strong>Weapon:</strong> {session.weapon ?? 'Unknown'}</p>
          <p><strong>Type:</strong> {session.session_type ?? 'Unknown'}</p>
          <p><strong>Duration:</strong> {session.duration_minutes ?? '—'} min</p>
          <p><strong>Coach:</strong> {session.coach ?? '—'}</p>
          <p><strong>Club:</strong> {session.club ?? '—'}</p>
          <h3>Summary</h3>
          <p>{session.summary ?? 'No summary available.'}</p>
          <h3>Transcript</h3>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#f8f8f8', padding: '12px', borderRadius: 8 }}>{session.transcript}</pre>
          <h3>Takeaways</h3>
          <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '12px' }}>
            {session.takeaways.map((takeaway: any) => (
              <li key={takeaway.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: '12px' }}>
                <p><strong>{takeaway.category}</strong> {takeaway.is_action_item ? '· action item' : ''}</p>
                <p>{takeaway.content}</p>
                {takeaway.category === 'action_item' ? (
                  <button type="button" onClick={() => toggleCompleted(takeaway)} disabled={saving}>
                    {takeaway.completed ? 'Mark incomplete' : 'Mark complete'}
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
