'use client';

import AuthGuard from '@/components/auth/AuthGuard';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IoShieldCheckmarkOutline, IoPeopleOutline, IoHomeOutline, IoFlagOutline, IoGridOutline } from 'react-icons/io5';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const links = [
    { href: '/admin', label: 'Dashboard', icon: <IoGridOutline size={20} /> },
    { href: '/admin/verifications', label: 'Verifications', icon: <IoShieldCheckmarkOutline size={20} /> },
    { href: '/admin/users', label: 'Users', icon: <IoPeopleOutline size={20} /> },
    { href: '/admin/listings', label: 'Listings', icon: <IoHomeOutline size={20} /> },
    { href: '/admin/reports', label: 'Reports', icon: <IoFlagOutline size={20} /> },
  ];

  return (
    <AuthGuard requireAdmin>
      <div className="flex-1 flex flex-col md:flex-row bg-surface-50">
        
        {/* Admin Sidebar */}
        <aside className="w-full md:w-64 bg-white border-r border-surface-200 shrink-0">
          <div className="p-6 pb-2">
            <h2 className="text-xs font-bold tracking-wider text-surface-400 uppercase">
              Admin Panel
            </h2>
          </div>
          <nav className="p-4 space-y-1 flex md:flex-col overflow-x-auto md:overflow-visible no-scrollbar">
            {links.map(link => (
              <Link 
                key={link.href} 
                href={link.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors whitespace-nowrap
                  ${pathname === link.href 
                    ? 'bg-primary-50 text-primary-700' 
                    : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900'}
                `}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Admin Content */}
        <main className="flex-1 p-6 md:p-10 overflow-y-auto">
          {children}
        </main>

      </div>
    </AuthGuard>
  );
}
