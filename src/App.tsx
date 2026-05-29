import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { I18nProvider } from '@/i18n';
import routes from '@/routes';
import { AuthProvider } from '@/stores/auth';

const router = createBrowserRouter(routes);

const App = () => (
  <I18nProvider initialNamespaces={['CommonError']}>
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors />
    </AuthProvider>
  </I18nProvider>
);

export default App;
