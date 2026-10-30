import type { ReactNode } from 'react';

export function SectionHeading({ eyebrow, title, text, align = 'left', children }: { eyebrow: string; title: ReactNode; text?: string; align?: 'left' | 'center'; children?: ReactNode }) {
  return (
    <div className={`section-heading section-heading-${align}`}>
      <p className="eyebrow"><span aria-hidden="true" />{eyebrow}</p>
      <h2>{title}</h2>
      {text && <p className="section-intro">{text}</p>}
      {children}
    </div>
  );
}
