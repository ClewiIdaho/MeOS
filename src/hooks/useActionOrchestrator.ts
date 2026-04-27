import { useEffect } from 'react';
import { startActionOrchestrator } from '@/engine/actionOrchestrator';

/**
 * Mounts the action orchestrator for the lifetime of the component.
 * Mount once at the app root so module events have listeners attached.
 */
export function useActionOrchestrator(): void {
  useEffect(() => {
    const teardown = startActionOrchestrator();
    return () => {
      teardown();
    };
  }, []);
}
