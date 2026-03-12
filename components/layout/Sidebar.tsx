'use client';

import Link from 'next/link';
import { useLanguage } from '@/hooks/useLanguage';
import { t } from '@/lib/i18n';

interface SidebarProps {
  currentPath: string;
  progressPercent?: number;
}

const navItems = [
  { href: '/', icon: 'home', labelKey: 'nav.home' as const },
  { href: '/dashboard', icon: 'bar_chart', labelKey: 'nav.dashboard' as const },
  { href: '/', icon: 'menu_book', labelKey: 'nav.topics' as const },
];

const Sidebar = ({ currentPath, progressPercent }: SidebarProps) => {
  const { language } = useLanguage();

  return (
    <aside className="hidden w-64 shrink-0 flex-col gap-6 lg:flex">
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = currentPath === item.href && item.labelKey !== 'nav.topics';
          return (
            <Link
              key={item.labelKey}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                  : 'text-slate-600 hover:bg-white dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
              {t(item.labelKey, language)}
            </Link>
          );
        })}
      </nav>

      {progressPercent !== undefined && (
        <div className="rounded-2xl bg-primary-600/10 p-5 dark:bg-primary-600/5">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {language === 'ja' ? '学習進捗' : 'Progress'}
          </p>
          <p className="mt-1 text-2xl font-black text-primary-600">
            {progressPercent}%
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-primary-600/10">
            <div
              className="h-full rounded-full bg-primary-600 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
