'use client';
import { Toaster } from 'react-hot-toast';
import { GlobalProvider } from '../../context/GlobalContext';
import Header from './Header';
import { usePathname } from '../../i18n/navigation';
import { Footer } from './Footer';
import ConfigAos from '@/config/Aos';
import { ProgressProvider } from '@bprogress/next/app';
import { AuthProvider } from '@/context/AuthContext';
import { useAuthInterceptor } from '@/hooks/useAuthInterceptor';

export default function Layout({ children, params }) {

  const pathname = usePathname();
  const isAuthRoute = pathname.startsWith('/auth') || pathname.startsWith('/dashboard');


  return (
    <GlobalProvider>
      <AuthProvider>
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
      </AuthProvider>
    </GlobalProvider>
  );
}


function AuthInterceptorWrapper({ children }) {
  useAuthInterceptor(); // ✅ now inside AuthProvider
  return children;
}