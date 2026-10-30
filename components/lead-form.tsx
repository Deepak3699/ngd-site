'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, CheckCircle2, LoaderCircle, RotateCcw } from 'lucide-react';
import { whatsappUrl } from '@/lib/site';

type Category = 'client' | 'student';
type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

const clientNeeds = ['Brand & Design', 'Website / Landing Page', 'Web App / Platform', 'Mobile App', 'Digital Marketing', 'SEO & Content', 'AI & Automation', 'Something else'];
const studentNeeds = ['Portfolio Website', 'Final-Year Project', 'Mentorship', 'Internship Track', 'Other / Not sure'];

export function LeadForm({ defaultCategory = 'client' }: { defaultCategory?: Category }) {
  const formRef = useRef<HTMLFormElement>(null);
  const startedAt = useRef(Date.now());
  const [category, setCategory] = useState<Category>(defaultCategory);
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [error, setError] = useState('');
  const [reference, setReference] = useState('');
  const [plan, setPlan] = useState('');

  useEffect(() => {
    startedAt.current = Date.now();
    const params = new URLSearchParams(window.location.search);
    if (params.get('type') === 'student') setCategory('student');
    if (params.get('type') === 'client') setCategory('client');
    setPlan(params.get('plan') || '');
  }, []);

  useEffect(() => {
    const requestedNeed = new URLSearchParams(window.location.search).get('need');
    if (requestedNeed && formRef.current) {
      const select = formRef.current.elements.namedItem(category === 'student' ? 'studentNeed' : 'clientNeed');
      if (select instanceof HTMLSelectElement && Array.from(select.options).some((option) => option.value === requestedNeed)) {
        select.value = requestedNeed;
      }
    }
  }, [category]);

  const switchCategory = (value: Category) => {
    setCategory(value);
    setSubmitState('idle');
    setError('');
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitState('submitting');
    setError('');

    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    const body = {
      ...payload,
      category,
      elapsedMs: Date.now() - startedAt.current,
      sourceSection: 'contact-form',
      pageUrl: window.location.pathname + window.location.search,
      referrer: document.referrer,
      meta: plan ? { plan } : {},
    };

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || 'Something went wrong. Please try again.');
      setReference(data.ref || '');
      setSubmitState('success');
      form.reset();
      startedAt.current = Date.now();
      try {
        if (window.localStorage.getItem('ngd.analytics-consent') === 'granted') {
          window.gtag?.('event', 'generate_lead', { lead_category: category, plan: plan || undefined });
        }
      } catch { /* analytics is optional and never blocks the form */ }
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Could not send your enquiry. Please email or WhatsApp us instead.');
      setSubmitState('error');
    }
  }

  if (submitState === 'success') {
    return (
      <div className="form-success" role="status">
        <span className="success-icon"><CheckCircle2 size={30} /></span>
        <p className="eyebrow">Enquiry received</p>
        <h3>Thank you. We’ll take it from here.</h3>
        <p>We’ll review your note and reply within one business day with the clearest next step.</p>
        {reference && <code>Reference: {reference}</code>}
        <div className="success-actions">
          <a className="button button-primary" href={whatsappUrl} target="_blank" rel="noreferrer">Continue on WhatsApp <ArrowRight size={16} /></a>
          <button className="button button-secondary" type="button" onClick={() => setSubmitState('idle')}><RotateCcw size={15} /> Send another</button>
        </div>
      </div>
    );
  }

  return (
    <form ref={formRef} className="lead-form" onSubmit={handleSubmit} action="/api/leads" method="post">
      <input type="hidden" name="category" value={category} />
      <div className="form-category" role="group" aria-label="I am enquiring as">
        <button type="button" className={category === 'client' ? 'active' : ''} aria-pressed={category === 'client'} onClick={() => switchCategory('client')}>
          <span>For my business</span><small>Website, app, growth or AI</small>{category === 'client' && <Check size={16} />}
        </button>
        <button type="button" className={category === 'student' ? 'active' : ''} aria-pressed={category === 'student'} onClick={() => switchCategory('student')}>
          <span>I’m a student</span><small>Project, portfolio or mentorship</small>{category === 'student' && <Check size={16} />}
        </button>
      </div>

      <div className="honeypot" aria-hidden="true">
        <label>Leave this field empty<input name="website_url" tabIndex={-1} autoComplete="off" /></label>
      </div>

      <div className="form-grid">
        <label className="field"><span>Your name <b>*</b></span><input name="name" autoComplete="name" required minLength={2} maxLength={90} placeholder="e.g. Simran Kaur" /></label>
        <label className="field"><span>Email address <b>*</b></span><input name="email" type="email" autoComplete="email" required maxLength={160} placeholder="you@example.com" /></label>
        <label className="field"><span>Phone / WhatsApp</span><input name="phone" type="tel" autoComplete="tel" maxLength={30} placeholder="+91 98765 43210" /></label>

        {category === 'client' ? (
          <>
            <label className="field"><span>Company / brand</span><input name="company" autoComplete="organization" maxLength={120} placeholder="Your business name" /></label>
            <label className="field"><span>What do you need?</span><select name="clientNeed" defaultValue=""><option value="" disabled>Select a service</option>{clientNeeds.map((need) => <option key={need} value={need}>{need}</option>)}</select></label>
            <label className="field"><span>Budget range</span><select name="budget" defaultValue=""><option value="">Not sure yet</option><option>₹5k – ₹10k</option><option>₹10k – ₹25k</option><option>₹20k – ₹40k</option><option>₹30k+</option><option>₹1k – ₹5k/mo</option></select></label>
            <label className="field field-full"><span>Ideal timeline</span><select name="timeline" defaultValue=""><option value="">Just exploring</option><option>ASAP</option><option>This month</option><option>This quarter</option></select></label>
          </>
        ) : (
          <>
            <label className="field"><span>College / university</span><input name="college" autoComplete="organization" maxLength={120} placeholder="Your institution" /></label>
            <label className="field"><span>Course / branch</span><input name="course" maxLength={120} placeholder="e.g. BCA, B.Tech CSE" /></label>
            <label className="field"><span>Year of study</span><select name="studyYear" defaultValue=""><option value="">Select year</option><option>1st year</option><option>2nd year</option><option>3rd year</option><option>Final year</option><option>Graduated / looking for work</option></select></label>
            <label className="field field-full"><span>What can we help with?</span><select name="studentNeed" defaultValue=""><option value="" disabled>Select an option</option>{studentNeeds.map((need) => <option key={need} value={need}>{need}</option>)}</select></label>
          </>
        )}

        <label className="field field-full"><span>Tell us about the goal</span><textarea name="message" rows={4} maxLength={2000} placeholder={category === 'client' ? 'What are you trying to build, fix or improve?' : 'What are you working on, and where are you stuck?'} /></label>
      </div>

      {submitState === 'error' && <p className="form-error" role="alert">{error}</p>}
      <div className="form-submit-row">
        <button className="button button-primary" type="submit" disabled={submitState === 'submitting'}>
          {submitState === 'submitting' ? <><LoaderCircle className="spin" size={17} /> Sending…</> : <>Send my enquiry <ArrowRight size={17} /></>}
        </button>
        <p>Free first conversation.<br />No pressure. No spam.</p>
      </div>
      <p className="form-privacy">By submitting, you agree to our <Link href="/privacy">privacy policy</Link>. Your details are used only to respond to your enquiry.</p>
    </form>
  );
}
