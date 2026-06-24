const PASSWORD = '123';

export interface AuthState {
  user: 'Joseph' | 'Sophia' | null;
  isAuthenticated: boolean;
}

export function getAuthState(): AuthState {
  if (typeof window === 'undefined') {
    return { user: null, isAuthenticated: false };
  }

  const stored = localStorage.getItem('trainingTrackerAuth');
  if (!stored) {
    return { user: null, isAuthenticated: false };
  }

  try {
    const parsed = JSON.parse(stored);
    return {
      user: parsed.user,
      isAuthenticated: !!parsed.user
    };
  } catch {
    return { user: null, isAuthenticated: false };
  }
}

export function login(user: 'Joseph' | 'Sophia', password: string): boolean {
  if (password !== PASSWORD) {
    return false;
  }

  localStorage.setItem('trainingTrackerAuth', JSON.stringify({ user }));
  return true;
}

export function logout(): void {
  localStorage.removeItem('trainingTrackerAuth');
}
