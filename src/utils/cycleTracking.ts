import { supabase } from '../lib/supabase';
export async function logCycleStart(userId: string): Promise<void> {
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  await supabase.from('cycle_logs').insert({
    user_id: userId,
    period_start: dateStr,
  });
  await updateAverageCycleLength(userId);
}
async function updateAverageCycleLength(userId: string): Promise<void> {
  const { data: logs } = await supabase
    .from('cycle_logs')
    .select('period_start')
    .eq('user_id', userId)
    .order('period_start', { ascending: true });
  if (!logs || logs.length < 2) return;
  const gaps = [];
  for (let i = 1; i < logs.length; i++) {
    const prev = new Date(logs[i-1].period_start);
    const curr = new Date(logs[i].period_start);
    const diff = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
    if (diff > 15 && diff < 60) gaps.push(diff);
  }
  if (gaps.length === 0) return;
  const avg = Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
  await supabase.from('profiles')
    .update({ avg_cycle_length: avg })
    .eq('id', userId);
}
export async function scheduleCycleReminder(userId: string): Promise<void> {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('avg_cycle_length, cycle_tracking')
      .eq('id', userId)
      .single();
    if (!profile?.cycle_tracking) return;
    const { data: logs } = await supabase
      .from('cycle_logs')
      .select('period_start')
      .eq('user_id', userId)
      .order('period_start', { ascending: false })
      .limit(1);
    if (!logs || logs.length === 0) return;
    const lastPeriod = new Date(logs[0].period_start);
    const cycleLength = profile.avg_cycle_length || 28;
    const nextPeriod = new Date(lastPeriod);
    nextPeriod.setDate(nextPeriod.getDate() + cycleLength - 3);
    nextPeriod.setHours(21, 0, 0, 0);
    const now = new Date();
    if (nextPeriod <= now) return;
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.schedule({
      notifications: [{
        id: 4001,
        title: 'Carry 🧡',
        body: 'Just a heads up — your period might be starting in a few days.',
        schedule: { at: nextPeriod },
        sound: 'Hello.caf',
      }]
    });
  } catch {
    // fail silently
  }
}
export async function isCycleTrackingEnabled(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('profiles')
    .select('cycle_tracking')
    .eq('id', userId)
    .single();
  return data?.cycle_tracking || false;
}
export async function enableCycleTracking(userId: string): Promise<void> {
  await supabase
    .from('profiles')
    .update({ cycle_tracking: true })
    .eq('id', userId);
}
