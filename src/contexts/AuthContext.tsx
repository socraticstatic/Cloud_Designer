import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, AUTH_MODE, IS_OFFLINE_CAPABLE } from '../lib/supabase';

const GATE_KEY = 'att_nb_user';

interface AuthUser {
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  authMode: 'supabase' | 'gate';
  requestCode: (email: string) => Promise<{ error?: string }>;
  verifyCode: (email: string, code: string) => Promise<{ error?: string }>;
  signIn: (email: string) => void; // gate-mode only
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (IS_OFFLINE_CAPABLE) return { email: 'offline@att.com' };
    if (AUTH_MODE !== 'gate') return null;
    try {
      const raw = localStorage.getItem(GATE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(AUTH_MODE === 'supabase' && !IS_OFFLINE_CAPABLE);

  useEffect(() => {
    if (AUTH_MODE !== 'supabase' || IS_OFFLINE_CAPABLE) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user?.email ? { email: session.user.email } : null);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user?.email ? { email: session.user.email } : null);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const requestCode = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({ email: email.toLowerCase().trim() });
    if (error) {
      if (error.status === 403) return { error: 'Only @att.com email addresses are authorized' };
      if (error.status === 429) return { error: 'Too many requests. Wait a minute and try again.' };
      return { error: error.message || 'Failed to send code' };
    }
    return {};
  };

  const verifyCode = async (email: string, code: string) => {
    const { error } = await supabase.auth.verifyOtp({
      email: email.toLowerCase().trim(),
      token: code.trim(),
      type: 'email',
    });
    if (error) return { error: 'Invalid or expired code. Request a new one.' };
    return {};
  };

  const signIn = (email: string) => {
    if (AUTH_MODE !== 'gate') return;
    const u = { email: email.toLowerCase().trim() };
    localStorage.setItem(GATE_KEY, JSON.stringify(u));
    setUser(u);
  };

  const signOut = async () => {
    if (AUTH_MODE === 'supabase') await supabase.auth.signOut();
    localStorage.removeItem(GATE_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, authMode: AUTH_MODE, requestCode, verifyCode, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
