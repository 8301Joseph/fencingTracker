'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

const weapons = ['', 'foil', 'epee', 'sabre'];
const sessionTypes = ['', 'lesson', 'open_fencing', 'drills', 'competition', 'conditioning', 'other'];

type SubmitState = 'idle' | 'recording' | 'uploading' | 'complete';

export default function RecordPage() {
  const [status, setStatus] = useState<SubmitState>('idle');
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [sessionDate, setSessionDate] = useState('');
  const [weapon, setWeapon] = useState('');
  const [sessionType, setSessionType] = useState('');
  const [duration, setDuration] = useState('');
  const [club, setClub] = useState('');
  const [coach, setCoach] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [timer, setTimer] = useState(0);
  const timerIdRef = useRef<number | null>(null);

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
    if (sessionDate) data.append('session_date', sessionDate);
    if (weapon) data.append('weapon', weapon);
    if (sessionType) data.append('session_type', sessionType);
    if (duration) data.append('duration_minutes', duration);
    if (club) data.append('club', club);
    if (coach) data.append('coach', coach);

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
    <main>
      <h1>Record Session</h1>
      <nav style={{ marginBottom: '18px' }}>
        <Link href="/">Home</Link> · <Link href="/history">History</Link>
      </nav>

      <section style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button type="button" onClick={status === 'recording' ? stopRecording : startRecording}>
            {status === 'recording' ? 'Stop Recording' : 'Start Recording'}
          </button>
          <span>{status === 'recording' ? `Recording… ${timer}s` : recordingUrl ? `Ready to submit (${timer}s)` : 'No recording yet'}</span>
        </div>

        {recordingUrl ? (
          <audio controls src={recordingUrl} style={{ marginTop: '12px', width: '100%' }} />
        ) : null}
      </section>

      <section style={{ marginBottom: '24px' }}>
        <h2>Session details</h2>
        <label>
          Date
          <input type="date" value={sessionDate} onChange={(event) => setSessionDate(event.target.value)} />
        </label>
        <label>
          Weapon
          <select value={weapon} onChange={(event) => setWeapon(event.target.value)}>
            {weapons.map((option) => (
              <option key={option} value={option}>{option || 'Choose weapon'}</option>
            ))}
          </select>
        </label>
        <label>
          Session type
          <select value={sessionType} onChange={(event) => setSessionType(event.target.value)}>
            {sessionTypes.map((option) => (
              <option key={option} value={option}>{option || 'Choose session type'}</option>
            ))}
          </select>
        </label>
        <label>
          Duration (minutes)
          <input type="number" min="1" value={duration} onChange={(event) => setDuration(event.target.value)} />
        </label>
        <label>
          Club
          <input value={club} onChange={(event) => setClub(event.target.value)} placeholder="Optional" />
        </label>
        <label>
          Coach
          <input value={coach} onChange={(event) => setCoach(event.target.value)} placeholder="Optional" />
        </label>
      </section>

      <button type="button" onClick={submitSession} disabled={status === 'uploading' || status === 'recording'}>
        {status === 'uploading' ? 'Submitting…' : 'Submit Session'}
      </button>
      {error ? (
        <div style={{ marginTop: 12 }}>
          <p style={{ color: 'red' }}>{error}</p>
          <div style={{ display: 'flex', gap: '8px', marginTop: 8 }}>
            <button type="button" onClick={() => { setError(null); startRecording(); }}>
              Retry permission
            </button>
            <button type="button" onClick={() => window.location.reload()}>
              Reload page
            </button>
          </div>
          <details style={{ marginTop: 8 }}>
            <summary style={{ cursor: 'pointer' }}>Permission help</summary>
            <ol style={{ marginTop: 8 }}>
              <li>Allow the microphone in the browser prompt when asked.</li>
              <li>If you blocked it, click the lock icon in the address bar → Site settings → Microphone → Allow.</li>
              <li>On macOS: System Settings → Privacy & Security → Microphone → enable your browser.</li>
              <li>After changing settings, click <strong>Reload page</strong> then <strong>Retry permission</strong>.</li>
            </ol>
          </details>
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
