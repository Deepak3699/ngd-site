import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Check, ChevronRight, CircleCheck, Clock3, Code2, GraduationCap, Mail, MessageCircle, ShieldCheck, Sparkles, Globe2 } from 'lucide-react';
import { HeroVisual } from '@/components/hero-visual';
import { LeadForm } from '@/components/lead-form';
import { Reveal } from '@/components/reveal';
import { SectionHeading } from '@/components/section-heading';
import { ServiceIcon } from '@/components/service-icon';
import { StructuredData } from '@/components/structured-data';
import { FaqList } from '@/components/faq-list';
import { services } from '@/lib/content/services';
import { faqs, pricing, processSteps, useCases } from '@/lib/content/site-content';
import { absoluteUrl, site, whatsappUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: { absolute: 'NGD Solutions (NextGenDev Solutions) | Websites, Mobile Apps & AI Automation' },
  description: 'NGD Solutions builds fast websites, web and mobile apps, AI automations and digital growth systems for businesses. Clear scope, honest pricing and student mentorship.',
  alternates: { canonical: '/' },
};

const homeSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': absoluteUrl('/#webpage'),
      url: absoluteUrl('/'),
      name: 'NGD Solutions (NextGenDev Solutions) | Websites, Apps & AI',
      isPartOf: { '@id': absoluteUrl('/#website') },
      about: { '@id': absoluteUrl('/#organization') },
      description: 'Digital product design and development for businesses, plus practical mentorship for students.',
      inLanguage: 'en-IN',
    },
    {
      '@type': 'ItemList',
      name: 'NGD Solutions services',
      itemListElement: services.map((service, index) => ({
        '@type': 'ListItem', position: index + 1, name: service.title, url: absoluteUrl(`/services/${service.slug}`),
      })),
    },
    {
      '@type': 'FAQPage',
      '@id': absoluteUrl('/#faq-schema'),
      mainEntity: faqs.map((item) => ({ '@type': 'Question', name: item.question, acceptedAnswer: { '@type': 'Answer', text: item.answer } })),
    },
    {
      '@type': 'OfferCatalog',
      '@id': absoluteUrl('/#pricing-catalog'),
      name: 'NGD Solutions Pricing',
      itemListElement: pricing.map((plan, index) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: plan.name, description: plan.description },
        priceCurrency: 'INR',
      })),
    },
  ],
};

