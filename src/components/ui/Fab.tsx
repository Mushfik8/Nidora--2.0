'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IoAddOutline } from 'react-icons/io5';
import { motion, AnimatePresence } from 'framer-motion';

export default function Fab() {
  const pathname = usePathname();
  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);


  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      // If scrolled down more than 10px, collapse it.
      if (currentScrollY > lastScrollY && currentScrollY > 10) {
        setIsScrollingDown(true);
      } else if (currentScrollY < lastScrollY) {
        setIsScrollingDown(false);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Don't show FAB on wizard, onboarding, auth pages, or chat threads
  if (pathname.includes('/listings/new') || pathname === '/onboarding' || /^\/messages\/[^/]+$/.test(pathname)) {
    return null;
  }

  return (
    <Link href="/listings/new" className="fixed z-50 bottom-24 right-4 md:bottom-8 md:right-8 group">
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="bg-primary-900 text-white rounded-full flex items-center justify-center card-shadow-lg hover:card-shadow-hover hover:scale-105 active:scale-95 transition-transform backdrop-blur-md bg-opacity-90 overflow-hidden"
        style={{ height: '56px' }}
      >
        <div className="flex items-center px-4">
          <IoAddOutline size={28} className="shrink-0" />
          <AnimatePresence initial={false}>
            {!isScrollingDown && (
              <motion.span
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 'auto', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="font-semibold whitespace-nowrap overflow-hidden origin-left"
              >
                <span className="pl-2">Post Rental</span>
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </Link>
  );
}
