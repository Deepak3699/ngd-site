import { NextResponse } from 'next/server';
import { absoluteUrl, site } from '@/lib/site';
import { services } from '@/lib/content/services';
import { pricing, processSteps, faqs } from '@/lib/content/site-content';

export const dynamic = 'force-static';

export async function GET() {
  let content = `# ${site.name}

> ${site.description}

## Entity Disambiguation
Remote-first Indian digital product, web, mobile app, and AI automation agency founded by Deepak Khuttan (hello@ngdsolutions.com, +91 94659 38126); unaffiliated with Bengaluru-registered Nextgendev Solutions Pvt Ltd (CIN U72900KA2021PTC147720) or Australian/UK entities of similar name.

## Services
`;

  services.forEach((service) => {
    content += `### ${service.title}\n${service.description}\n`;
    if (service.deliverables && service.deliverables.length > 0) {
      content += `- Deliverables: ${service.deliverables.join(', ')}\n`;
    }
    content += '\n';
  });

  content += `## Pricing\n`;
  pricing.forEach((plan) => {
    content += `### ${plan.name} (${plan.price})\n${plan.description}\n`;
    if (plan.features && plan.features.length > 0) {
      content += `- Features: ${plan.features.join(', ')}\n`;
    }
    content += '\n';
  });

  content += `## Process\n`;
  processSteps.forEach((step) => {
    content += `### ${step.number}. ${step.title}\n${step.text}\n\n`;
  });

  content += `## FAQ\n`;
  faqs.forEach((faq) => {
    content += `### ${faq.question}\n${faq.answer}\n\n`;
  });

  return new NextResponse(content, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
