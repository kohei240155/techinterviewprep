'use client';

import { useLanguage } from '@/hooks/useLanguage';
import { t } from '@/lib/i18n';

const Footer = () => {
  const { language } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-primary-600/5 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-lg text-primary-600">terminal</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            &copy; {year} TechPrep
          </span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#" className="text-xs font-bold text-slate-500 transition-colors hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400">
            {t('footer.privacy', language)}
          </a>
          <a href="#" className="text-xs font-bold text-slate-500 transition-colors hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400">
            {t('footer.terms', language)}
          </a>
          <a href="#" className="text-xs font-bold text-slate-500 transition-colors hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400">
            {t('footer.community', language)}
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
