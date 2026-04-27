import { useEffect } from 'react';
import { eventBus } from '@/utils/events';
import { hapticTap, hapticAck, hapticReserved } from '@/utils/haptics';

/**
 * Subscribes once to module/engine events and routes them to the right haptic
 * intensity. Mounting at the App root means every screen benefits without
 * threading vibration into individual tap handlers.
 */
export function useHaptics(): void {
  useEffect(() => {
    const offs: Array<() => void> = [];

    offs.push(eventBus.on('task:completed', () => hapticTap()));
    offs.push(eventBus.on('bill:paid', () => hapticTap()));
    offs.push(eventBus.on('workout:logged', () => hapticAck()));
    offs.push(eventBus.on('goal:contribution', () => hapticTap()));
    offs.push(eventBus.on('goal:milestone', () => hapticAck()));

    offs.push(eventBus.on('pr:set', () => hapticReserved()));
    offs.push(eventBus.on('goal:completed', () => hapticReserved()));
    offs.push(eventBus.on('level:up', () => hapticReserved()));
    offs.push(
      eventBus.on('streak:updated', (e) => {
        if (e.isMilestone) hapticReserved();
      }),
    );

    return () => {
      for (const off of offs) off();
    };
  }, []);
}
