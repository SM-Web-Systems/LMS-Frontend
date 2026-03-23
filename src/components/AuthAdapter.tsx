import React from 'react';
import { AuthProvider } from '../context/AuthContext';

/**
 * Auth wrapper for the WordPress-embedded LMS.
 * Renders the AuthProvider which handles WordPress JWT (via postMessage)
 * and backend JWT (via email/password login).
 */
export function AuthAdapter({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
