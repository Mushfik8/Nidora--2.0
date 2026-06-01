'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IoHomeOutline, IoHome, IoHeartOutline, IoHeart, IoChatbubbleOutline, IoChatbubble, IoPersonOutline, IoPerson } from 'react-icons/io5';

export default function BottomNav() {
  const pathname = usePathname();

  // Don't show bottom nav on these routes (e.g. desktop specific, auth, or listing creation wizard)
  if (pathname.includes('/listings/new') || pathname === '/onboarding') {
    return null;
  }

  const navItems = [
    { href: '/', label: 'Home', icon: IoHomeOutline, activeIcon: IoHome },
    { href: '/favorites', label: 'Saved', icon: IoHeartOutline, activeIcon: IoHeart },
    { href: '/messages', label: 'Messages', icon: IoChatbubbleOutline, activeIcon: IoChatbubble },
    { href: '/profile', label: 'Profile', icon: IoPersonOutline, activeIcon: IoPerson },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-surface-200 z-40 pb-safe">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = isActive ? item.activeIcon : item.icon;
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                isActive ? 'text-primary-900' : 'text-surface-500 hover:text-surface-900'
              }`}
            >
              <Icon size={24} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
