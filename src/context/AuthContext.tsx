import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getWordPressAuthToken, clearWordPressAuthToken } from '../services/api';
import { User } from '../types/api';
import api from '../services/api';

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Auth provider for the WordPress-embedded LMS.
 * Authenticates via WordPress JWT (delivered by postMessage) or
 * backend JWT (from email/password login stored in localStorage).
 */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    const onWpAuth = () => setNonce((n) => n + 1);
    window.addEventListener('lms:wp-auth-updated', onWpAuth);
    return () => window.removeEventListener('lms:wp-auth-updated', onWpAuth);
  }, []);

  // In iframe mode, poll briefly for the postMessage token to arrive
  useEffect(() => {
    const inIframe = typeof window !== 'undefined' && window.parent !== window;
    if (!inIframe) return;

    if (getWordPressAuthToken() || localStorage.getItem('token')) {
      setNonce((n) => n + 1);
      return;
    }

    let ticks = 0;
    const id = window.setInterval(() => {
      ticks += 1;
      if (getWordPressAuthToken() || localStorage.getItem('token')) {
        setNonce((n) => n + 1);
        window.clearInterval(id);
      } else if (ticks > 50) {
        window.clearInterval(id);
        setIsLoading(false);
      }
    }, 100);
    return () => window.clearInterval(id);
  }, []);

  // On first mount (non-iframe), check if a token is already in localStorage
  useEffect(() => {
    const inIframe = typeof window !== 'undefined' && window.parent !== window;
    if (inIframe) return;

    const token = localStorage.getItem('token');
    if (token) {
      setNonce((n) => n + 1);
    } else {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (nonce === 0) return;

    const hasToken = getWordPressAuthToken() || localStorage.getItem('token');
    if (!hasToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    (async () => {
      try {
        const res = await api.get('/auth/me');
        if (!cancelled && res.data.success && res.data.data) {
          setUser(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
        if (!cancelled) {
          localStorage.removeItem('token');
          localStorage.removeItem('auth_source');
          setUser(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [nonce]);

  const logout = useCallback(async () => {
    clearWordPressAuthToken();
    localStorage.removeItem('token');
    localStorage.removeItem('auth_source');
    setUser(null);
  }, []);

  const updateUser = useCallback((updated: User) => {
    setUser(updated);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
