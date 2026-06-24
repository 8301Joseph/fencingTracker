'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { login, getAuthState } from '@/lib/authUtils';

export default function LoginPage() {
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState<'Joseph' | 'Sophia' | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const auth = getAuthState();
    if (auth.isAuthenticated) {
      router.push('/');
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedUser) {
      setError('Please select a user');
      return;
    }

    if (!password) {
      setError('Please enter a password');
      return;
    }

    setIsLoading(true);
    const success = login(selectedUser, password);

    if (!success) {
      setError('Incorrect password');
      setPassword('');
      setIsLoading(false);
      return;
    }

    router.push('/');
  };

  return (
    <main
      style={{
        background: 'linear-gradient(135deg, #f8fafb 0%, #f0f4ff 100%)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '24px',
          boxShadow: '0 20px 60px rgba(11, 31, 77, 0.15)',
          padding: '60px 40px',
          maxWidth: '420px',
          width: '100%'
        }}
      >
        <h1
          style={{
            fontSize: '2rem',
            margin: '0 0 12px',
            color: '#0b1f4d',
            fontWeight: 700,
            textAlign: 'center'
          }}
        >
          Fencing Tracker
        </h1>
        <p
          style={{
            fontSize: '0.95rem',
            color: '#666',
            textAlign: 'center',
            margin: '0 0 40px',
            lineHeight: 1.5
          }}
        >
          Track your training sessions and takeaways
        </p>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '32px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.95rem',
                fontWeight: 600,
                color: '#0b1f4d',
                marginBottom: '14px'
              }}
            >
              Who are you?
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              {(['Joseph', 'Sophia'] as const).map((user) => (
                <button
                  key={user}
                  type="button"
                  onClick={() => setSelectedUser(user)}
                  style={{
                    flex: 1,
                    padding: '14px',
                    borderRadius: '12px',
                    border: selectedUser === user ? 'none' : '2px solid #e5e7eb',
                    background: selectedUser === user ? '#0b5fff' : '#f9fafb',
                    color: selectedUser === user ? 'white' : '#0b1f4d',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {user}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                fontSize: '0.95rem',
                fontWeight: 600,
                color: '#0b1f4d',
                marginBottom: '8px'
              }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                border: '2px solid #e5e7eb',
                fontSize: '0.95rem',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s ease'
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#0b5fff')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
              disabled={isLoading}
            />
          </div>

          {error && (
            <div
              style={{
                marginBottom: '20px',
                padding: '12px',
                borderRadius: '10px',
                background: '#fef3f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                fontSize: '0.9rem',
                fontWeight: 500
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '12px',
              border: 'none',
              background: isLoading ? '#ccc' : '#0b5fff',
              color: 'white',
              fontWeight: 600,
              fontSize: '0.95rem',
              cursor: isLoading ? 'default' : 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: isLoading ? 'none' : '0 4px 12px rgba(11, 95, 255, 0.3)'
            }}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </main>
  );
}
