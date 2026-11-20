import { describe, expect, it } from 'vitest';

process.env.DATABASE_URL = '';
delete process.env.ADMIN_PATH;

const { adminPath, digitsOnly, siteConfig, whatsappLink } = await import('../../server/api/_config.js');

describe('_config', () => {
  it('adminPath() defaults to the shared admin path (/ngd-control-8421)', () => {
    expect(adminPath()).toBe('/ngd-control-8421');
  });

  it('reads contact details from site.config.json', () => {
    expect(siteConfig.email).toBe('nextgendevsolution@gmail.com');
    expect(siteConfig.phone).toBe('+91 94659 38126');
    expect(siteConfig.whatsapp).toBe('919465938126');
    expect(siteConfig.hours).toBe('Mon–Fri, 9am–6pm IST');
  });

  it('digitsOnly strips non-digits', () => {
    expect(digitsOnly('+1 (555) 123-4567')).toBe('15551234567');
    expect(digitsOnly('')).toBe('');
  });

  it('whatsappLink builds wa.me links with the configured number', () => {
    expect(whatsappLink('919465938126', '')).toBe('https://wa.me/919465938126');
    expect(whatsappLink('919465938126', 'Hello there')).toBe('https://wa.me/919465938126?text=Hello%20there');
    expect(whatsappLink('')).toBe('');
  });
});
