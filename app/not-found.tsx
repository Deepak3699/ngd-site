import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <main id="main-content" className="not-found">
      <div className="container">
        <p className="eyebrow" style={{ justifyContent: 'center' }}>404 · Page not found</p>
        <h1>Wrong turn.<br /><em>Easy fix.</em></h1>
        <p>The page you requested does not exist or may have moved.</p>
        <Link className="button button-primary" href="/"><ArrowLeft size={17} /> Back to NGD Solutions</Link>
      </div>
    </main>
  );
}
