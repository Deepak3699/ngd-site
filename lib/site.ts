import config from '@/site.config.json';

const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ngdsolutions.vercel.app';
export const siteUrl = configuredUrl.replace(/\/+$/, '');

export const absoluteUrl = (path = '/') =>
  new URL(path.startsWith('/') ? path : `/${path}`, `${siteUrl}/`).toString();

export const site = {
  name: 'NGD Solutions — NextGenDev Solutions',
  shortName: 'NGD Solutions',
  legalName: 'NextGenDev Solutions',
  aliases: ['NGD Solutions', 'NGDSolutions', 'NextGenDev', 'NextGenDev Solutions', 'NextGenDevSolutions'],
  description:
    'NGD Solutions (NextGenDev Solutions) designs and develops fast websites, web and mobile apps, AI automations, SEO systems and digital brands for businesses, with a dedicated student mentorship track.',
  email: process.env.NEXT_PUBLIC_SITE_EMAIL || config.email,
  phone: process.env.NEXT_PUBLIC_SITE_PHONE || config.phone,
  whatsapp: config.whatsapp,
  whatsappDisplay: config.whatsappDisplay,
  whatsappMessage: config.whatsappMessage,
  hours: config.hours,
  location: config.location,
};

export const whatsappUrl = `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(site.whatsappMessage)}`;

export const socialLinks = [
  { label: 'LinkedIn', url: config.linkedin },
  { label: 'Instagram', url: config.instagram },
  { label: 'X', url: config.x },
  { label: 'GitHub', url: config.github },
].filter((item) => {
  if (!item.url) return false;
  try {
    const parsed = new URL(item.url);
    return parsed.protocol === 'https:' && parsed.pathname !== '/' && parsed.pathname !== '';
  } catch {
    return false;
  }
});

export const primaryNav = [
  { label: 'Services', href: '/#services' },
  { label: 'Solutions', href: '/solutions' },
  { label: 'Process', href: '/#process' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'Students', href: '/students' },
];
