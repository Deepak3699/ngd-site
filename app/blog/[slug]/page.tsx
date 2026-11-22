import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, Clock3 } from 'lucide-react';
import { notFound } from 'next/navigation';
import { MarkdownContent } from '@/components/markdown-content';
import { ShareButton } from '@/components/share-button';
import { getBlogPost, getPublishedPosts } from '@/lib/content/blog';
import { absoluteUrl } from '@/lib/site';

type PageProps = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getPublishedPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return { title: 'Article not found' };

  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: 'article',
      url: `/blog/${post.slug}`,
      title: post.title,
      description: post.description,
      publishedTime: new Date(post.date).toISOString(),
      modifiedTime: new Date(post.updatedAt || post.date).toISOString(),
      authors: [post.author],
      tags: post.tags,
      images: post.coverImage ? [{ url: post.coverImage }] : undefined,
    },
  };
}

export default async function BlogArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const articleUrl = absoluteUrl(`/blog/${post.slug}`);
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    mainEntityOfPage: { '@type': 'WebPage', '@id': articleUrl },
    headline: post.title,
    description: post.description,
    datePublished: new Date(post.date).toISOString(),
    dateModified: new Date(post.updatedAt || post.date).toISOString(),
    author: { '@type': 'Organization', name: post.author, url: absoluteUrl('/') },
    publisher: { '@type': 'Organization', name: 'NGD Solutions', url: absoluteUrl('/') },
    articleSection: post.category,
    keywords: post.tags.join(', '),
    image: post.coverImage ? [absoluteUrl(post.coverImage)] : undefined,
  };

  return (
    <main id="main-content" className="blog-article-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema).replace(/</g, '\\u003c') }} />
      <div className="container blog-article-container">
        <Link className="blog-back-link" href="/blog"><ArrowLeft size={15} /> Back to all articles</Link>
        <header className="blog-article-header">
          <span className="blog-category">{post.category}</span>
          <h1>{post.title}</h1>
          <p className="blog-article-description">{post.description}</p>
          <div className="blog-article-meta"><span>By {post.author}</span><span>{new Date(post.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span><span><Clock3 size={15} />{post.readingTime} min read</span></div>
          {post.tags.length > 0 && <div className="blog-article-tags">{post.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>}
        </header>
        <article className="blog-article-body"><MarkdownContent content={post.content} /></article>
        <div className="blog-share">
          <div className="blog-share-copy">
            <span className="blog-share-label">Share this article</span>
            <span className="blog-share-hint">Help someone find it — WhatsApp, Facebook, X and more, or copy the link.</span>
          </div>
          <ShareButton title={post.title} url={articleUrl} />
        </div>
        <aside className="blog-article-cta"><p className="eyebrow"><span />Build with clarity</p><h2>Have a technology challenge?</h2><p>Tell NGD what you’re trying to achieve. We’ll help you identify a practical next step.</p><Link className="button button-primary" href="/#contact">Discuss your project <ArrowUpRight size={16} /></Link></aside>
      </div>
    </main>
  );
}
