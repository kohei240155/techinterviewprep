import type { Metadata } from 'next';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'TechPrep — 技術面接準備',
  description: '北米SWE職向け技術面接準備アプリ',
};

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className="min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
        <Providers>
          <main className="mx-auto max-w-7xl px-4 py-8">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
};

export default RootLayout;
