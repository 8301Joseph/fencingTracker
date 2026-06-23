import Link from 'next/link';

export default function HomePage() {
  return (
    <main>
      <h1>Fencing Training Tracker</h1>
      <p>Record a post-session voice note, generate structured takeaways, and review your training history.</p>
      <nav style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '20px' }}>
        <Link href="/record">Record Session</Link>
        <Link href="/history">History</Link>
        <Link href="/insights">Insights</Link>
      </nav>
    </main>
  );
}
