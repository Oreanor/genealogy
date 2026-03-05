import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import {
  getDefaultBookTitle,
  getDefaultMetaDescription,
} from '@/lib/constants/owner';
import { StorageGate } from '@/components/StorageGate';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin', 'cyrillic'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin', 'cyrillic'],
});

export const metadata: Metadata = {
  title: getDefaultBookTitle(),
  description: getDefaultMetaDescription(),
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover' as const,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <StorageGate>{children}</StorageGate>
      </body>
    </html>
  );
}
