import type { Metadata } from 'next';
import { Inter, Noto_Sans_JP } from 'next/font/google';
import { Providers } from './providers';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  variable: '--font-noto-sans-jp',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'TechPrep — 技術面接準備',
  description: '北米SWE職向け技術面接準備アプリ',
};

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="ja" className={`${inter.variable} ${notoSansJP.variable}`} suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body className="flex min-h-screen flex-col bg-surface-light font-sans text-gray-900 antialiased dark:bg-surface-dark dark:text-gray-100">
        <Providers>
          <Header />
          <main className="mx-auto w-full max-w-7xl flex-grow px-4 py-10 sm:px-6 lg:px-8">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
};

export default RootLayout;
