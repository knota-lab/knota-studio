// Thin wrapper that passes throwError=true so useRequest's error state is populated
// but the global toast is suppressed (caller decides how to show the error)
//
// Usage:
//   const { data, loading, error } = useApi(getUsers, { throwError: true })
//   const { data, loading } = useApi(() => get('/users'))  // auto-toast on error

// Re-export everything from ahooks + client
export { useRequest } from 'ahooks';
export * from './client';
