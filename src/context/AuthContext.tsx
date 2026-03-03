import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth as useClerkAuth, useUser as useClerkUser } from '@clerk/clerk-react';
import { setTokenGetter } from '../services/api';
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

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isLoaded, isSignedIn, getToken, signOut } = useClerkAuth();
  const { user: clerkUser } = useClerkUser();
  const [user, setUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    setTokenGetter(getToken);
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      setUser(null);
      setIsSyncing(false);
      return;
    }

    let cancelled = false;

    const fetchUser = async () => {
      setIsSyncing(true);
      try {
        const token = await getToken();
        if (!token || cancelled) return;

        const response = await api.get('/auth/me');
        if (!cancelled && response.data.success && response.data.data) {
          setUser(response.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsSyncing(false);
      }
    };

    fetchUser();

    return () => { cancelled = true; };
  }, [isLoaded, isSignedIn, clerkUser, getToken]);

  const logout = useCallback(async () => {
    await signOut();
    setUser(null);
  }, [signOut]);

  const updateUser = useCallback((updated: User) => {
    setUser(updated);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user && !!isSignedIn,
        isLoading: !isLoaded || isSyncing,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
