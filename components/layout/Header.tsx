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
    <header className="sticky top-0 z-40 border-b border-primary-600/10 bg-white/80 backdrop-blur-md dark:border-primary-600/10 dark:bg-surface-dark/80">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Left: Logo + Search */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 text-xl font-black tracking-tight">
            <span className="material-symbols-outlined text-primary-600">terminal</span>
            TechPrep
          </Link>

          {/* Desktop search (cosmetic) */}
          <div className="hidden items-center gap-2 rounded-lg bg-primary-600/5 px-3 py-1.5 md:flex">
            <span className="material-symbols-outlined text-lg text-gray-400">search</span>
            <span className="text-sm text-gray-400">
              {language === 'ja' ? '検索...' : 'Search...'}
            </span>
          </div>
        </div>

        {/* Right: Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          <Link href="/" className="btn-ghost">
            {t('nav.home', language)}
          </Link>
          <Link href="/dashboard" className="btn-ghost">
            {t('nav.dashboard', language)}
          </Link>
          <Link href="/" className="btn-ghost">
            {t('nav.topics', language)}
          </Link>
          {isAdmin && (
            <Link href="/admin" className="btn-ghost">
              {t('nav.admin', language)}
            </Link>
          )}

          <div className="mx-2 h-5 w-px bg-gray-200 dark:bg-gray-700" />

          <LanguageToggle />
          <DarkModeToggle />

          {!isLoading && (
            <>
              {user ? (
                <div className="flex items-center gap-3 pl-2">
                  {user.user_metadata?.avatar_url && (
                    <img
                      src={user.user_metadata.avatar_url as string}
                      alt=""
                      className="h-8 w-8 rounded-full border-2 border-primary-600/20"
                    />
                  )}
                  <button
                    onClick={handleLogout}
                    className="btn-primary text-xs"
                  >
                    {t('common.signout', language)}
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="btn-primary ml-2"
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
          className="btn-ghost p-2 md:hidden"
          aria-label="Toggle menu"
        >
          <span className="material-symbols-outlined text-2xl">
            {mobileMenuOpen ? 'close' : 'menu'}
          </span>
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="border-t border-primary-600/10 px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="btn-ghost justify-start gap-2"
            >
              <span className="material-symbols-outlined text-lg">home</span>
              {t('nav.home', language)}
            </Link>
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="btn-ghost justify-start gap-2"
            >
              <span className="material-symbols-outlined text-lg">bar_chart</span>
              {t('nav.dashboard', language)}
            </Link>
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="btn-ghost justify-start gap-2"
            >
              <span className="material-symbols-outlined text-lg">menu_book</span>
              {t('nav.topics', language)}
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="btn-ghost justify-start gap-2"
              >
                <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
                {t('nav.admin', language)}
              </Link>
            )}
            <div className="flex items-center gap-3 pt-2">
              <LanguageToggle />
              <DarkModeToggle />
            </div>
            {!isLoading && (
              <div className="border-t border-primary-600/10 pt-3">
                {user ? (
                  <div className="flex items-center gap-3">
                    {user.user_metadata?.avatar_url && (
                      <img
                        src={user.user_metadata.avatar_url as string}
                        alt=""
                        className="h-8 w-8 rounded-full border-2 border-primary-600/20"
                      />
                    )}
                    <button
                      onClick={handleLogout}
                      className="btn-primary text-xs"
                    >
                      {t('common.signout', language)}
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn-primary w-full"
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
