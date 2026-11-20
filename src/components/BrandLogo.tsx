import { useState } from 'react';
import { ClipboardCheck } from 'lucide-react';

export const APP_LOGO_PATH = '/assets/aistudio/sohientruong_56c29877.png';

interface BrandLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'badge' | 'dark';
}

const SIZE_CLASSES: Record<NonNullable<BrandLogoProps['size']>, string> = {
  xs: 'w-6 h-6 rounded-lg p-1',
  sm: 'w-8 h-8 rounded-xl p-1',
  md: 'w-9 h-9 rounded-xl p-1.5',
  lg: 'w-12 h-12 rounded-2xl p-2',
};

export function BrandLogo({ size = 'sm', variant = 'badge' }: BrandLogoProps) {
  const [imgError, setImgError] = useState(false);

  const surfaceClass =
    variant === 'dark'
      ? 'bg-slate-800 border border-slate-700'
      : 'bg-blue-600 dark:bg-blue-500 shadow-xs';

  return (
    <span
      className={`${SIZE_CLASSES[size]} ${surfaceClass} inline-flex items-center justify-center shrink-0 overflow-hidden`}
    >
      {!imgError ? (
        <img
          src={APP_LOGO_PATH}
          alt="Logo Sổ hiện trường TINPNC"
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="w-full h-full object-contain"
        />
      ) : (
        <ClipboardCheck className="w-4/5 h-4/5 text-white" aria-hidden="true" />
      )}
    </span>
  );
}
