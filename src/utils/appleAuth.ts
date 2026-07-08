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

export async function signInWithApple(): Promise<{ success: boolean; firstName?: string; email?: string; error?: string }> {
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

    const firstName = result?.result?.profile?.givenName ||
                      result?.result?.profile?.name?.split(' ')[0] ||
                      null;
    const email = result?.result?.profile?.email || null;

    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: result.result.idToken,
    });

    if (error) return { success: false, error: error.message };
    return { success: true, firstName: firstName || undefined, email: email || undefined };
  } catch (err: any) {
    if (err?.message?.includes('cancel') || err?.message?.includes('dismiss')) {
      return { success: false };
    }
    return { success: false, error: err?.message || 'Sign in failed' };
  }
}
