'use client';

import { useLanguage } from '@/hooks/useLanguage';

const LanguageToggle = () => {
  const { language, setLanguage } = useLanguage();

  const toggle = () => {
    setLanguage(language === 'ja' ? 'en' : 'ja');
  };

  return (
    <button
      onClick={toggle}
      className="btn-ghost p-2"
      aria-label={`Switch to ${language === 'ja' ? 'English' : '日本語'}`}
      title={language === 'ja' ? 'English' : '日本語'}
    >
      <span className="material-symbols-outlined text-xl">translate</span>
    </button>
  );
};

export default LanguageToggle;
