import 'server-only';

import fs from 'node:fs';
import path from 'node:path';

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  updatedAt?: string;
  category: string;
  tags: string[];
  author: string;
  coverImage?: string;
  content: string;
  readingTime: number;
};

const contentDirectory = path.join(process.cwd(), 'content', 'blog');

function parseFrontmatter(source: string) {
  const match = source.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/);
  if (!match) return { data: {} as Record<string, string | string[]>, content: source };

  const data: Record<string, string | string[]> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const separator = line.indexOf(':');
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    const rawValue = line.slice(separator + 1).trim();
    if (rawValue.startsWith('[') && rawValue.endsWith(']')) {
      try {
        const parsed: unknown = JSON.parse(rawValue);
        data[key] = Array.isArray(parsed) ? parsed.map(String) : [];
      } catch {
        data[key] = [];
      }
    } else {
      data[key] = rawValue.replace(/^["']|["']$/g, '');
    }
  }

  return { data, content: source.slice(match[0].length).trim() };
}

function estimateReadingTime(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function readPost(filename: string): BlogPost | null {
  const slug = filename.replace(/\.md$/, '');
  if (slug.startsWith('_')) return null;

  const source = fs.readFileSync(path.join(contentDirectory, filename), 'utf8');
  const { data, content } = parseFrontmatter(source);
  if (data.status !== 'published') return null;

  const title = String(data.title || '').trim();
  const description = String(data.description || '').trim();
  const date = String(data.date || '').trim();
  if (!title || !description || !date || !content) return null;

  return {
    slug,
    title,
    description,
    date,
    updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : undefined,
    category: String(data.category || 'Technology'),
    tags: Array.isArray(data.tags) ? data.tags : [],
    author: String(data.author || 'NGD Solutions Editorial Team'),
    coverImage: typeof data.coverImage === 'string' ? data.coverImage : undefined,
    content,
    readingTime: estimateReadingTime(content),
  };
}

export function getPublishedPosts(): BlogPost[] {
  if (!fs.existsSync(contentDirectory)) return [];

  return fs.readdirSync(contentDirectory)
    .filter((filename) => filename.endsWith('.md') && !filename.startsWith('_'))
    .map(readPost)
    .filter((post): post is BlogPost => post !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getBlogPost(slug: string) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
  const filename = `${slug}.md`;
  if (!fs.existsSync(path.join(contentDirectory, filename))) return null;
  return readPost(filename);
}
