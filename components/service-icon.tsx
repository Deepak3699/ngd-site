import { Bot, Code2, PenTool, Search, Smartphone, TrendingUp } from 'lucide-react';
import type { Service } from '@/lib/content/services';

const icons = {
  code: Code2,
  mobile: Smartphone,
  ai: Bot,
  design: PenTool,
  search: Search,
  growth: TrendingUp,
};

export function ServiceIcon({ name, size = 23 }: { name: Service['icon']; size?: number }) {
  const Icon = icons[name];
  return <Icon size={size} strokeWidth={1.7} aria-hidden="true" />;
}
