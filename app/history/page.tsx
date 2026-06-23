'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const weapons = ['', 'foil', 'epee', 'sabre'];
const sessionTypes = ['', 'lesson', 'open_fencing', 'drills', 'competition', 'conditioning', 'other'];

export default function HistoryPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [weapon, setWeapon] = useState('');
  const [sessionType, setSessionType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (weapon) params.append('weapon', weapon);
    if (sessionType) params.append('session_type', sessionType);
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    try {
      const response = await fetch(`/api/sessions?${params.toString()}`);
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

  useEffect(() => {
    fetchSessions();
  }, []);

  return (
    <main>
      <h1>Session History</h1>
      <nav style={{ marginBottom: '18px' }}>
        <Link href="/">Home</Link> · <Link href="/record">Record</Link> · <Link href="/insights">Insights</Link>
      </nav>

      <section style={{ marginBottom: '20px' }}>
        <h2>Filters</h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <select value={weapon} onChange={(e) => setWeapon(e.target.value)}>
            {weapons.map((option) => (
              <option key={option} value={option}>{option || 'Weapon'}</option>
            ))}
          </select>
          <select value={sessionType} onChange={(e) => setSessionType(e.target.value)}>
            {sessionTypes.map((option) => (
              <option key={option} value={option}>{option || 'Session type'}</option>
            ))}
          </select>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          <button type="button" onClick={fetchSessions}>Apply</button>
        </div>
      </section>

      {error ? <p style={{ color: 'red' }}>{error}</p> : null}
      {loading ? <p>Loading sessions…</p> : null}

      <section>
        {sessions.length === 0 ? (
          <p>No sessions found.</p>
        ) : (
          <div style={{ display: 'grid', gap: '18px' }}>
            {sessions.map((session) => (
              <article key={session.id} style={{ border: '1px solid #ddd', padding: '16px', borderRadius: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                  <div>
                    <strong>{session.session_date}</strong>
                    <p>{session.summary || 'No summary available yet.'}</p>
                  </div>
                  <div>
                    <p>{session.weapon ?? 'Unknown weapon'}</p>
                    <p>{session.session_type ?? 'Unknown type'}</p>
                  </div>
                </div>
                <p>{session.takeaways?.length ?? 0} takeaways</p>
                <Link href={`/session/${session.id}`}>View session</Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
