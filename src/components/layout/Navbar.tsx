'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import Button from '../ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { IoMenu, IoClose } from 'react-icons/io5';

export default function Navbar() {
  const { user, loading, signInWithGoogle, signOut, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full glass-strong border-b border-surface-200">
        <div className="page-container h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center text-white font-bold text-lg">
              N
            </div>
            <span className="font-[var(--font-heading)] font-bold text-xl tracking-tight text-surface-900">
              Nidora
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className="text-sm font-medium text-surface-600 hover:text-surface-900 transition-colors"
            >
              Browse
            </Link>

            {!loading && user && (
              <>
                <Link
                  href="/favorites"
                  className="text-sm font-medium text-surface-600 hover:text-surface-900 transition-colors"
                >
                  Favorites
                </Link>
                <Link
                  href="/messages"
                  className="text-sm font-medium text-surface-600 hover:text-surface-900 transition-colors"
                >
                  Messages
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    Admin
                  </Link>
                )}
              </>
            )}
          </nav>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-4">
            {!loading && (
              <>
                {user ? (
                  <div className="flex items-center gap-4">
                    <Link href="/listings/new">
                      <Button variant="outline" size="sm">
                        Post Listing
                      </Button>
                    </Link>
                    <Link href="/profile">
                      <img
                        src={user.photo || `https://ui-avatars.com/api/?name=${user.name}&background=0D8ABC&color=fff`}
                        alt={user.name}
                        className="w-9 h-9 rounded-full object-cover border border-surface-200 cursor-pointer"
                        referrerPolicy="no-referrer"
                      />
                    </Link>
                  </div>
                ) : (
                  <Button variant="primary" size="sm" onClick={signInWithGoogle}>
                    Continue with Google
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -mr-2 text-surface-600 hover:text-surface-900"
            >
              <IoMenu size={24} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 bg-white flex flex-col"
          >
            <div className="h-16 px-4 flex items-center justify-between border-b border-surface-200">
              <span className="font-[var(--font-heading)] font-bold text-lg">
                Menu
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 -mr-2 text-surface-600"
              >
                <IoClose size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-6">
              {!loading && !user && (
                <Button variant="primary" fullWidth onClick={() => {
                  signInWithGoogle();
                  setMobileMenuOpen(false);
                }}>
                  Continue with Google
                </Button>
              )}

              <nav className="flex flex-col gap-4 text-lg font-medium text-surface-800">
                <Link href="/" onClick={() => setMobileMenuOpen(false)}>
                  Browse Listings
                </Link>
                
                {user && (
                  <>
                    <Link href="/favorites" onClick={() => setMobileMenuOpen(false)}>
                      Favorites
                    </Link>
                    <Link href="/messages" onClick={() => setMobileMenuOpen(false)}>
                      Messages
                    </Link>
                    <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
                      My Profile
                    </Link>
                    <Link href="/listings/new" onClick={() => setMobileMenuOpen(false)}>
                      Post Listing
                    </Link>
                    {isAdmin && (
                      <Link href="/admin" className="text-primary-600" onClick={() => setMobileMenuOpen(false)}>
                        Admin Dashboard
                      </Link>
                    )}
                  </>
                )}
              </nav>

              {user && (
                <div className="mt-auto pt-6 border-t border-surface-200">
                  <div className="flex items-center gap-3 mb-6">
                    <img
                      src={user.photo || `https://ui-avatars.com/api/?name=${user.name}&background=0D8ABC&color=fff`}
                      alt={user.name}
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <p className="font-semibold text-surface-900">{user.name}</p>
                      <p className="text-sm text-surface-500">{user.email}</p>
                    </div>
                  </div>
                  <Button variant="outline" fullWidth onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                  }}>
                    Sign Out
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
