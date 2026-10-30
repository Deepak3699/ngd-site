import type { Metadata, Viewport } from 'next';
import { Inter, Instrument_Serif } from 'next/font/google';
import { Analytics } from '@/components/analytics';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { StructuredData } from '@/components/structured-data';
import { WhatsAppFloat } from '@/components/whatsapp-float';
import { absoluteUrl, site, socialLinks } from '@/lib/site';
import { services } from '@/lib/content/services';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const instrumentSerif = Instrument_Serif({ subsets: ['latin'], weight: '400', style: ['normal', 'italic'], variable: '--font-serif', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrlForMetadata()),
  title: {
    default: 'NGD Solutions (NextGenDev Solutions) | Websites, Apps & AI',
    template: '%s | NGD Solutions',
  },
  description: site.description,
  applicationName: site.shortName,
  authors: [{ name: site.legalName, url: siteUrlForMetadata() }],
  creator: site.legalName,
  publisher: site.legalName,
  keywords: ['NGD Solutions', 'NGDSolutions', 'NextGenDev', 'NextGenDev Solutions', 'web development agency India', 'Next.js development', 'AI automation', 'mobile app development', 'SEO and AEO'],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: '/',
    siteName: site.name,
    title: 'NGD Solutions — Build. Launch. Automate.',
    description: 'Websites, apps, AI automation and digital growth—planned clearly and built properly.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NGD Solutions — NextGenDev Solutions',
    description: 'Websites, apps, AI automation and digital growth for businesses, plus practical student mentorship.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
  },
  icons: {
    icon: [
      { url: '/assets/favicon.svg', type: 'image/svg+xml' },
      { url: '/img/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/img/apple-touch-icon.png',
  },
  manifest: '/manifest.webmanifest',
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } : undefined,
  category: 'technology',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#070a12',
  colorScheme: 'dark',
};

function siteUrlForMetadata() {
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://ngdsolutions.com';
}

const entitySchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': absoluteUrl('/#organization'),
      name: site.legalName,
      alternateName: site.aliases,
      url: absoluteUrl('/'),
      logo: { '@type': 'ImageObject', url: absoluteUrl('/img/ngd-logo-white-on-black-1080.png') },
      description: site.description,
      email: site.email,
      telephone: site.phone,
      contactPoint: { '@type': 'ContactPoint', contactType: 'sales', email: site.email, telephone: site.phone, availableLanguage: ['English'] },
      areaServed: [{ '@type': 'Country', name: 'India' }, 'Worldwide'],
      knowsAbout: services.map((service) => service.title),
      sameAs: socialLinks.map((item) => item.url),
    },
    {
      '@type': 'WebSite',
      '@id': absoluteUrl('/#website'),
      url: absoluteUrl('/'),
      name: site.name,
      alternateName: site.aliases,
      description: site.description,
      publisher: { '@id': absoluteUrl('/#organization') },
      inLanguage: 'en-IN',
    },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${instrumentSerif.variable}`}>
      <body>
        <a className="skip-link" href="#main-content">Skip to main content</a>
        <StructuredData data={entitySchema} />
        <SiteHeader />
        {children}
        <SiteFooter />
        <WhatsAppFloat />
        <Analytics />
      </body>
    </html>
  );
}
