import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Fencing Training Tracker',
  description: 'Track voice-note sessions, transcripts, takeaways, and training insights.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
          {children}
        </div>
      </body>
    </html>
  );
}
