import { SocialLogin } from '@capgo/capacitor-social-login';
import { supabase } from '../lib/supabase';
import { Capacitor } from '@capacitor/core';

export async function initializeAppleAuth() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await SocialLogin.initialize({
      apple: {
        clientId: 'com.tiffanymacrae.carry',
      }
    });
  } catch {
    // fail silently
  }
}

export async function signInWithApple(): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await SocialLogin.login({
      provider: 'apple',
      options: {
        scopes: ['email', 'name'],
      }
    });

    if (!result?.result?.idToken) {
      return { success: false, error: 'No token received from Apple' };
    }

    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: result.result.idToken,
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    if (err?.message?.includes('cancel') || err?.message?.includes('dismiss')) {
      return { success: false };
    }
    return { success: false, error: err?.message || 'Sign in failed' };
  }
}
