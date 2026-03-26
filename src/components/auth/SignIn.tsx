import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Eye, EyeOff } from 'lucide-react';

interface SignInProps {
  onSuccess: () => void;
}

type Mode = 'signin' | 'signup' | 'forgot';

export function SignIn({ onSuccess }: SignInProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mode, setMode] = useState<Mode>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
            {isLoading ? 'Please wait...' : mode === 'forgot' ? 'Send reset link' : mode === 'signup' ? 'Create account' : 'Sign in'}
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
