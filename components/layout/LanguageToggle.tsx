'use client';

import { useLanguage } from '@/hooks/useLanguage';

const LanguageToggle = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex rounded-md border border-gray-300 dark:border-gray-600">
      <button
        onClick={() => setLanguage('ja')}
        className={`px-3 py-1 text-sm ${language === 'ja' ? 'bg-primary-600 text-white' : ''}`}
      >
        日本語
      </button>
      <button
        onClick={() => setLanguage('en')}
        className={`px-3 py-1 text-sm ${language === 'en' ? 'bg-primary-600 text-white' : ''}`}
      >
        EN
      </button>
    </div>
  );
};

export default LanguageToggle;
