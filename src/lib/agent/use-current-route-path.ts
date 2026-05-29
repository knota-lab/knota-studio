import { matchRoutes, useLocation } from 'react-router-dom';
import routes from '@/routes';

/**
 * Derive the clean route pattern from routes.tsx (not the URL pathname).
 * Uses matchRoutes to reverse-lookup the route config, returning the
 * original pattern string (e.g. '/system/users', not '/system/users?page=1').
 * Layout routes (no `path`) like AuthGuard/MainLayout are skipped.
 */
export const useCurrentRoutePath = (): string | null => {
  const location = useLocation();
  const matches = matchRoutes(routes, location);
  if (!matches) return null;
  const leaf = [...matches].reverse().find((m) => m.route.path != null);
  return leaf?.route.path ?? null;
};
