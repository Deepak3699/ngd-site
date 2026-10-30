import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, ArrowUpRight, Check, CircleCheck } from 'lucide-react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { FaqList } from '@/components/faq-list';
import { Reveal } from '@/components/reveal';
import { SectionHeading } from '@/components/section-heading';
import { ServiceIcon } from '@/components/service-icon';
import { StructuredData } from '@/components/structured-data';
import { getService, services } from '@/lib/content/services';
import { processSteps } from '@/lib/content/site-content';
import { absoluteUrl, site } from '@/lib/site';

export function generateStaticParams() {
  return services.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) return {};
  return {
    title: `${service.title} in India`,
    description: service.description,
    alternates: { canonical: `/services/${service.slug}` },
    openGraph: { title: `${service.title} | NGD Solutions`, description: service.description, url: `/services/${service.slug}` },
  };
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) notFound();
  const path = `/services/${service.slug}`;
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        '@id': absoluteUrl(`${path}#service`),
        name: service.title,
        serviceType: service.title,
        description: service.answer,
        url: absoluteUrl(path),
        provider: { '@id': absoluteUrl('/#organization') },
        areaServed: [{ '@type': 'Country', name: 'India' }, 'Worldwide'],
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
          { '@type': 'ListItem', position: 2, name: 'Services', item: absoluteUrl('/solutions') },
          { '@type': 'ListItem', position: 3, name: service.title, item: absoluteUrl(path) },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: service.faqs.map((item) => ({ '@type': 'Question', name: item.question, acceptedAnswer: { '@type': 'Answer', text: item.answer } })),
      },
    ],
  };

  return (
    <main id="main-content">
      <StructuredData data={schema} />
      <section className="inner-hero">
        <div className="container">
          <Breadcrumbs items={[{ label: 'Services', href: '/solutions' }, { label: service.shortTitle }]} />
          <div className="inner-hero-grid">
            <div className="inner-hero-copy">
              <p className="eyebrow"><span />{service.eyebrow}</p>
              <h1>{service.title}<br /><em>built around your goal.</em></h1>
              <p>{service.description}</p>
              <div className="inner-hero-actions"><Link className="button button-primary" href={`/?type=client&need=${encodeURIComponent(service.slug === 'web-development' ? 'Website / Landing Page' : service.slug === 'mobile-app-development' ? 'Mobile App' : service.slug === 'ai-automation' ? 'AI & Automation' : service.slug === 'seo-content' ? 'SEO & Content' : service.slug === 'digital-marketing' ? 'Digital Marketing' : 'Brand & Design')}#contact`}>Discuss your project <ArrowRight size={17} /></Link><Link className="button button-ghost" href="/#pricing">View pricing <ArrowUpRight size={16} /></Link></div>
            </div>
            <div>
              <div className="service-icon" style={{ width: 54, height: 54, marginBottom: 20 }}><ServiceIcon name={service.icon} size={27} /></div>
              <div className="direct-answer"><strong>The short answer</strong><p>{service.answer}</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Reveal><SectionHeading eyebrow="What this can include" title={<>The right pieces.<br /><em>Nothing padded out.</em></>} text={service.idealFor} /></Reveal>
          <div className="capability-grid">
            {service.capabilities.map((capability, index) => <Reveal key={capability.title} delay={index * 70}><article className="capability-card"><span>0{index + 1}</span><h3>{capability.title}</h3><p>{capability.text}</p></article></Reveal>)}
          </div>
          <div className="capability-grid" style={{ marginTop: 14 }}>
            <Reveal className="deliverable-panel"><h3>Typical deliverables</h3><ul>{service.deliverables.map((item) => <li key={item}><CircleCheck size={17} />{item}</li>)}</ul><p className="ideal-for"><strong>A useful first step</strong>Share your current situation and desired outcome. We’ll recommend a focused scope and tell you what can wait.</p></Reveal>
            <Reveal className="deliverable-panel" delay={70}><h3>What stays clear</h3><ul><li><Check size={17} />Written deliverables and milestones</li><li><Check size={17} />Agreed feedback checkpoints</li><li><Check size={17} />Responsive testing before launch</li><li><Check size={17} />Your code, content and account ownership</li></ul><p className="ideal-for"><strong>Need a connected solution?</strong>This service can be combined with design, SEO, development or automation under one plan.</p></Reveal>
            <Reveal className="deliverable-panel" delay={140}><h3>Start with a conversation</h3><p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 16 }}>A useful recommendation starts with your goal, audience, current tools and constraints—not a pre-selected package.</p><Link className="button button-primary" style={{ marginTop: 24 }} href="/#contact">Get a free project plan <ArrowRight size={16} /></Link><p className="ideal-for"><strong>Contact {site.shortName}</strong>{site.email} · {site.phone}</p></Reveal>
          </div>
        </div>
      </section>

      <section className="section section-use-cases">
        <div className="container process-layout">
          <Reveal className="process-heading-wrap"><SectionHeading eyebrow="How delivery works" title={<>Clear at every<br /><em>checkpoint.</em></>} text="A simple four-stage process keeps the work moving and the decisions visible." /></Reveal>
          <div className="process-list">{processSteps.map((step) => <article className="process-step" key={step.number}><span>{step.number}</span><div><h3>{step.title}</h3><p>{step.text}</p></div></article>)}</div>
        </div>
      </section>

      <section className="section">
        <div className="container faq-layout">
          <Reveal className="faq-heading-wrap"><SectionHeading eyebrow={`${service.shortTitle} FAQs`} title={<>Before you<br /><em>get started.</em></>} text="Direct answers to common questions about this service." /></Reveal>
          <Reveal delay={70}><FaqList items={service.faqs} /></Reveal>
        </div>
      </section>
    </main>
  );
}
