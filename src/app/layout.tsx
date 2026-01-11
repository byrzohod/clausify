import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Clausify - AI Contract Analyzer',
  description:
    'Understand your contracts in plain English. AI-powered analysis of legal documents, identifying key terms, obligations, and potential risks.',
  keywords: [
    'contract analysis',
    'AI legal',
    'document analysis',
    'legal tech',
    'contract review',
  ],
  authors: [{ name: 'Clausify' }],
  openGraph: {
    title: 'Clausify - AI Contract Analyzer',
    description: 'Understand your contracts in plain English',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
