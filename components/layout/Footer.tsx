'use client';

import { useLanguage } from '@/hooks/useLanguage';

const Footer = () => {
  const { language } = useLanguage();
  const year = new Date().getFullYear();
  const appName = language === 'ja' ? '技術面接準備アプリ' : 'Tech Interview Prep';

  return (
    <footer className="border-t border-gray-200 py-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
      &copy; {year} TechPrep &mdash; {appName}
    </footer>
  );
};

export default Footer;
