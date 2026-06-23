import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import InstallPrompt from '@/components/InstallPrompt';
import UsernameGate from '@/components/UsernameGate';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  // Keep builds resilient when the Google Fonts fetch is unavailable (CI/sandbox):
  // fall back to system fonts instead of failing the build.
  fallback: ['system-ui', 'arial'],
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: 'Brandsor — AI Brand Builder & Name Generator',
  description: 'Generate brand names with AI, then build a full brand identity — logo, palette, typography, and guidelines — with a shareable public brand profile.',
  keywords: ['brand builder', 'brand name generator', 'AI branding', 'brand identity', 'brand guidelines', 'brand kit', 'logo palette typography', 'brand strategy'],
  authors: [{ name: 'Brandsor Team' }],
  creator: 'Brandsor',
  publisher: 'Brandsor',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://brandsor.xyz'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://brandsor.xyz',
    title: 'Brandsor — AI Brand Builder & Name Generator',
    description: 'Generate brand names with AI, build a complete brand identity, and publish a shareable public brand profile.',
    siteName: 'Brandsor',
    // WhatsApp prefers square images (1:1 ratio) but also supports 1.91:1 ratio
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Brandsor — AI Brand Builder & Name Generator',
        type: 'image/png',
      },
      {
        url: '/og-whatsapp.png',
        width: 400,
        height: 400,
        alt: 'Brandsor — AI Brand Builder & Name Generator',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Brandsor — AI Brand Builder & Name Generator',
    description: 'Generate brand names with AI, build a complete brand identity, and publish a shareable public brand profile.',
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
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Set the theme BEFORE first paint to avoid a light→dark flash. Uses the
            user's saved choice (localStorage), falling back to OS preference. The
            ThemeToggle in the navbar flips `.dark` on <html> and persists the choice. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
        {/* Additional meta tags for WhatsApp and other platforms */}
        <meta property="og:site_name" content="Brandsor" />
        <meta property="og:type" content="website" />
        <meta name="theme-color" content="#F2A900" />
        <meta name="msapplication-TileColor" content="#F2A900" />
        {/* iOS PWA: allow "Add to Home Screen" to launch full-screen */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Brandsor" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${inter.className} bg-white text-black dark:bg-[#0f0f0f] dark:text-white min-h-screen transition-colors duration-300`}>
        {children}
        <ServiceWorkerRegister />
        <InstallPrompt />
        <UsernameGate />
      </body>
    </html>
  );
}