export default function HomePage() {
  return (
    <main id="main-content">
      <StructuredData data={homeSchema} />

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-grid-bg" aria-hidden="true" />
        <div className="hero-glow hero-glow-one" aria-hidden="true" />
        <div className="hero-glow hero-glow-two" aria-hidden="true" />
        <div className="container hero-layout">
          <div className="hero-copy">
            <p className="hero-kicker"><span className="status-dot" />NGD Solutions <i /> NextGenDev Solutions</p>
            <h1 id="hero-title">Websites, apps & AI{' '}<br />built to <em>move</em>{' '}<br />business forward.</h1>
            <p className="hero-intro">We design and build <strong>fast websites, apps and AI automations</strong> that make your business easier to find, trust and run.</p>
            <div className="hero-actions">
              <Link className="button button-primary button-large" href="#contact">Get a free project plan <ArrowRight size={18} /></Link>
              <Link className="button button-ghost button-large" href="/solutions">Explore solutions <ArrowUpRight size={17} /></Link>
            </div>
            <ul className="hero-assurances" aria-label="Our working principles">
              <li><Check size={14} />Clear, written scope</li>
              <li><Check size={14} />You own the code</li>
              <li><Check size={14} />Mobile-first always</li>
            </ul>
          </div>
          <div className="hero-art">
            <HeroVisual />
            <p className="scene-caption"><Sparkles size={13} />Websites, apps and AI—designed as one connected system.</p>
          </div>
        </div>
        <div className="container audience-bar">
          <Link href="#services"><Code2 size={19} /><span>For businesses<small>Build, launch & grow</small></span><ChevronRight size={17} /></Link>
          <Link href="/students"><GraduationCap size={20} /><span>For students<small>Learn by shipping real work</small></span><ChevronRight size={17} /></Link>
          <div><Globe2 size={19} /><span>Remote-first<small>India & worldwide</small></span></div>
        </div>
      </section>

      <section className="section" id="services">
        <div className="container">
          <Reveal>
            <div className="section-heading-row">
              <SectionHeading eyebrow="What we do" title={<>One team for your<br /><em>entire digital stack.</em></>} text="Start with one service or connect several into a single, accountable project. Every recommendation begins with your goal—not our toolset." />
              <Link className="text-link desktop-only" href="/solutions">See how it all fits together <ArrowUpRight size={16} /></Link>
            </div>
          </Reveal>
          <div className="services-grid">
            {services.map((service, index) => (
              <Reveal key={service.slug} delay={(index % 3) * 70}>
                <Link className="service-card" href={`/services/${service.slug}`}>
                  <div className="service-card-top"><span className="service-icon"><ServiceIcon name={service.icon} /></span><span className="card-number">0{index + 1}</span></div>
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                  <div className="service-card-bottom"><span>{service.deliverables[0]}</span><span className="round-arrow"><ArrowUpRight size={17} /></span></div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-use-cases">
        <div className="container">
          <Reveal><SectionHeading eyebrow="Solutions, not just services" title={<>Built around the problem<br />you actually need to <em>solve.</em></>} text="The best result often comes from connecting the right pieces. These are examples of how an NGD engagement can fit together." /></Reveal>
          <div className="use-case-grid">
            {useCases.map((item, index) => (
              <Reveal key={item.number} delay={index * 80}>
                <article className="use-case-card">
                  <div className="use-case-meta"><span>{item.number}</span><p>{item.type}</p></div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                  <ul>{item.stack.map((tag) => <li key={tag}>{tag}</li>)}</ul>
                </article>
              </Reveal>
            ))}
          </div>
          <Reveal className="solution-callout-wrap">
            <div className="solution-callout">
              <span className="solution-callout-icon"><Sparkles size={23} /></span>
              <p><strong>Not sure what you need?</strong> Tell us the bottleneck. We’ll help you choose the smallest sensible solution—even if that means doing less.</p>
              <Link className="text-link" href="#contact">Talk it through <ArrowRight size={16} /></Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section" id="process">
        <div className="container process-layout">
          <Reveal className="process-heading-wrap">
            <SectionHeading eyebrow="A calmer way to build" title={<>No black box.<br />No <em>surprises.</em></>} text="You always know what is happening, what comes next and why a decision is being made." />
            <div className="process-promise"><ShieldCheck size={21} /><p><strong>Your project stays yours.</strong><br />Code, domain, data and accounts are handed over clearly.</p></div>
          </Reveal>
          <div className="process-list">
            {processSteps.map((step, index) => (
              <Reveal key={step.number} delay={index * 60}>
                <article className="process-step">
                  <span>{step.number}</span>
                  <div><h3>{step.title}</h3><p>{step.text}</p></div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-pricing" id="pricing">
        <div className="container">
          <Reveal><SectionHeading eyebrow="Straightforward starting points" title={<>Clear pricing.<br /><em>Defined before we begin.</em></>} text="Use these ranges to plan. Your final quote is written, fixed and tied to an agreed scope before any work starts." align="center" /></Reveal>
          <div className="pricing-grid">
            {pricing.map((plan, index) => (
              <Reveal key={plan.name} delay={index * 55}>
                <article className={`pricing-card${plan.popular ? ' is-popular' : ''}`}>
                  {plan.popular && <span className="popular-badge">Most popular</span>}
                  <p className="pricing-name">{plan.name}</p>
                  <h3>{plan.label}</h3>
                  <p className="pricing-description">{plan.description}</p>
                  <p className="pricing-price">{plan.price}</p>
                  <p className="pricing-note">{plan.note}</p>
                  <ul>{plan.features.map((feature) => <li key={feature}><CircleCheck size={16} />{feature}</li>)}</ul>
                  <Link className={`button ${plan.popular ? 'button-primary' : 'button-secondary'}`} href={`/?type=client&plan=${encodeURIComponent(plan.name)}&need=${encodeURIComponent(plan.need)}#contact`}>Scope this project <ArrowRight size={16} /></Link>
                </article>
              </Reveal>
            ))}
          </div>
          <p className="maintenance-note">Already launched? <strong>Maintenance and support:</strong> ₹1,000–₹5,000/month based on update, backup and monitoring needs.</p>
        </div>
      </section>

      <section className="section entity-section" id="about">
        <div className="container entity-layout">
          <Reveal>
            <p className="eyebrow"><span />About NGD</p>
            <h2>One name. One team.<br /><em>Every digital layer.</em></h2>
          </Reveal>
          <Reveal className="entity-copy" delay={80}>
            <h3>What is NGD Solutions?</h3>
            <p><strong>NGD Solutions is the short name for NextGenDev Solutions.</strong> If you found us by searching NGD Solutions, ngdsolutions, NextGenDev or NextGenDevSolutions, you’re in the same place.</p>
            <p>We’re a remote-first digital solutions agency serving businesses in India and worldwide. Our work covers strategy, design, websites, web and mobile apps, AI automation, SEO and digital growth. Our student track helps emerging developers build practical skills through guided, real-world work.</p>
            <div className="entity-facts"><span><Globe2 size={16} />India & worldwide</span><span><MessageCircle size={16} />Direct human communication</span><span><Code2 size={16} />Modern, maintainable builds</span></div>
          </Reveal>
        </div>
      </section>

      <section className="section" id="faq">
        <div className="container faq-layout">
          <Reveal className="faq-heading-wrap">
            <SectionHeading eyebrow="Frequently asked questions" title={<>Good questions.<br /><em>Straight answers.</em></>} text="The details people usually want before starting a project. Still unsure? Send a note and ask us directly." />
            <a className="button button-secondary" href={whatsappUrl} target="_blank" rel="noreferrer">Ask on WhatsApp <ArrowUpRight size={16} /></a>
          </Reveal>
          <Reveal delay={80}><FaqList items={faqs} /></Reveal>
        </div>
      </section>

      <section className="section contact-section" id="contact">
        <div className="contact-glow" aria-hidden="true" />
        <div className="container contact-layout">
          <Reveal className="contact-copy">
            <p className="eyebrow"><span />Start a conversation</p>
            <h2>Bring the idea.<br />We’ll bring the <em>clarity.</em></h2>
            <p>Tell us what you want to build, fix or improve. We’ll reply within one business day with a useful next step—not a generic sales pitch.</p>
            <div className="next-steps">
              <div><span>1</span><p><strong>We read your note</strong>A real person reviews your goal and context.</p></div>
              <div><span>2</span><p><strong>We clarify the fit</strong>A short conversation if needed, with honest recommendations.</p></div>
              <div><span>3</span><p><strong>You get a clear plan</strong>Scope, timing, price and ownership in writing.</p></div>
            </div>
            <div className="contact-direct">
              <a href={`mailto:${site.email}`}><Mail size={17} />{site.email}</a>
              <span><Clock3 size={17} />Reply within one business day</span>
            </div>
          </Reveal>
          <Reveal className="contact-form-wrap" delay={100}><LeadForm /></Reveal>
        </div>
      </section>
    </main>
  );
}
