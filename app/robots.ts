import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/site';

const privatePaths = ['/admin', '/admin/', '/api/', '/ngd-control-8421/'];
const answerCrawlers = ['GPTBot', 'ChatGPT-User', 'ClaudeBot', 'PerplexityBot', 'Google-Extended', 'Applebot-Extended'];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: privatePaths },
      ...answerCrawlers.map((userAgent) => ({ userAgent, allow: '/', disallow: privatePaths })),
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: absoluteUrl('/'),
  };
}
