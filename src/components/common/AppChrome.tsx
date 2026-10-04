'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullScreenApp = pathname === '/'
    || pathname === '/login'
    || pathname.startsWith('/login')
    || pathname.startsWith('/admin')
    || pathname.startsWith('/chat')
    || pathname.startsWith('/dashboard');

  return (
    <>
      {!isFullScreenApp && <Navbar />}
      {isFullScreenApp ? children : <main className="flex-1">{children}</main>}
      {!isFullScreenApp && <Footer />}
    </>
  );
}