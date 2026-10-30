import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Blocks, Code2, FolderKanban, GraduationCap, MessagesSquare } from 'lucide-react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { FaqList } from '@/components/faq-list';
import { LeadForm } from '@/components/lead-form';
import { Reveal } from '@/components/reveal';
import { SectionHeading } from '@/components/section-heading';
import { StructuredData } from '@/components/structured-data';
import { absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Student Project & Portfolio Mentorship',
  description: 'NGD for Students: practical guidance for final-year projects, portfolio websites, code reviews and internship readiness from NextGenDev Solutions.',
  alternates: { canonical: '/students' },
};

const benefits = [
  { icon: FolderKanban, title: 'Final-year project guidance', text: 'Clarify the problem, choose a realistic architecture, plan modules and review your code so you understand every important decision.' },
  { icon: Blocks, title: 'A portfolio with a point of view', text: 'Present two or three thoughtful projects with clear case studies, responsible AI disclosure and a website that feels like you.' },
  { icon: Code2, title: 'Practical developer habits', text: 'Learn Git workflows, debugging, readable code, deployment, documentation and how to explain trade-offs in an interview.' },
];

const studentFaqs = [
  { question: 'Who is the NGD student track for?', answer: 'It is for engineering, BCA, MCA, computer-science and self-taught students who want practical help with a portfolio, final-year project, code quality or career readiness.' },
  { question: 'Will NGD complete my assignment for me?', answer: 'No. The student track is built around mentorship and understanding. We can review architecture, debug with you and guide implementation, but you should be able to explain and take responsibility for your academic work.' },
  { question: 'Can you help if my project is already stuck?', answer: 'Yes. Share the current repository, error or project brief. We first identify the smallest blocking issue, then suggest a realistic recovery plan.' },
  { question: 'How much does student mentorship cost?', answer: 'Cost depends on the support needed—such as a one-off code review, a portfolio build or ongoing project guidance. Send your goal and constraints for a clear quote before starting.' },
];

const schema = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'WebPage', url: absoluteUrl('/students'), name: 'NGD for Students | Project and Portfolio Mentorship', about: { '@id': absoluteUrl('/#organization') } },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') }, { '@type': 'ListItem', position: 2, name: 'Students', item: absoluteUrl('/students') }] },
    { '@type': 'FAQPage', mainEntity: studentFaqs.map((item) => ({ '@type': 'Question', name: item.question, acceptedAnswer: { '@type': 'Answer', text: item.answer } })) },
  ],
};

export default function StudentsPage() {
  return (
    <main id="main-content">
      <StructuredData data={schema} />
      <section className="inner-hero">
        <div className="container">
          <Breadcrumbs items={[{ label: 'Students' }]} />
          <div className="inner-hero-grid">
            <div className="inner-hero-copy"><p className="eyebrow"><span />NGD for students</p><h1>Build real skills.<br />Ship work you’re<br /><em>proud to explain.</em></h1><p>Practical guidance for final-year projects, portfolios and early-career growth. You do the learning; we help you make better decisions and get unstuck.</p><div className="inner-hero-actions"><Link className="button button-primary" href="#student-contact">Plan my next step <ArrowRight size={17} /></Link><Link className="button button-ghost" href="/#services">Explore NGD services <ArrowUpRight size={16} /></Link></div></div>
            <div className="direct-answer"><strong>What the student track is for</strong><p>NGD for Students is a mentorship track for project architecture, code reviews, portfolio presentation and practical career preparation. It is not a shortcut around learning or academic responsibility.</p></div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Reveal><SectionHeading eyebrow="Learn by making" title={<>More than a tutorial.<br /><em>A way to think like a builder.</em></>} text="Bring your brief, repository or career goal. We’ll help you break the problem into decisions you can understand and act on." /></Reveal>
          <div className="student-benefits">{benefits.map((benefit, index) => { const Icon = benefit.icon; return <Reveal key={benefit.title} delay={index * 70}><article className="student-benefit"><Icon size={25} strokeWidth={1.6} /><h3>{benefit.title}</h3><p>{benefit.text}</p></article></Reveal>; })}</div>
          <div className="solution-callout" style={{ marginTop: 35 }}><span className="solution-callout-icon"><MessagesSquare size={22} /></span><p><strong>Already partway through a project?</strong> You do not need to start over. Bring the current state and the exact place where things stopped making sense.</p><Link className="text-link" href="#student-contact">Tell us where you’re stuck <ArrowRight size={15} /></Link></div>
        </div>
      </section>

      <section className="section section-use-cases">
        <div className="container faq-layout">
          <Reveal className="faq-heading-wrap"><SectionHeading eyebrow="Student FAQs" title={<>Support with<br /><em>the right boundaries.</em></>} text="Good mentorship should make you more capable and more confident explaining your work." /></Reveal>
          <Reveal delay={70}><FaqList items={studentFaqs} /></Reveal>
        </div>
      </section>

      <section className="section contact-section" id="student-contact">
        <div className="container contact-layout">
          <Reveal className="contact-copy"><p className="eyebrow"><span />Talk with NGD</p><h2>Let’s plan your<br /><em>next step.</em></h2><p>Tell us your course, project or career goal. We’ll suggest the kind of support that fits and give you a clear price before anything begins.</p><div className="next-steps"><div><span><GraduationCap size={14} /></span><p><strong>Student-specific enquiry</strong>Your note goes into the student track, not the business quote queue.</p></div><div><span>2</span><p><strong>A useful first reply</strong>We’ll clarify what you need and what a realistic next milestone looks like.</p></div></div></Reveal>
          <Reveal className="contact-form-wrap" delay={90}><LeadForm defaultCategory="student" /></Reveal>
        </div>
      </section>
    </main>
  );
}
