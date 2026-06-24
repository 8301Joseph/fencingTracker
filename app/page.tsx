'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAuthState, logout } from '@/lib/authUtils';

type SubmitState = 'idle' | 'recording' | 'uploading' | 'complete';

export default function HomePage() {
  const router = useRouter();
  const [status, setStatus] = useState<SubmitState>('idle');
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [timer, setTimer] = useState(0);
  const timerIdRef = useRef<number | null>(null);
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
    return () => {
      if (timerIdRef.current) {
        window.clearInterval(timerIdRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    setError(null);
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err: any) {
      console.error('getUserMedia error', err);
      if (err.name === 'NotAllowedError' || err.name === 'SecurityError' || err.message?.toLowerCase?.().includes('permission')) {
        setError('Microphone access denied. Allow the browser to use your microphone (browser prompt), then reload and try again. On macOS, also check System Settings → Privacy & Security → Microphone and enable the browser.');
      } else {
        setError(err.message || String(err));
      }
      return;
    }

    const recorder = new MediaRecorder(stream);
    recorderRef.current = recorder;
    chunksRef.current = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      setRecordingBlob(blob);
      setRecordingUrl(URL.createObjectURL(blob));
      setStatus('idle');
    };

    recorder.start();
    setStatus('recording');
    setTimer(0);
    timerIdRef.current = window.setInterval(() => setTimer((t) => t + 1), 1000);
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    if (timerIdRef.current) {
      window.clearInterval(timerIdRef.current);
      timerIdRef.current = null;
    }
  };

  const submitSession = async () => {
    if (!recordingBlob) {
      setError('Record audio before submitting.');
      return;
    }

    if (!currentUser) {
      setError('Not logged in.');
      return;
    }

    setStatus('uploading');
    setError(null);

    const data = new FormData();
    data.append('audio', recordingBlob, 'session.webm');

    try {
      const response = await fetch(`/api/sessions?user=${encodeURIComponent(currentUser)}`, { method: 'POST', body: data });
      const rawText = await response.text();
      let payload: any = null;

      try {
        payload = rawText ? JSON.parse(rawText) : null;
      } catch {
        // Leave payload null and fall through to error handling.
      }

      if (!response.ok) {
        throw new Error(payload?.error || rawText || `Upload failed with status ${response.status}`);
      }

      if (!payload) {
        throw new Error('Server returned an invalid response. See console for details.');
      }

      console.log('✅ Received payload from API:', payload);
      setResult(payload);
      setStatus('complete');
    } catch (err: any) {
      setError(err.message);
      setStatus('idle');
    }
  };

  return (
    <main style={{ background: 'linear-gradient(135deg, #f8fafb 0%, #f0f4ff 100%)', minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: 880, margin: '0 auto' }}>
        {/* Header */}
        <header style={{ marginBottom: '48px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '3.2rem', margin: 0, color: '#0b1f4d', fontWeight: 700 }}>Training Tracker</h1>
          <p style={{ fontSize: '1.1rem', color: '#555', margin: '16px 0 0', maxWidth: 680, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>
            Record your training notes after each session. We'll transcribe your voice, extract key takeaways, and save everything for later review.
          </p>
        </header>

        {/* Quick nav */}
        <nav style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/history" style={{ color: '#0b5fff', textDecoration: 'none', fontSize: '1rem', fontWeight: 500 }}>View History</Link>
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

        {/* Recording Section */}
        <section style={{ marginBottom: '32px', padding: '32px', borderRadius: 20, background: '#fff', boxShadow: '0 8px 24px rgba(11, 95, 255, 0.08)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '18px', alignItems: 'center', marginBottom: '28px' }}>
            <button
              type="button"
              onClick={status === 'recording' ? stopRecording : startRecording}
              style={{
                padding: '16px 28px',
                borderRadius: 16,
                border: 'none',
                background: status === 'recording' ? '#dc2626' : '#0b5fff',
                color: '#fff',
                fontSize: '1.05rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: status === 'recording' ? '0 4px 12px rgba(220, 38, 38, 0.3)' : '0 4px 12px rgba(11, 95, 255, 0.3)'
              }}
            >
              {status === 'recording' ? '⏹ Stop Recording' : '⏺ Start Recording'}
            </button>

            <div style={{ flex: 1, minWidth: 160, color: '#374151', fontSize: '1rem' }}>
              {status === 'recording'
                ? `Recording… ${timer}s`
                : recordingUrl
                ? `Ready to save (${timer}s)`
                : 'Tap record and describe your session.'}
            </div>
          </div>

          {recordingUrl ? (
            <>
              <audio controls src={recordingUrl} style={{ marginBottom: 24, width: '100%', borderRadius: 12 }} />
              <button
                type="button"
                onClick={submitSession}
                disabled={status === 'uploading' || status === 'recording'}
                style={{
                  padding: '16px 28px',
                  borderRadius: 16,
                  border: 'none',
                  background: '#10b981',
                  color: '#fff',
                  fontSize: '1.05rem',
                  fontWeight: 600,
                  cursor: status === 'uploading' || status === 'recording' ? 'not-allowed' : 'pointer',
                  opacity: status === 'uploading' || status === 'recording' ? 0.7 : 1,
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}
              >
                {status === 'uploading' ? '⏳ Saving…' : '💾 Save Session'}
              </button>
            </>
          ) : (
            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.95rem', lineHeight: 1.6 }}>
              Start recording and speak your training notes. When you're done, we'll transcribe it and extract actionable takeaways automatically.
            </p>
          )}
        </section>

        {/* Error State */}
        {error ? (
          <section style={{ marginBottom: '32px', padding: '22px', borderRadius: 16, background: '#fef3f2', border: '1px solid #fecaca' }}>
            <p style={{ margin: 0, color: '#b91c1c', fontWeight: 600 }}>Error</p>
            <p style={{ margin: '12px 0 0', color: '#991b1b' }}>{error}</p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => { setError(null); startRecording(); }}
                style={{ padding: '12px 20px', borderRadius: 12, border: '1px solid #b91c1c', background: '#fff', color: '#b91c1c', cursor: 'pointer', fontWeight: 500 }}
              >
                Retry
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                style={{ padding: '12px 20px', borderRadius: 12, border: '1px solid #fecaca', background: '#fef2f2', color: '#991b1b', cursor: 'pointer', fontWeight: 500 }}
              >
                Reload page
              </button>
            </div>
          </section>
        ) : null}

        {/* Result State */}
        {result ? (
          <section style={{ padding: '32px', borderRadius: 20, background: '#ecf9f5', border: '2px solid #10b981' }}>
            <h2 style={{ margin: '0 0 24px', fontSize: '1.6rem', color: '#047857' }}>✓ Session Saved!</h2>
            
            <div style={{ marginBottom: '28px', paddingBottom: '28px', borderBottom: '1px solid #d1fae5' }}>
              <p style={{ margin: 0, fontSize: '1.15rem', color: '#047857', lineHeight: 1.6 }}>{result.summary}</p>
            </div>

            <div style={{ marginBottom: '28px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '1rem', color: '#047857', fontWeight: 600 }}>Transcript</h3>
              <pre style={{ whiteSpace: 'pre-wrap', margin: 0, padding: '16px', background: '#f0fdf4', borderRadius: 12, fontSize: '0.95rem', color: '#1f2937', lineHeight: 1.5, border: '1px solid #bbf7d0' }}>{result.transcript}</pre>
            </div>

            <div>
              <h3 style={{ margin: '0 0 16px', fontSize: '1rem', color: '#047857', fontWeight: 600 }}>Key Takeaways</h3>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {(result.takeaways || []).map((takeaway: any) => (
                  <li key={takeaway.id || takeaway.content} style={{ marginBottom: '12px', padding: '14px', background: '#f0fdf4', borderRadius: 12, border: '1px solid #bbf7d0' }}>
                    <strong style={{ color: '#047857' }}>{takeaway.category}</strong>
                    <p style={{ margin: '8px 0 0', color: '#1f2937' }}>{takeaway.content}</p>
                  </li>
                ))}
              </ul>
            </div>

            <Link href="/history" style={{ marginTop: '24px', display: 'inline-block', color: '#0b5fff', textDecoration: 'none', fontWeight: 600 }}>
              View all sessions →
            </Link>
          </section>
        ) : null}
      </div>
    </main>
  );
}

