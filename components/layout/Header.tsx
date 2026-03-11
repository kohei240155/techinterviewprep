'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { t } from '@/lib/i18n';
import { createClient } from '@/lib/supabase/client';
import LanguageToggle from '@/components/layout/LanguageToggle';
import DarkModeToggle from '@/components/layout/DarkModeToggle';

const Header = () => {
  const { user, isAdmin, isLoading } = useAuth();
  const { language } = useLanguage();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <header className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold">
            TechPrep
          </Link>
          <div className="hidden items-center gap-4 md:flex">
            <Link
              href="/"
              className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            >
              {t('nav.home', language)}
            </Link>
            <Link
              href="/dashboard"
              className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            >
              {t('nav.dashboard', language)}
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              >
                {t('nav.admin', language)}
              </Link>
            )}
          </div>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <LanguageToggle />
          <DarkModeToggle />
          {!isLoading && (
            <>
              {user ? (
                <div className="flex items-center gap-3">
                  {user.user_metadata?.avatar_url && (
                    <img
                      src={user.user_metadata.avatar_url as string}
                      alt=""
                      className="h-8 w-8 rounded-full"
                    />
                  )}
                  <button
                    onClick={handleLogout}
                    className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                  >
                    {t('common.logout', language)}
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
                >
                  {t('common.login', language)}
                </Link>
              )}
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-md p-2 hover:bg-gray-100 dark:hover:bg-gray-800 md:hidden"
          aria-label="Toggle menu"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {mobileMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-700 md:hidden">
          <div className="flex flex-col gap-3">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            >
              {t('nav.home', language)}
            </Link>
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            >
              {t('nav.dashboard', language)}
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              >
                {t('nav.admin', language)}
              </Link>
            )}
            <div className="flex items-center gap-3 pt-2">
              <LanguageToggle />
              <DarkModeToggle />
            </div>
            {!isLoading && (
              <div className="border-t border-gray-200 pt-3 dark:border-gray-700">
                {user ? (
                  <div className="flex items-center gap-3">
                    {user.user_metadata?.avatar_url && (
                      <img
                        src={user.user_metadata.avatar_url as string}
                        alt=""
                        className="h-8 w-8 rounded-full"
                      />
                    )}
                    <button
                      onClick={handleLogout}
                      className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                    >
                      {t('common.logout', language)}
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    {t('common.login', language)}
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
