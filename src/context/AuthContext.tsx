import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/authService';
import { userDirectoryService } from '../services/userDirectoryService';
import { User } from '../types/api';

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: (idToken: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = authService.getStoredUser();
    if (storedUser && authService.isAuthenticated()) {
      userDirectoryService.add({
        id: storedUser.id,
        name: storedUser.name,
        email: storedUser.email,
        role: storedUser.role,
        courseCodes: storedUser.courseCodes,
      });
      setUser(storedUser);
      authService.getMe()
        .then((u) => {
          userDirectoryService.add({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            courseCodes: u.courseCodes,
          });
          setUser(u);
        })
        .catch(() => {
          authService.logout();
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { user } = await authService.login(email, password);
      userDirectoryService.add({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        courseCodes: user.courseCodes,
      });
      setUser(user);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const loginWithGoogle = async (idToken: string): Promise<boolean> => {
    try {
      const { user } = await authService.loginWithGoogle(idToken);
      userDirectoryService.add({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        courseCodes: user.courseCodes,
      });
      setUser(user);
      return true;
    } catch (error) {
      console.error('Google login error:', error);
      return false;
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const updateUser = (updated: User) => {
    setUser(updated);
    authService.updateStoredUser(updated);
    userDirectoryService.add({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      courseCodes: updated.courseCodes,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginWithGoogle,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
