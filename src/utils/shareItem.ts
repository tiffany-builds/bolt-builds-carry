import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

export async function shareItem(item: {
  title: string;
  description?: string | null;
  emoji?: string | null;
  date?: string | null;
  time?: string | null;
  category?: string;
}): Promise<void> {
  try {
    const emoji = item.emoji || '';
    const dateStr = item.date
      ? new Date(item.date + 'T12:00:00').toLocaleDateString('en-GB', {
          weekday: 'short', day: 'numeric', month: 'short'
        })
      : null;
    const timeStr = item.time
      ? new Date(`2000-01-01T${item.time}`).toLocaleTimeString('en-GB', {
          hour: 'numeric', minute: '2-digit', hour12: true
        })
      : null;
    const when = dateStr && timeStr
      ? `${dateStr} · ${timeStr}`
      : dateStr || null;
    const lines = [
      `${emoji} ${item.title}`,
      item.description || '',
      when ? `📅 ${when}` : '',
      item.category ? `📁 ${item.category}` : '',
      '',
      'Sent via Carry — carry-the-app.com',
    ].filter(Boolean);
    const text = lines.join('\n');
    if (Capacitor.isNativePlatform()) {
      await Share.share({
        title: item.title,
        text,
        dialogTitle: 'Share via',
      });
    } else {
      await navigator.clipboard.writeText(text);
    }
  } catch {
    // User cancelled share — fail silently
  }
}
