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
    <button onClick={toggle} className="rounded-md p-2 hover:bg-gray-100 dark:hover:bg-gray-800">
      {isDark ? '☀️' : '🌙'}
    </button>
  );
};

export default DarkModeToggle;
