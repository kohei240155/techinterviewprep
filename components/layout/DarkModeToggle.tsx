'use client';

import { useEffect, useState } from 'react';

const DarkModeToggle = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('darkMode');
    const dark = stored === 'true';
    setIsDark(dark);
    document.documentElement.classList.toggle('dark', dark);
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem('darkMode', String(next));
    document.documentElement.classList.toggle('dark', next);
  };

  return (
    <button onClick={toggle} className="btn-ghost p-2" aria-label="Toggle dark mode">
      <span className="material-symbols-outlined text-xl">
        {isDark ? 'light_mode' : 'dark_mode'}
      </span>
    </button>
  );
};

export default DarkModeToggle;
