'use client';
import { Toaster } from 'react-hot-toast';
import { GlobalProvider } from '../../context/GlobalContext';
import Header from './Header';
import { usePathname, useRouter } from '../../i18n/navigation';
import { Footer } from './Footer';
import ConfigAos from '@/config/Aos';

export default function Layout({ children, params }) {
  const pathname = usePathname();
  const isAuthRoute = pathname.startsWith('/auth') || pathname.startsWith('/dashboard');


  return (
    <GlobalProvider>
      {!isAuthRoute && <Header />}
      <div className='  ' >{children}</div>
      {!isAuthRoute && <Footer />}
      <ConfigAos />
      <Toaster position='top-center' />
    </GlobalProvider>
  );
}
