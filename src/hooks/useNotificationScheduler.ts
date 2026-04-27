import { useEffect } from 'react';
import { startNotificationScheduler } from '@/notifications/scheduler';

/**
 * Mounts the notification scheduler for the lifetime of the app.
 *
 * The scheduler internally short-circuits when notifications are disabled
 * or permission isn't granted, so it's safe to mount unconditionally —
 * the cost is one no-op tick per minute.
 */
export function useNotificationScheduler(): void {
  useEffect(() => {
    const stop = startNotificationScheduler();
    return stop;
  }, []);
}
