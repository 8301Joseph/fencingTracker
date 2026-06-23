'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function InsightsPage() {
  const [insights, setInsights] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/insights')
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setInsights(data);
        }
      })
      .catch((err) => setError(err.message));
  }, []);

  return (
    <main>
      <h1>Insights</h1>
      <nav style={{ marginBottom: '18px' }}>
        <Link href="/">Home</Link> · <Link href="/record">Record</Link> · <Link href="/history">History</Link>
      </nav>

      {error ? <p style={{ color: 'red' }}>{error}</p> : null}
      {!insights ? <p>Loading insights…</p> : (
        <div style={{ display: 'grid', gap: '24px' }}>
          <section>
            <h2>Open action items</h2>
            {insights.openActionItems.length === 0 ? (
              <p>No open action items.</p>
            ) : (
              <ul>
                {insights.openActionItems.map((item: any) => (
                  <li key={item.id}>{item.content}</li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2>Takeaway categories</h2>
            <ul>
              {insights.categoryCounts.map((entry: any) => (
                <li key={entry.category}>{entry.category}: {entry.count}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2>Recent injury flags</h2>
            {insights.recentInjuries.length === 0 ? (
              <p>No recent injury notes.</p>
            ) : (
              <ul>
                {insights.recentInjuries.map((item: any) => (
                  <li key={item.id}>{item.content}</li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
