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
      const safeHref = (href.startsWith('/') && !href.startsWith('//')) || href.startsWith('https://') || href.startsWith('mailto:');
      return safeHref
        ? <a key={index} href={href} target={href.startsWith('https://') ? '_blank' : undefined} rel={href.startsWith('https://') ? 'noreferrer' : undefined}>{link[1]}</a>
        : link[1];
    }
    return part;
  });
}

function splitRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  return trimmed.split('|').map((cell) => cell.trim());
}

function isTableRow(line: string) {
  const trimmed = line.trim();
  return trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.length > 2 && trimmed.indexOf('|', 1) > 0;
}

function isSeparatorRow(line: string) {
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  return trimmed.split('|').every((cell) => /^\s*:?-{2,}:?\s*$/.test(cell));
}

function renderTable(tableLines: string[], key: number) {
  const headerRow = splitRow(tableLines[0]);
  const separatorRow = tableLines.length > 1 && isSeparatorRow(tableLines[1]) ? splitRow(tableLines[1]) : [];
  const bodyRows = tableLines.slice(separatorRow.length ? 2 : 1).map(splitRow);
  if (headerRow.length < 2) return null;
  const alignments = separatorRow.map((cell) => {
    const c = cell.trim();
    if (c.startsWith(':') && c.endsWith(':')) return 'center';
    if (c.endsWith(':')) return 'right';
    if (c.startsWith(':')) return 'left';
    return undefined;
  });
  const thStyle = (i: number) => (alignments[i] ? { textAlign: alignments[i] as 'left' | 'center' | 'right' } : undefined);
  const tdStyle = (i: number) => (alignments[i] ? { textAlign: alignments[i] as 'left' | 'center' | 'right' } : undefined);
  return (
    <div className="prose-table-wrap" key={key}>
      <table className="prose-table">
        <thead>
          <tr>{headerRow.map((cell, i) => <th key={i} style={thStyle(i)}>{renderInline(cell)}</th>)}</tr>
        </thead>
        {bodyRows.length ? (
          <tbody>
            {bodyRows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {headerRow.map((_cell, colIndex) => <td key={colIndex} style={tdStyle(colIndex)}>{renderInline(row[colIndex] ?? '')}</td>)}
              </tr>
            ))}
          </tbody>
        ) : null}
      </table>
    </div>
  );
}

function renderParagraph(lines: string[], key: number) {
  return <p key={key}>{renderInline(lines.join(' '))}</p>;
}

export function MarkdownContent({ content }: { content: string }) {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  // Keep heading anchors unique — duplicate slugs would break in-page links.
  const usedIds = new Set<string>();
  const uniqueId = (value: string) => {
    const base = slugify(value) || 'section';
    let id = base;
    let n = 2;
    while (usedIds.has(id)) id = `${base}-${n++}`;
    usedIds.add(id);
    return id;
  };
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

  for (let rawIndex = 0; rawIndex < lines.length; rawIndex++) {
    const rawLine = lines[rawIndex];
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    if (isTableRow(line)) {
      flushParagraph();
      flushList();
      const tableLines: string[] = [line];
      let nextIndex = rawIndex + 1;
      while (nextIndex < lines.length && isTableRow(lines[nextIndex].trim())) {
        tableLines.push(lines[nextIndex].trim());
        nextIndex++;
      }
      rawIndex = nextIndex - 1;
      const tableBlock = renderTable(tableLines, blocks.length);
      if (tableBlock) blocks.push(tableBlock);
      else {
        for (const tableLine of tableLines) paragraph.push(tableLine);
      }
      continue;
    }

    const heading = line.match(/^(#{2,3})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      const text = heading[2].replace(/\*\*/g, '').replace(/\*/g, '');
      const id = uniqueId(text);
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
