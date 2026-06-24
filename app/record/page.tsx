'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAuthState, logout } from '@/lib/authUtils';

type SubmitState = 'idle' | 'recording' | 'uploading' | 'complete';

export default function RecordPage() {
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

    setStatus('uploading');
    setError(null);

    const data = new FormData();
    data.append('audio', recordingBlob, 'session.webm');

    try {
      const response = await fetch('/api/sessions', { method: 'POST', body: data });
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

      setResult(payload);
      setStatus('complete');
    } catch (err: any) {
      setError(err.message);
      setStatus('idle');
    }
  };

  return (
    <main style={{ maxWidth: 840, margin: '0 auto', padding: '24px', fontFamily: 'system-ui, sans-serif', color: '#111' }}>
      <header style={{ marginBottom: '28px' }}>
        <h1 style={{ margin: 0, fontSize: '2.4rem' }}>Training Tracker</h1>
        <p style={{ margin: '12px 0 0', fontSize: '1rem', color: '#555', maxWidth: 680 }}>
          Record a quick voice note after practice and auto-save the summary, transcript, and coaching takeaways.
        </p>
      </header>

      <nav style={{ marginBottom: '24px', color: '#555', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <Link href="/" style={{ color: '#0b5fff', textDecoration: 'none' }}>Home</Link>
          <Link href="/history" style={{ color: '#0b5fff', textDecoration: 'none' }}>History</Link>
        </div>
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

      <section style={{ marginBottom: '24px', padding: '22px', border: '1px solid #e5e7eb', borderRadius: 18, boxShadow: '0 18px 40px rgba(15, 23, 42, 0.05)', background: '#fff' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={status === 'recording' ? stopRecording : startRecording}
            style={{
              padding: '14px 22px',
              borderRadius: 14,
              border: 'none',
              background: status === 'recording' ? '#dc2626' : '#0b5fff',
              color: '#fff',
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            {status === 'recording' ? 'Stop Recording' : 'Start Recording'}
          </button>

          <div style={{ minWidth: 180, color: '#374151', fontSize: '1rem' }}>
            {status === 'recording'
              ? `Recording… ${timer}s`
              : recordingUrl
              ? `Ready to submit (${timer}s)`
              : 'Tap record and describe your session.'}
          </div>
        </div>

        {recordingUrl ? (
          <audio controls src={recordingUrl} style={{ marginTop: 18, width: '100%' }} />
        ) : (
          <p style={{ marginTop: 18, color: '#6b7280' }}>
            Start recording, speak your training notes, then stop and submit. The app will save the current date automatically.
          </p>
        )}
      </section>

      <button
        type="button"
        onClick={submitSession}
        disabled={status === 'uploading' || status === 'recording' || !recordingBlob}
        style={{
          padding: '14px 24px',
          borderRadius: 14,
          border: 'none',
          background: '#10b981',
          color: '#fff',
          fontSize: '1rem',
          cursor: status === 'uploading' || status === 'recording' || !recordingBlob ? 'not-allowed' : 'pointer',
          opacity: status === 'uploading' || status === 'recording' || !recordingBlob ? 0.65 : 1
        }}
      >
        {status === 'uploading' ? 'Submitting…' : 'Save Session'}
      </button>

      {error ? (
        <div style={{ marginTop: 20, padding: '18px', borderRadius: 14, background: '#fef3f2', border: '1px solid #fecaca', color: '#b91c1c' }}>
          <p style={{ margin: 0, fontWeight: 600 }}>Error</p>
          <p style={{ margin: '10px 0 0' }}>{error}</p>
          <div style={{ display: 'flex', gap: '10px', marginTop: 14, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => { setError(null); startRecording(); }}
              style={{ padding: '10px 16px', borderRadius: 12, border: '1px solid #b91c1c', background: '#fff', color: '#b91c1c', cursor: 'pointer' }}
            >
              Retry
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{ padding: '10px 16px', borderRadius: 12, border: '1px solid #fca5a5', background: '#fef2f2', color: '#981b1b', cursor: 'pointer' }}
            >
              Reload page
            </button>
          </div>
        </div>
      ) : null}

      {result ? (
        <section style={{ marginTop: '28px' }}>
          <h2>Created session</h2>
          <p>{result.summary}</p>
          <details>
            <summary>Transcript</summary>
            <pre style={{ whiteSpace: 'pre-wrap' }}>{result.transcript}</pre>
          </details>
          <h3>Takeaways</h3>
          <ul>
            {result.takeaways.map((takeaway: any) => (
              <li key={takeaway.id || takeaway.content}>
                <strong>{takeaway.category}</strong>: {takeaway.content} {takeaway.is_action_item ? '(action item)' : ''}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
