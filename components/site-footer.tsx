import Link from 'next/link';
import { ArrowUpRight, Clock3, Mail, MapPin, Phone } from 'lucide-react';
import { Logo } from './logo';
import { CookieSettingsButton } from './cookie-settings-button';
import { primaryNav, site, socialLinks, whatsappUrl } from '@/lib/site';
import { services } from '@/lib/content/services';
import { gaMeasurementId } from '@/lib/analytics';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-cta">
          <div>
            <p className="eyebrow"><span />Have a project in mind?</p>
            <h2>Let’s make the next step<br /><em>clear.</em></h2>
          </div>
          <Link href="/#contact" className="button button-light">
            Tell us about it <ArrowUpRight size={18} />
          </Link>
        </div>

        <div className="footer-grid">
          <div className="footer-brand">
            <Logo />
            <p>Useful digital products, honest scopes and thoughtful execution—for businesses and the next generation of builders.</p>
            <a className="footer-whatsapp" href={whatsappUrl} target="_blank" rel="noreferrer">Chat on WhatsApp <ArrowUpRight size={15} /></a>
          </div>
          <div className="footer-column">
            <h3>Services</h3>
            {services.map((service) => <Link key={service.slug} href={`/services/${service.slug}`}>{service.shortTitle}</Link>)}
          </div>
          <div className="footer-column">
            <h3>Explore</h3>
            {primaryNav.map((item) => <Link key={item.label} href={item.href}>{item.label}</Link>)}
            <Link href="/#faq">FAQs</Link>
          </div>
          <div className="footer-column footer-contact">
            <h3>Contact</h3>
            <a href={`mailto:${site.email}`}><Mail size={15} />{site.email}</a>
            <a href={`tel:${site.phone.replace(/\s/g, '')}`}><Phone size={15} />{site.phone}</a>
            <p><Clock3 size={15} />{site.hours}</p>
            <p><MapPin size={15} />{site.location}</p>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} NextGenDev Solutions. All rights reserved.</p>
          <div>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            {gaMeasurementId && <CookieSettingsButton />}
            {socialLinks.map((item) => <a key={item.label} href={item.url} target="_blank" rel="noreferrer">{item.label}</a>)}
          </div>
        </div>
      </div>
    </footer>
  );
}
