'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BarChart3, X } from 'lucide-react';

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: any[]) => void;
    __ngdGaConfigured?: boolean;
  }
}

const CONSENT_KEY = 'ngd.analytics-consent';
const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

type Consent = 'granted' | 'denied' | null;

export function Analytics() {
  const pathname = usePathname();
  const [consent, setConsent] = useState<Consent>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!gaId) return;
    try {
      const saved = window.localStorage.getItem(CONSENT_KEY);
      if (saved === 'granted' || saved === 'denied') setConsent(saved);
      else setShowBanner(true);
    } catch {
      setShowBanner(true);
    }
    const openSettings = () => setShowBanner(true);
    window.addEventListener('ngd:cookie-settings', openSettings);
    return () => window.removeEventListener('ngd:cookie-settings', openSettings);
  }, []);

  useEffect(() => {
    if (!gaId || consent !== 'granted') {
      if (consent === 'denied') window.gtag?.('consent', 'update', { analytics_storage: 'denied' });
      return;
    }

    window.dataLayer = window.dataLayer || [];
    if (!window.gtag) {
      window.gtag = function gtag() {
        // eslint-disable-next-line prefer-rest-params
        window.dataLayer.push(arguments);
      };
    }
    window.gtag('consent', 'default', { analytics_storage: 'granted' });
    // A returning choice in the same session must override an earlier denial.
    if (window.__ngdGaConfigured) window.gtag('consent', 'update', { analytics_storage: 'granted' });

    if (!window.__ngdGaConfigured) {
      window.gtag('js', new Date());
      window.gtag('config', gaId, { send_page_view: false });
      window.__ngdGaConfigured = true;
    }

    const existing = document.getElementById('ngd-ga-script') as HTMLScriptElement | null;
    if (existing) {
      setReady(true);
      return;
    }
    const script = document.createElement('script');
    script.id = 'ngd-ga-script';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
    script.onload = () => setReady(true);
    document.head.appendChild(script);
  }, [consent]);

  useEffect(() => {
    if (!ready || consent !== 'granted' || !gaId) return;
    window.gtag?.('event', 'page_view', {
      page_title: document.title,
      page_location: window.location.href,
      page_path: pathname,
    });
  }, [pathname, ready, consent]);

  const choose = (value: Exclude<Consent, null>) => {
    setConsent(value);
    setShowBanner(false);
    try { window.localStorage.setItem(CONSENT_KEY, value); } catch { /* private browsing */ }
  };

  if (!gaId || !showBanner) return null;

  return (
    <aside className="consent-banner" aria-label="Analytics cookie preferences">
      <button className="consent-close" type="button" aria-label="Close and use essential cookies only" onClick={() => choose('denied')}><X size={17} /></button>
      <span className="consent-icon"><BarChart3 size={21} /></span>
      <div>
        <strong>A little data helps us improve.</strong>
        <p>We’d like to use Google Analytics to understand site usage. No analytics cookies load without your permission. Read our <Link href="/privacy">privacy policy</Link>.</p>
      </div>
      <div className="consent-actions">
        <button type="button" className="button button-secondary" onClick={() => choose('denied')}>Essential only</button>
        <button type="button" className="button button-primary" onClick={() => choose('granted')}>Allow analytics</button>
      </div>
    </aside>
  );
}
