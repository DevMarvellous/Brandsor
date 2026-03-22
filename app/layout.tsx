import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Brandsor - AI Brand Name Generator',
  description: 'Generate production-ready brandable startup names with AI.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-white text-black dark:bg-[#0f0f0f] dark:text-white min-h-screen transition-colors duration-300`}>
        {children}
      </body>
    </html>
  );
}
