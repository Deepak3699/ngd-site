import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Clock3 } from 'lucide-react';
import { getPublishedPosts } from '@/lib/content/blog';
import { absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Technology Insights, AI Guides & Business Tips',
  description: 'Practical guides on AI, web development, cybersecurity and business technology from NGD Solutions.',
  alternates: { canonical: '/blog' },
  openGraph: {
    type: 'website',
    url: '/blog',
    title: 'The NGD Blog — Technology That Moves Business Forward',
    description: 'Practical guides on AI, web development, cybersecurity and business technology.',
  },
};

export default function BlogIndexPage() {
  const posts = getPublishedPosts();
  const [featured, ...rest] = posts;

  return (
    <main id="main-content" className="blog-page">
      <section className="blog-hero">
        <div className="container">
          <p className="eyebrow"><span />Ideas for what comes next</p>
          <h1>Technology, made<br /><em>practical.</em></h1>
          <p className="blog-hero-copy">Clear explanations, useful tools and practical technology advice for people building what’s next.</p>
          <div className="blog-topic-list" aria-label="Blog topics">
            <span>Artificial intelligence</span><span>Web development</span><span>Cybersecurity</span><span>Business technology</span>
          </div>
        </div>
      </section>

      <section className="section blog-list-section">
        <div className="container">
          {featured ? (
            <>
              <div className="blog-section-heading"><div><p className="eyebrow"><span />Latest thinking</p><h2>Fresh from NGD</h2></div><span className="blog-post-count">{posts.length} {posts.length === 1 ? 'article' : 'articles'}</span></div>
              <article className="blog-featured-card">
                <div className="blog-featured-visual" aria-hidden="true"><span>NGD</span><i>Ideas into impact.</i></div>
                <div className="blog-featured-copy">
                  <span className="blog-category">{featured.category}</span>
                  <h2><Link href={`/blog/${featured.slug}`}>{featured.title}</Link></h2>
                  <p>{featured.description}</p>
                  <div className="blog-card-meta"><span>{new Date(featured.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span><span><Clock3 size={14} />{featured.readingTime} min read</span></div>
                  <Link className="text-link" href={`/blog/${featured.slug}`}>Read article <ArrowUpRight size={16} /></Link>
                </div>
              </article>
              {rest.length > 0 && <div className="blog-card-grid">{rest.map((post) => (
                <article className="blog-card" key={post.slug}>
                  <div className="blog-card-visual" aria-hidden="true"><span>{post.category}</span></div>
                  <div className="blog-card-body"><span className="blog-category">{post.category}</span><h3><Link href={`/blog/${post.slug}`}>{post.title}</Link></h3><p>{post.description}</p><div className="blog-card-meta"><span>{new Date(post.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span><span><Clock3 size={14} />{post.readingTime} min</span></div></div>
                </article>
              ))}</div>}
            </>
          ) : (
            <div className="blog-empty-state">
              <span className="blog-empty-mark">NGD / NOTES</span>
              <p className="eyebrow"><span />The first articles are in progress</p>
              <h2>Useful ideas.<br /><em>Coming soon.</em></h2>
              <p>We’re preparing practical, carefully researched guides on AI, web development, cybersecurity and business technology. Check back soon.</p>
              <Link className="button button-primary" href="/#contact">Talk to NGD Solutions <ArrowRight size={16} /></Link>
            </div>
          )}
        </div>
      </section>
      <section className="blog-bottom-cta"><div className="container"><div><p className="eyebrow"><span />Have a project in mind?</p><h2>Let’s turn the right idea<br />into <em>something useful.</em></h2></div><Link className="button button-primary" href="/#contact">Start a project <ArrowUpRight size={16} /></Link></div></section>
    </main>
  );
}
