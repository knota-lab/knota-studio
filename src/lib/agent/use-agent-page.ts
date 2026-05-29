import { useEffect } from 'react';
import type { PageCapabilities } from '@/stores/agent';
import { useAgentStore } from '@/stores/agent';
import { useCurrentRoutePath } from './use-current-route-path';

/**
 * Register full page capabilities (meta + tables + forms) with the agent store.
 * Call once per page component at the top level, passing all capabilities upfront.
 * Pages stay registered after unmount for multi-page continuous conversation.
 */
export const useAgentPage = (capabilities: PageCapabilities) => {
  const registerPage = useAgentStore((s) => s.registerPage);
  const routePath = useCurrentRoutePath();

  useEffect(() => {
    const route = routePath ?? capabilities.meta.route;
    registerPage({ ...capabilities, meta: { ...capabilities.meta, route } });
  }, [capabilities, routePath, registerPage]);
};
