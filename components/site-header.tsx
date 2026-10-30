'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { Logo } from './logo';
import { primaryNav } from '@/lib/site';

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const isActive = (href: string) => href !== '/#' && href.startsWith('/solutions') ? pathname.startsWith('/solutions') : href.startsWith('/students') ? pathname.startsWith('/students') : false;

  return (
    <header className={`site-header${scrolled ? ' is-scrolled' : ''}`}>
      <div className="nav-shell">
        <Logo />
        <nav className="desktop-nav" aria-label="Primary navigation">
          {primaryNav.map((item) => (
            <Link key={item.label} href={item.href} className={isActive(item.href) ? 'active' : ''}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="nav-actions">
          <Link className="button button-small button-primary desktop-cta" href="/#contact">
            Start a project <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
          <button
            className="menu-toggle"
            type="button"
            aria-expanded={open}
            aria-controls="mobile-navigation"
            aria-label={open ? 'Close navigation' : 'Open navigation'}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="mobile-menu-layer">
          <button className="menu-backdrop" aria-label="Close navigation" onClick={() => setOpen(false)} />
          <nav id="mobile-navigation" className="mobile-nav" aria-label="Mobile navigation">
            <p className="eyebrow">Explore NGD</p>
            {primaryNav.map((item, index) => (
              <Link key={item.label} href={item.href} onClick={() => setOpen(false)}>
                <span>0{index + 1}</span>{item.label}<ArrowUpRight size={18} />
              </Link>
            ))}
            <Link className="button button-primary" href="/#contact" onClick={() => setOpen(false)}>
              Get a free project plan <ArrowUpRight size={17} />
            </Link>
            <p className="mobile-nav-note">Websites · Apps · AI · SEO · Student mentorship</p>
          </nav>
        </div>
      )}
    </header>
  );
}
