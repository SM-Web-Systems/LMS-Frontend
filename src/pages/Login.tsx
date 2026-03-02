import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useAuth } from '../context/useAuth';
import Input from '../components/Input';
import Button from '../components/Button';
import { GraduationCap, AlertCircle } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    const token = credentialResponse.credential;
    if (!token) return;
    setError('');
    setLoading(true);
    try {
      const success = await loginWithGoogle(token);
      if (success) navigate('/');
      else setError('Google sign-in failed. Please try again.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google sign-in was cancelled or failed.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        navigate('/');
      } else {
        setError('Invalid email or password');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-dark to-primary-medium flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo and Title — SM Web Systems style: dark hero, white text */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 rounded-full mb-4 shadow-lg border border-white/20">
            <GraduationCap className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">SM Web Systems</h1>
          <p className="text-white/80">Learning Management System</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-lg shadow-card border border-neutral-200 p-8">
          <h2 className="text-2xl font-bold text-neutral-800 mb-6">Sign In</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5 shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              label="Email Address"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              type="password"
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>

            {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
              <div className="mt-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-neutral-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-2 text-neutral-500">Or</span>
                  </div>
                </div>
                <div className="mt-4 flex justify-center">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    useOneTap={false}
                    theme="outline"
                    size="large"
                    text="signin_with"
                    shape="rectangular"
                  />
                </div>
              </div>
            )}
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 pt-6 border-t border-neutral-200">
            <p className="text-sm font-medium text-neutral-700 mb-2">Demo Credentials:</p>
            <div className="space-y-2 text-sm text-neutral-600">
              <div className="bg-neutral-50 p-2 rounded border border-neutral-200">
                <p className="font-medium text-neutral-800">Admin Account:</p>
                <p>Email: admin@smwebsystems.com</p>
                <p>Password: admin123</p>
              </div>
              <div className="bg-neutral-50 p-2 rounded border border-neutral-200">
                <p className="font-medium text-neutral-800">Student Account:</p>
                <p>Email: student@smwebsystems.com</p>
                <p>Password: student123</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
