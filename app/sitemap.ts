import type { MetadataRoute } from 'next';
import { services } from '@/lib/content/services';
import { absoluteUrl } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const pages = [
    { path: '/', priority: 1, changeFrequency: 'weekly' as const },
    { path: '/solutions', priority: 0.9, changeFrequency: 'monthly' as const },
    { path: '/students', priority: 0.8, changeFrequency: 'monthly' as const },
    { path: '/privacy', priority: 0.2, changeFrequency: 'yearly' as const },
    { path: '/terms', priority: 0.2, changeFrequency: 'yearly' as const },
  ];
  return [
    ...pages.map((page) => ({ url: absoluteUrl(page.path), lastModified, changeFrequency: page.changeFrequency, priority: page.priority })),
    ...services.map((service) => ({ url: absoluteUrl(`/services/${service.slug}`), lastModified, changeFrequency: 'monthly' as const, priority: 0.85 })),
  ];
}
