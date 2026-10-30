import { MessageCircle } from 'lucide-react';
import { whatsappUrl } from '@/lib/site';

export function WhatsAppFloat() {
  return (
    <a className="whatsapp-float" href={whatsappUrl} target="_blank" rel="noreferrer" aria-label="Chat with NGD Solutions on WhatsApp">
      <span className="whatsapp-pulse" aria-hidden="true" />
      <MessageCircle size={24} strokeWidth={1.9} aria-hidden="true" />
      <span className="whatsapp-label">Let’s talk</span>
    </a>
  );
}
