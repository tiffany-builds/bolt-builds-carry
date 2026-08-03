import { registerPlugin } from '@capacitor/core';
import { Capacitor } from '@capacitor/core';

interface HealthKitPlugin {
  requestPermission(): Promise<{ granted: boolean }>;
  logMindfulSession(options: { minutes: number }): Promise<void>;
}

const HealthKit = registerPlugin<HealthKitPlugin>('HealthKit');

export async function requestHealthKitPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const { granted } = await HealthKit.requestPermission();
    return granted;
  } catch {
    return false;
  }
}

export async function logMindfulMinutes(minutes: number): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await HealthKit.logMindfulSession({ minutes });
  } catch {
    // fail silently
  }
}

export function isHealthKitEnabled(): boolean {
  return localStorage.getItem('carry_healthkit_enabled') === 'true';
}

export function setHealthKitEnabled(enabled: boolean): void {
  localStorage.setItem('carry_healthkit_enabled', String(enabled));
}
