import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { site } from '@/lib/site';

export const metadata: Metadata = { title: 'Terms of Use', description: 'Terms for using the NGD Solutions website and engaging NextGenDev Solutions.', alternates: { canonical: '/terms' } };

export default function TermsPage() {
  return (
    <main id="main-content" className="legal-page">
      <div className="container">
        <Breadcrumbs items={[{ label: 'Terms of use' }]} />
        <p className="eyebrow"><span />Clear expectations</p><h1>Terms of use</h1><p className="legal-updated">Last updated: 30 October 2026</p>
        <div className="legal-content">
          <section><h2>Using this website</h2><p>You may use this website to learn about NextGenDev Solutions and contact us. Do not attempt unauthorised access, disrupt the service, submit unlawful material or use automated systems to overload forms and APIs.</p></section>
          <section><h2>Information and pricing</h2><p>Website content and price ranges are general starting points, not a binding quote. A project begins only when both parties accept a written scope covering deliverables, timeline, price, payment schedule, revisions and support.</p></section>
          <section><h2>Project engagements</h2><p>Each accepted proposal forms the specific agreement for that work. Client responsibilities typically include timely content, feedback, approvals and lawful use of supplied materials. Third-party fees such as domains, hosting, app-store accounts, media spend or paid APIs are separate unless explicitly included.</p></section>
          <section><h2>Ownership and accounts</h2><p>Ownership and licensing of completed work are governed by the written project scope and required payments. Wherever practical, domains, hosting, analytics, advertising and code repositories are created in the client’s name. Third-party frameworks, fonts and services remain subject to their own licences.</p></section>
          <section><h2>Student mentorship and AI use</h2><p>Student services are educational guidance, code review and practical mentorship. Students remain responsible for following institutional rules, academic-integrity requirements and disclosure policies, including any rules about external or AI assistance.</p></section>
          <section><h2>No guaranteed rankings or results</h2><p>We follow sound design, development and search practices, but we do not guarantee search positions, AI citations, revenue, admissions, grades, app-store approval or advertising returns. Outcomes depend on many factors outside a service provider’s control.</p></section>
          <section><h2>Availability and liability</h2><p>We aim to keep website information accurate and the service available, but provide the public website on an “as is” basis to the extent permitted by law. Any service-specific warranties, liabilities and remedies are defined in the applicable signed project agreement.</p></section>
          <section><h2>Contact and changes</h2><p>Questions about these terms can be sent to <a href={`mailto:${site.email}`}>{site.email}</a>. We may revise these terms as the website or services evolve; the current version and date will appear here.</p></section>
        </div>
      </div>
    </main>
  );
}
