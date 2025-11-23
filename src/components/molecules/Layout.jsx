'use client';
import toast, { Toaster, useToasterStore } from 'react-hot-toast';
import { GlobalProvider } from '../../context/GlobalContext';
import Header from './Header';
import { usePathname } from '../../i18n/navigation';
import { Footer } from './Footer';
import ConfigAos from '@/config/Aos';
import { ProgressProvider } from '@bprogress/next/app';
import { AuthProvider } from '@/context/AuthContext';
import { useAuthInterceptor } from '@/hooks/useAuthInterceptor';
import { useEffect } from 'react';
import { NotificationProvider } from '@/context/NotificationContext';
import { SocketProvider } from '@/context/SocketContext';

export default function Layout({ children, params }) {

  const pathname = usePathname();
  const isAuthRoute = pathname.startsWith('/auth') || pathname.startsWith('/dashboard');

  // Enforce toast limit
  const { toasts } = useToasterStore()
  const TOAST_LIMIT = 5

  useEffect(() => {
    toasts
      .filter(t => t.visible) // Only consider visible toasts
      .filter((_, i) => i >= TOAST_LIMIT) // Is toast index over limit
      .forEach(t => toast.dismiss(t.id)) // Dismiss – Use toast.remove(t.id) removal without animation
  }, [toasts])

  return (
    <AuthProvider>
      <NotificationProvider>
        <SocketProvider>
          <GlobalProvider>
            <AuthInterceptorWrapper>
              <ProgressProvider
                height="2px"
                color="#0070f3"
                options={{ showSpinner: false }}
                shallowRouting
              >
                {!isAuthRoute && <Header />}
                <div className='  ' >{children}</div>
                {!isAuthRoute && <Footer />}
                <ConfigAos />
                <Toaster position='top-center' />
              </ProgressProvider>
            </AuthInterceptorWrapper>
          </GlobalProvider>
        </SocketProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}


function AuthInterceptorWrapper({ children }) {
  useAuthInterceptor(); // ✅ now inside AuthProvider
  return children;
}