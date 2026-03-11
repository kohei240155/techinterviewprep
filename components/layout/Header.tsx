'use client';

const Header = () => {
  return (
    <header className="border-b border-gray-200 dark:border-gray-700">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="text-xl font-bold">TechPrep</div>
        {/* TODO: ナビゲーション、認証状態、言語切替、ダークモード */}
      </nav>
    </header>
  );
};

export default Header;
