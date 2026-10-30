import { Plus } from 'lucide-react';

export function FaqList({ items }: { items: { question: string; answer: string }[] }) {
  return (
    <div className="faq-list">
      {items.map((item, index) => (
        <details key={item.question} className="faq-item" open={index === 0}>
          <summary><span>{item.question}</span><Plus size={20} aria-hidden="true" /></summary>
          <div className="faq-answer"><p>{item.answer}</p></div>
        </details>
      ))}
    </div>
  );
}
