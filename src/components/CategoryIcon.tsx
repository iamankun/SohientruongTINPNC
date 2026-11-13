import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Layers,
  Rocket,
  Wrench,
} from 'lucide-react';
import type { CategoryIcon as CategoryIconKey } from '../types';

interface CategoryIconProps {
  iconKey: CategoryIconKey;
  className?: string;
}

export function CategoryIcon({ iconKey, className = 'w-5 h-5' }: CategoryIconProps) {
  switch (iconKey) {
    case 'rocket':
      return <Rocket className={className} aria-hidden="true" />;
    case 'wrench':
      return <Wrench className={className} aria-hidden="true" />;
    case 'clipboard':
      return <ClipboardCheck className={className} aria-hidden="true" />;
    case 'check':
      return <CheckCircle2 className={className} aria-hidden="true" />;
    case 'alert':
      return <AlertTriangle className={className} aria-hidden="true" />;
    case 'layers':
    default:
      return <Layers className={className} aria-hidden="true" />;
  }
}
