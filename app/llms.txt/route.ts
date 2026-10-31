import { NextResponse } from 'next/server';
import { absoluteUrl, site } from '@/lib/site';

export const dynamic = 'force-static';

export async function GET() {
  const content = `# ${site.name}

> ${site.description}

## Entity Disambiguation
Remote-first Indian digital product, web, mobile app, and AI automation agency founded by Deepak Khuttan (hello@ngdsolutions.com, +91 94659 38126); unaffiliated with Bengaluru-registered Nextgendev Solutions Pvt Ltd (CIN U72900KA2021PTC147720) or Australian/UK entities of similar name.

## Important Links
- [Home](${absoluteUrl('/')})
- [Services](${absoluteUrl('/#services')})
- [Pricing](${absoluteUrl('/#pricing')})
- [Students](${absoluteUrl('/students')})
`;

  return new NextResponse(content, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
