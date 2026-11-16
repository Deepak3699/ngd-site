import type { ReactNode } from 'react';

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function renderInline(value: string): ReactNode[] {
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  const parts = value.split(pattern);

  return parts.filter(Boolean).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={index}>{part.slice(1, -1)}</code>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      const href = link[2];
      const safeHref = href.startsWith('/') || href.startsWith('https://') || href.startsWith('mailto:');
      return safeHref
        ? <a key={index} href={href} target={href.startsWith('https://') ? '_blank' : undefined} rel={href.startsWith('https://') ? 'noreferrer' : undefined}>{link[1]}</a>
        : link[1];
    }
    return part;
  });
}

function renderParagraph(lines: string[], key: number) {
  return <p key={key}>{renderInline(lines.join(' '))}</p>;
}

export function MarkdownContent({ content }: { content: string }) {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];
  let listType: 'ul' | 'ol' | null = null;

  const flushParagraph = () => {
    if (paragraph.length) blocks.push(renderParagraph(paragraph, blocks.length));
    paragraph = [];
  };
  const flushList = () => {
    if (!list.length || !listType) return;
    const items = list.map((item, index) => <li key={index}>{renderInline(item)}</li>);
    blocks.push(listType === 'ol' ? <ol key={blocks.length}>{items}</ol> : <ul key={blocks.length}>{items}</ul>);
    list = [];
    listType = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    const heading = line.match(/^(#{2,3})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      const text = heading[2].replace(/\*\*/g, '').replace(/\*/g, '');
      const id = slugify(text);
      blocks.push(heading[1].length === 2
        ? <h2 id={id} key={blocks.length}>{renderInline(heading[2])}</h2>
        : <h3 id={id} key={blocks.length}>{renderInline(heading[2])}</h3>);
      continue;
    }

    if (line.startsWith('> ')) {
      flushParagraph();
      flushList();
      blocks.push(<blockquote key={blocks.length}>{renderInline(line.slice(2))}</blockquote>);
      continue;
    }

    const unordered = line.match(/^[-*]\s+(.+)$/);
    const ordered = line.match(/^\d+[.)]\s+(.+)$/);
    if (unordered || ordered) {
      flushParagraph();
      const nextType = unordered ? 'ul' : 'ol';
      if (listType && listType !== nextType) flushList();
      listType = nextType;
      list.push((unordered || ordered)![1]);
      continue;
    }

    flushList();
    paragraph.push(line);
  }

  flushParagraph();
  flushList();
  return <div className="prose-content">{blocks}</div>;
}
