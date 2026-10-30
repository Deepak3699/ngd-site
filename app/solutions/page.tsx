import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, CircleCheck } from 'lucide-react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Reveal } from '@/components/reveal';
import { SectionHeading } from '@/components/section-heading';
import { ServiceIcon } from '@/components/service-icon';
import { StructuredData } from '@/components/structured-data';
import { services } from '@/lib/content/services';
import { absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Digital Solutions for Startups & Growing Businesses',
  description: 'Explore connected website, app, brand, SEO, marketing and AI automation solutions from NGD Solutions (NextGenDev Solutions).',
  alternates: { canonical: '/solutions' },
};

const audiences = [
  { title: 'Startups & founders', text: 'Position the offer, look credible and launch a focused MVP without building features nobody asked for.', build: 'Brand · Marketing site · Product MVP' },
  { title: 'Local & service businesses', text: 'Make services easy to understand, improve local discovery and respond to every new enquiry quickly.', build: 'Website · Local SEO · Lead automation' },
  { title: 'E-commerce brands', text: 'Connect storefront experience, conversion tracking and retention journeys instead of treating them separately.', build: 'Storefront · CRO · Email workflows' },
  { title: 'Coaches & creators', text: 'Turn expertise into a clear offer with a useful website, focused landing pages and a manageable content system.', build: 'Offer funnel · Website · Content system' },
  { title: 'SaaS & tech teams', text: 'Support the product with a sharper marketing site, scalable design system and connected internal operations.', build: 'Product UI · Web platform · AI operations' },
  { title: 'Education & institutions', text: 'Build accessible admissions websites, useful portals and student-facing workflows around real administrative needs.', build: 'Admissions site · Portal · Automation' },
];

const schema = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'CollectionPage', '@id': absoluteUrl('/solutions#page'), url: absoluteUrl('/solutions'), name: 'Digital Solutions | NGD Solutions', about: { '@id': absoluteUrl('/#organization') } },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') }, { '@type': 'ListItem', position: 2, name: 'Solutions', item: absoluteUrl('/solutions') }] },
  ],
};

export default function SolutionsPage() {
  return (
    <main id="main-content">
      <StructuredData data={schema} />
      <section className="inner-hero">
        <div className="container">
          <Breadcrumbs items={[{ label: 'Solutions' }]} />
          <div className="inner-hero-grid">
            <div className="inner-hero-copy"><p className="eyebrow"><span />Core solutions</p><h1>One team.<br />Every layer of<br /><em>your digital stack.</em></h1><p>Mix the right capabilities into one fixed-scope solution—planned, designed, built and measured by NGD Solutions.</p><div className="inner-hero-actions"><Link className="button button-primary" href="/#contact">Build your solution <ArrowRight size={17} /></Link><Link className="button button-ghost" href="/#process">See our process <ArrowUpRight size={16} /></Link></div></div>
            <div className="direct-answer"><strong>What “solution-first” means</strong><p>We begin with the business problem, then choose the smallest useful combination of design, technology and growth work. You get one roadmap and one accountable team instead of disconnected deliverables.</p></div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Reveal><SectionHeading eyebrow="Six connected practices" title={<>Choose a starting point.<br /><em>Connect what matters.</em></>} text="Each service works independently. Together, they become a joined-up digital system with fewer handoffs and clearer ownership." /></Reveal>
          <div className="capability-grid">
            {services.map((service, index) => <Reveal key={service.slug} delay={(index % 3) * 60}><article className="capability-card"><div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="service-icon"><ServiceIcon name={service.icon} /></span><span>0{index + 1}</span></div><h3>{service.title}</h3><p>{service.description}</p><ul style={{ display: 'grid', gap: 8, marginTop: 20 }}>{service.deliverables.slice(0, 3).map((item) => <li key={item} style={{ display: 'flex', gap: 7, color: 'var(--subtle)', fontSize: 11 }}><CircleCheck size={14} style={{ flex: '0 0 auto', color: 'var(--accent)' }} />{item}</li>)}</ul><Link className="text-link" style={{ marginTop: 22 }} href={`/services/${service.slug}`}>Explore this service <ArrowRight size={15} /></Link></article></Reveal>)}
          </div>
        </div>
      </section>

      <section className="section section-use-cases">
        <div className="container">
          <Reveal><SectionHeading eyebrow="Who we build for" title={<>Different businesses.<br /><em>Different right answers.</em></>} text="The process stays clear, while the scope adapts to your stage, market, audience and constraints." /></Reveal>
          <div className="use-case-grid" style={{ marginTop: 36 }}>
            {audiences.map((audience, index) => <Reveal key={audience.title} delay={(index % 3) * 60}><article className="use-case-card"><div className="use-case-meta"><span>0{index + 1}</span></div><h3>{audience.title}</h3><p>{audience.text}</p><ul><li>{audience.build}</li></ul></article></Reveal>)}
          </div>
        </div>
      </section>
    </main>
  );
}
