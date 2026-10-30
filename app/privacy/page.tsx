import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { site } from '@/lib/site';

export const metadata: Metadata = { title: 'Privacy Policy', description: 'How NGD Solutions handles enquiry, website and analytics data.', alternates: { canonical: '/privacy' } };

export default function PrivacyPage() {
  return (
    <main id="main-content" className="legal-page">
      <div className="container">
        <Breadcrumbs items={[{ label: 'Privacy policy' }]} />
        <p className="eyebrow"><span />Your data</p><h1>Privacy policy</h1><p className="legal-updated">Last updated: 30 October 2026</p>
        <div className="legal-content">
          <section><h2>Who we are</h2><p>This website is operated by NextGenDev Solutions (“NGD Solutions”, “we”, “us”). For privacy questions or requests, email <a href={`mailto:${site.email}`}>{site.email}</a> or call {site.phone}.</p></section>
          <section><h2>Information we collect</h2><p>We collect information you choose to submit through an enquiry form, such as your name, email, phone number, project details, company or student information. We also process limited technical data needed for security and abuse prevention. IP addresses used by the enquiry system are salted and hashed rather than stored directly.</p></section>
          <section><h2>How we use information</h2><ul><li>To respond to enquiries and provide requested project or mentorship information.</li><li>To prepare proposals, deliver agreed services and maintain project communication.</li><li>To protect forms and admin access from spam, misuse and unauthorised access.</li><li>To understand aggregate website usage when you explicitly allow analytics.</li></ul><p>We do not sell your personal information or add enquiry details to unrelated marketing lists.</p></section>
          <section><h2>Analytics and cookies</h2><p>Google Analytics loads only after you choose “Allow analytics” in the cookie preference banner. You can choose “Essential only” or change your preference later through the footer. Essential storage may be used for admin sessions, security and remembering your privacy choice.</p></section>
          <section><h2>Service providers and external links</h2><p>We may use trusted providers for hosting, database storage, email or WhatsApp notifications, and analytics. Current infrastructure may include Vercel, Neon and Google Analytics. WhatsApp, email and telephone links take you to third-party services governed by their own privacy terms.</p></section>
          <section><h2>Retention and security</h2><p>We keep enquiry and project information only as long as reasonably needed for communication, service delivery, legal obligations and legitimate business records. We use access controls and hashed admin sessions, but no internet system can be guaranteed completely secure.</p></section>
          <section><h2>Your choices</h2><p>You may ask to access, correct or delete personal information you submitted, subject to applicable law and necessary record-keeping. You can also withdraw analytics consent through Cookie preferences in the footer.</p></section>
          <section><h2>Updates</h2><p>We may update this policy when the website, providers or legal requirements change. The latest version and revision date will always appear on this page.</p></section>
        </div>
      </div>
    </main>
  );
}
