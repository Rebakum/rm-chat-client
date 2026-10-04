'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { user } = useAuth();
  const destination = user?.role === 'ADMIN' || user?.role === 'MODERATOR' ? '/dashboard' : '/chat';

  const links = user
    ? [
        { href: '/', label: 'Home' },
        { href: destination, label: destination === '/dashboard' ? 'Administration' : 'Conversations' },
      ]
    : [{ href: '/login', label: 'Sign In' }];

  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <Link href="/" aria-label="Rahmah Institute home" className="inline-flex rounded bg-white px-2 py-1">
              <Image src="/Rahmah-Institute-Logo.png" alt="Rahmah Institute" width={150} height={32} className="h-8 w-auto object-contain" />
            </Link>
            <p className="text-gray-600 text-sm leading-relaxed">
              A secure communication space for Rahmah Institute students and teachers.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Quick Links</h4>
            <nav aria-label="Footer navigation">
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">
            &copy; {currentYear} Rahmah Institute. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
