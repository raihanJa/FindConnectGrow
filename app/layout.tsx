import type { Viewport } from 'next';
import type { ReactNode } from 'react';
import { Footer, Header } from '@/components/Chrome';
import { Providers } from '@/components/providers';
import { loadSiteData } from '@/lib/site-data';
import './globals.css';

export const viewport: Viewport = { width: 'device-width', initialScale: 1 };
export const revalidate = 300; // keep in sync with REVALIDATE in lib/site-data.ts

export default async function RootLayout({ children }: { children: ReactNode }) {
  const data = await loadSiteData();
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&family=JetBrains+Mono:wght@400;500&family=Newsreader:ital,opsz,wght@0,6..72,300..600;1,6..72,300..600&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Providers data={data}>
          <Header />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
