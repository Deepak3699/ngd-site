import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'NGD Solutions — NextGenDev Solutions',
    short_name: 'NGD Solutions',
    description: 'Websites, apps, AI automation and digital growth for businesses, plus student mentorship.',
    start_url: '/',
    display: 'standalone',
    background_color: '#070a12',
    theme_color: '#070a12',
    icons: [
      { src: '/assets/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/img/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/img/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  };
}
