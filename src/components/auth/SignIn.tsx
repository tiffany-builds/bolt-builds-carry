import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Eye, EyeOff } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { initializeAppleAuth, signInWithApple } from '../../utils/appleAuth';

interface SignInProps {
  onSuccess: () => void;
}

type Mode = 'signin' | 'signup' | 'forgot';

export function SignIn({ onSuccess }: SignInProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeAppleAuth();
  }, []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mode, setMode] = useState<Mode>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleAppleSignIn = async () => {
    setAppleLoading(true);
    setError(null);
    const result = await signInWithApple();
    setAppleLoading(false);
    if (result.success) {
      onSuccess();
    } else if (result.error) {
      setError(result.error);
    }
  };

  const validateForm = () => {
    if (!email || !password) {
      setError('Please add your email and password');
      return false;
    }

    if (mode === 'signup') {
      if (password.length < 8) {
        setError('Password needs to be at least 8 characters');
        return false;
      }
      if (password !== confirmPassword) {
        setError("Those passwords don't match — want to try again?");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (mode === 'forgot') {
      if (!email) {
        setError('Please add your email');
        return;
      }
      setIsLoading(true);
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        setSuccessMessage("Check your email — we've sent a reset link.");
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send reset link');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) {
          if (error.message.includes('already registered')) {
            setError('Looks like you already have an account — try signing in');
          } else {
            throw error;
          }
        } else {
          setSuccessMessage("Check your email — we've sent you a confirmation link.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setError("We didn't recognise those details — want to try again?");
          } else if (error.message.includes('Email not confirmed')) {
            setError("We didn't recognise those details — want to try again?");
          } else if (!email.includes('@')) {
            setError('Please check your email address');
          } else {
            throw error;
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#E8DDD0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 20px'
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{
            fontFamily: 'Fraunces, serif',
            fontStyle: 'italic',
            fontWeight: 200,
            fontSize: '42px',
            color: '#2C2420',
            marginBottom: '8px'
          }}>
            {mode === 'forgot' ? 'Reset your password.' : mode === 'signup' ? "Let's get you set up." : 'Welcome back.'}
          </h1>
          <p style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '15px',
            color: '#9E8E80',
            fontWeight: 300
          }}>
            {mode === 'forgot' ? "We'll send you a link." : mode === 'signup' ? 'Create your Carry account.' : 'Good to have you here.'}
          </p>
        </div>

        {successMessage && (
          <div style={{
            background: '#FDF9F4',
            border: '1px solid #E8DDD0',
            borderRadius: '16px',
            padding: '16px',
            marginBottom: '24px'
          }}>
            <p style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
              color: '#2C2420',
              fontWeight: 300,
              margin: 0
            }}>{successMessage}</p>
          </div>
        )}

        {Capacitor.isNativePlatform() && mode !== 'forgot' && (
          <div style={{ marginBottom: '24px' }}>
            <button
              onClick={handleAppleSignIn}
              disabled={appleLoading}
              style={{
                width: '100%',
                background: '#2C2420',
                color: '#FDF9F4',
                border: 'none',
                borderRadius: '24px',
                padding: '16px',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '15px',
                fontWeight: 500,
                cursor: appleLoading ? 'not-allowed' : 'pointer',
                opacity: appleLoading ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                marginBottom: '16px',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              {appleLoading ? 'Signing in...' : 'Continue with Apple'}
            </button>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '24px',
            }}>
              <div style={{ flex: 1, height: '1px', background: '#E8DDD0' }} />
              <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#9E8E80' }}>or</span>
              <div style={{ flex: 1, height: '1px', background: '#E8DDD0' }} />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ marginBottom: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email"
              style={{
                width: '100%',
                background: '#FDF9F4',
                border: '1px solid #E8DDD0',
                borderRadius: '24px',
                padding: '14px 20px',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '15px',
                color: '#2C2420',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {mode !== 'forgot' && (
            <>
              <div style={{ marginBottom: '16px', position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'Choose a password' : 'Your password'}
                  style={{
                    width: '100%',
                    background: '#FDF9F4',
                    border: '1px solid #E8DDD0',
                    borderRadius: '24px',
                    padding: '14px 50px 14px 20px',
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '15px',
                    color: '#2C2420',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showPassword ? <EyeOff size={18} color="#9E8E80" /> : <Eye size={18} color="#9E8E80" />}
                </button>
              </div>

              {mode === 'signup' && (
                <div style={{ marginBottom: '16px', position: 'relative' }}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    style={{
                      width: '100%',
                      background: '#FDF9F4',
                      border: '1px solid #E8DDD0',
                      borderRadius: '24px',
                      padding: '14px 50px 14px 20px',
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '15px',
                      color: '#2C2420',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {showConfirmPassword ? <EyeOff size={18} color="#9E8E80" /> : <Eye size={18} color="#9E8E80" />}
                  </button>
                </div>
              )}
            </>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              background: mode === 'signup' ? '#C4714A' : '#2C2420',
              color: mode === 'signup' ? '#FFFFFF' : '#FDF9F4',
              border: 'none',
              borderRadius: '24px',
              padding: '16px',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '15px',
              fontWeight: 500,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
              transition: 'all 0.2s',
              marginBottom: '16px'
            }}
          >
            {isLoading ? 'One moment...' : mode === 'forgot' ? 'Send reset link' : mode === 'signup' ? 'Create account' : 'Sign in'}
          </button>

          {error && (
            <p style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
              color: '#C4714A',
              fontWeight: 300,
              margin: '0 0 16px 0',
              textAlign: 'center'
            }}>{error}</p>
          )}
        </form>

        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {mode === 'signin' && (
            <>
              <button
                onClick={() => {
                  setMode('forgot');
                  setError(null);
                  setSuccessMessage(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '13px',
                  color: '#9E8E80',
                  cursor: 'pointer',
                  fontWeight: 300
                }}
              >
                Forgot your password?
              </button>
              <button
                onClick={() => {
                  setMode('signup');
                  setError(null);
                  setSuccessMessage(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '13px',
                  color: '#9E8E80',
                  cursor: 'pointer',
                  fontWeight: 300
                }}
              >
                New to Carry? Create an account →
              </button>
            </>
          )}
          {mode === 'signup' && (
            <button
              onClick={() => {
                setMode('signin');
                setError(null);
                setSuccessMessage(null);
              }}
              style={{
                background: 'none',
                border: 'none',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '13px',
                color: '#9E8E80',
                cursor: 'pointer',
                fontWeight: 300
              }}
            >
              Already have an account? Sign in →
            </button>
          )}
          {mode === 'forgot' && (
            <button
              onClick={() => {
                setMode('signin');
                setError(null);
                setSuccessMessage(null);
              }}
              style={{
                background: 'none',
                border: 'none',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '13px',
                color: '#9E8E80',
                cursor: 'pointer',
                fontWeight: 300
              }}
            >
              ← Back to sign in
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
