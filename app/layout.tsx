import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Brandsor - AI Brand Name Generator',
  description: 'Generate production-ready brandable startup names with AI. Build your entire brand identity from naming to complete brand development with our AI-powered platform.',
  keywords: ['brand name generator', 'AI branding', 'startup names', 'brand identity', 'business naming', 'logo design', 'brand strategy'],
  authors: [{ name: 'Brandsor Team' }],
  creator: 'Brandsor',
  publisher: 'Brandsor',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://brandsor.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://brandsor.vercel.app',
    title: 'Brandsor - AI Brand Name Generator',
    description: 'Generate production-ready brandable startup names with AI. Build your entire brand identity from naming to complete brand development.',
    siteName: 'Brandsor',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Brandsor - AI Brand Name Generator',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Brandsor - AI Brand Name Generator',
    description: 'Generate production-ready brandable startup names with AI. Build your entire brand identity from naming to complete brand development.',
    images: ['/og-image.png'],
    creator: '@brandsor',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  // This tells Next.js exactly where to find your "B" logo
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
    other: [
      {
        rel: 'apple-touch-icon-precomposed',
        url: '/apple-touch-icon.png',
      },
    ],
  },
  manifest: '/manifest.json',
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
