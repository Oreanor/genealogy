import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import {
  getDefaultBookTitle,
  getDefaultMetaDescription,
} from '@/lib/data/owner';
import { StorageGate } from '@/components/StorageGate';
import { RootPersonProvider } from '@/lib/contexts/RootPersonContext';
import { DEFAULT_PAPER_COLOR, PAPER_COLOR_PALETTE } from '@/lib/constants/theme';
import 'leaflet/dist/leaflet.css';
import './globals.css';

const PAPER_PALETTE_JSON = JSON.stringify([...PAPER_COLOR_PALETTE]);
const DEFAULT_PAPER_JSON = JSON.stringify(DEFAULT_PAPER_COLOR);

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var P=${PAPER_PALETTE_JSON};var s=localStorage.getItem('genealogy-paper-color');var p=s&&P.indexOf(s)>=0?s:${DEFAULT_PAPER_JSON};var h=function(x){return{r:parseInt(x.slice(1,3),16),g:parseInt(x.slice(3,5),16),b:parseInt(x.slice(5,7),16)}};var c=h(p);var lum=(0.299*c.r+0.587*c.g+0.114*c.b)/255;var ink=lum>0.5?'#000000':'#ffffff';var dk=function(x,a){var o=h(x);var f=1-a;var t=function(n){return Math.round(n*f).toString(16).padStart(2,'0')};return'#'+t(o.r)+t(o.g)+t(o.b)};var lt=function(x,a){var o=h(x);var t=function(n){return Math.round(n*(1-a)+255*a).toString(16).padStart(2,'0')};return'#'+t(o.r)+t(o.g)+t(o.b)};var rgba=function(x,a){var o=h(x);return'rgba('+o.r+','+o.g+','+o.b+','+a+')'};var pl=lt(p,0.7);var bg=dk(p,0.25);var ac=dk(p,0.5);var ah=dk(p,0.6);var isDk=ink==='#ffffff';var cAc=h(ac);var aLum=(0.299*cAc.r+0.587*cAc.g+0.114*cAc.b)/255;var nbi=aLum>0.5?'#000000':'#ffffff';var r=document.documentElement.style;r.setProperty('--paper',p);r.setProperty('--paper-light',pl);r.setProperty('--book-bg',bg);r.setProperty('--accent',ac);r.setProperty('--accent-hover',ah);r.setProperty('--ink',ink);r.setProperty('--link',ink);r.setProperty('--link-hover',isDk?'rgba(255,255,255,0.85)':'rgba(0,0,0,0.75)');r.setProperty('--ink-muted',isDk?'rgba(255,255,255,0.75)':'rgba(0,0,0,0.75)');r.setProperty('--nav-btn-ink',nbi);r.setProperty('--tree-plaque-fill',pl);r.setProperty('--border',rgba(ah,0.4));r.setProperty('--border-subtle',rgba(ac,0.2));r.setProperty('--surface',pl);r.setProperty('--hotspot-stroke',rgba(ac,0.5));r.setProperty('--hotspot-fill',rgba(ac,0.15));r.setProperty('--hotspot-fill-hover',rgba(ac,0.3));r.colorScheme=isDk?'dark':'light'}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <RootPersonProvider>
          <StorageGate>{children}</StorageGate>
        </RootPersonProvider>
      </body>
    </html>
  );
}
